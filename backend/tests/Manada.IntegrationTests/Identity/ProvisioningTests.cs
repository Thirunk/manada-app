using Manada.Application.Common;
using Manada.Application.Identity;
using Manada.Domain.Identity;
using Manada.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Manada.IntegrationTests.Identity;

/// <summary>
/// Identity provisioning against real PostgreSQL. A verified identity is supplied directly, which
/// stands in for the provider's token; the tests cover the application rules, not the token itself.
/// </summary>
[Collection("Postgres")]
public sealed class ProvisioningTests(PostgresFixture postgres)
{
    private const string Issuer = FixedIssuer.Value;

    private static VerifiedIdentity Identity(string email, string subject, bool verified = true, params string[] providerRoles) =>
        new(Issuer, subject, email, verified, "Sample Person", providerRoles);

    [Fact]
    public async Task First_sign_in_creates_a_customer_only_when_the_provider_claims_no_privileged_role()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var service = new IdentityProvisioningService(db);

        var provisioned = await service.ProvisionAsync(Identity("new.customer@manada.test", "subject-new", verified: true));

        Assert.True(provisioned.Created);
        Assert.Equal(AppRole.Customer, provisioned.Role);
        Assert.Equal(UserStatus.Active, provisioned.Status);
        Assert.True(await db.CustomerProfiles.AnyAsync(p => p.UserId == provisioned.UserId));
    }

    [Theory]
    [InlineData("superadmin")]
    [InlineData("admin")]
    [InlineData("staff")]
    [InlineData("Admin")]
    public async Task First_sign_in_with_a_privileged_provider_role_is_rejected_and_creates_nothing(string providerRole)
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var service = new IdentityProvisioningService(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.ProvisionAsync(Identity("escalate@manada.test", "subject-escalate", providerRoles: providerRole)));

        Assert.False(await db.Users.AnyAsync(u => u.Email == "escalate@manada.test"));
    }

    [Fact]
    public async Task Unverified_first_sign_in_creates_a_pending_customer()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var service = new IdentityProvisioningService(db);

        var provisioned = await service.ProvisionAsync(Identity("pending@manada.test", "subject-pending", verified: false));

        Assert.Equal(UserStatus.PendingVerification, provisioned.Status);
    }

    [Fact]
    public async Task Repeat_sign_in_returns_the_same_account()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var service = new IdentityProvisioningService(db);
        var first = await service.ProvisionAsync(Identity("repeat@manada.test", "subject-repeat"));

        var second = await service.ProvisionAsync(Identity("repeat@manada.test", "subject-repeat"));

        Assert.False(second.Created);
        Assert.Equal(first.UserId, second.UserId);
        Assert.Equal(1, await db.Users.CountAsync(u => u.Email == "repeat@manada.test"));
    }

    [Fact]
    public async Task The_same_subject_from_a_different_issuer_is_a_different_account()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var existing = await Seed.UserAsync(db, AppRole.Customer, issuer: "https://other.test/realms/x", subject: "shared-subject");
        var service = new IdentityProvisioningService(db);

        var provisioned = await service.ProvisionAsync(new VerifiedIdentity(
            Issuer, "shared-subject", "other.issuer@manada.test", true, "Other Issuer", Array.Empty<string>()));

        Assert.True(provisioned.Created);
        Assert.NotEqual(existing.Id, provisioned.UserId);
    }

    [Fact]
    public async Task An_email_owned_by_another_identity_is_a_conflict_and_is_never_linked()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var existing = await Seed.UserAsync(db, AppRole.Customer, issuer: "https://other.test/realms/x", subject: "owner-subject");
        var service = new IdentityProvisioningService(db);

        await Assert.ThrowsAsync<ConflictException>(() =>
            service.ProvisionAsync(Identity(existing.Email, "attacker-subject")));

        Assert.False(await db.ExternalIdentities.AnyAsync(i => i.Subject == "attacker-subject"));
    }

    [Fact]
    public async Task Disabled_accounts_cannot_sign_in()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var disabled = await Seed.UserAsync(db, AppRole.Customer, UserStatus.Disabled, Issuer, "subject-disabled");
        var service = new IdentityProvisioningService(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.ProvisionAsync(new VerifiedIdentity(Issuer, "subject-disabled", disabled.Email, true, "Disabled", Array.Empty<string>())));
    }

    [Fact]
    public async Task Existing_account_keeps_its_database_role_whatever_the_provider_claims()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var customer = await Seed.UserAsync(db, AppRole.Customer, issuer: Issuer, subject: "subject-claims");
        var service = new IdentityProvisioningService(db);

        var provisioned = await service.ProvisionAsync(new VerifiedIdentity(
            Issuer, "subject-claims", customer.Email, true, "Customer", new[] { "superadmin" }));

        // The provider claim is not trusted here. BffAuthentication rejects the mismatch separately.
        Assert.Equal(AppRole.Customer, provisioned.Role);
        Assert.Equal(customer.Id, provisioned.UserId);
    }

    [Fact]
    public async Task Pending_account_is_activated_when_the_provider_confirms_the_email()
    {
        var database = await postgres.CreateDatabaseAsync();
        await using var db = database.CreateContext();
        var pending = await Seed.UserAsync(db, AppRole.Customer, UserStatus.PendingVerification, Issuer, "subject-activate");
        var service = new IdentityProvisioningService(db);

        var provisioned = await service.ProvisionAsync(new VerifiedIdentity(
            Issuer, "subject-activate", pending.Email, true, "Activate", Array.Empty<string>()));

        Assert.Equal(UserStatus.Active, provisioned.Status);
        Assert.Equal(UserStatus.Active, (await db.Users.AsNoTracking().SingleAsync(u => u.Id == pending.Id)).Status);
    }

    [Fact]
    public async Task Concurrent_first_sign_ins_of_one_identity_create_exactly_one_account()
    {
        var database = await postgres.CreateDatabaseAsync();
        var identity = Identity("race.signin@manada.test", "subject-race");

        async Task<ProvisionedUser> SignInAsync()
        {
            // Each sign-in uses its own DbContext, because a DbContext is not safe for concurrent use.
            await using var db = database.CreateContext();
            return await new IdentityProvisioningService(db).ProvisionAsync(identity);
        }

        var results = await Task.WhenAll(SignInAsync(), SignInAsync());

        Assert.Equal(results[0].UserId, results[1].UserId);
        Assert.Equal(1, results.Count(r => r.Created));
        await using var verify = database.CreateContext();
        Assert.Equal(1, await verify.Users.CountAsync(u => u.Email == "race.signin@manada.test"));
    }
}
