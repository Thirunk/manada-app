using Manada.Domain.Identity;
using Manada.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Cryptography;

namespace Manada.API.Auth;

/// <summary>
/// Server-side session store. The browser holds only an opaque key. The authentication
/// ticket, which includes the access and refresh tokens, is encrypted and stored in
/// PostgreSQL. Revocation sets RevokedUtc, so the session is rejected on the next request.
/// </summary>
public sealed class DbTicketStore(IServiceScopeFactory scopes, IDataProtectionProvider dataProtection) : ITicketStore
{
    private const string TicketPurpose = "Manada.SessionTicket.v1";

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ManadaDbContext>();

        var key = CreateKey();
        var userId = ReadUserId(ticket);
        var protectedTicket = Protect(ticket);
        var expires = ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddHours(8);

        db.AuthSessions.Add(new AuthSession(key, userId, protectedTicket, expires));
        await db.SaveChangesAsync();
        return key;
    }

    public async Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ManadaDbContext>();

        var session = await db.AuthSessions.FirstOrDefaultAsync(s => s.Key == key);
        if (session is null || session.IsRevoked)
        {
            return;
        }

        session.Replace(Protect(ticket), ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddHours(8));
        await db.SaveChangesAsync();
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ManadaDbContext>();

        var session = await db.AuthSessions.AsNoTracking().FirstOrDefaultAsync(s => s.Key == key);
        if (session is null || session.IsRevoked || session.ExpiresUtc <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        var protector = dataProtection.CreateProtector(TicketPurpose);
        var bytes = protector.Unprotect(session.ProtectedTicket);
        return TicketSerializer.Default.Deserialize(bytes);
    }

    public async Task RemoveAsync(string key)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ManadaDbContext>();

        var session = await db.AuthSessions.FirstOrDefaultAsync(s => s.Key == key);
        if (session is not null)
        {
            session.Revoke();
            await db.SaveChangesAsync();
        }
    }

    /// <summary>Revokes every session for a user. Used on disablement and sign-out everywhere.</summary>
    public static async Task RevokeAllAsync(ManadaDbContext db, Guid userId)
    {
        var sessions = await db.AuthSessions.Where(s => s.UserId == userId && s.RevokedUtc == null).ToListAsync();
        foreach (var session in sessions)
        {
            session.Revoke();
        }

        await db.SaveChangesAsync();
    }

    private byte[] Protect(AuthenticationTicket ticket)
    {
        var protector = dataProtection.CreateProtector(TicketPurpose);
        return protector.Protect(TicketSerializer.Default.Serialize(ticket));
    }

    private static Guid ReadUserId(AuthenticationTicket ticket)
    {
        var claim = ticket.Principal.FindFirst(ManadaClaims.UserId)
            ?? throw new InvalidOperationException("The session has no application user.");
        return Guid.Parse(claim.Value);
    }

    private static string CreateKey() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
}

/// <summary>Claim names used by the application. Internal claims are never trusted from the browser.</summary>
public static class ManadaClaims
{
    public const string UserId = "manada.user_id";
    public const string Role = "manada.role";
    public const string SessionKey = "manada.session_key";
    public const string Assurance = "manada.assurance";
}

/// <summary>Authentication assurance levels (Keycloak level of authentication, reported as the acr claim).</summary>
public static class AssuranceLevels
{
    public const int Password = 1;
    public const int Mfa = 2;
}
