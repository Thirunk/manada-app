using Manada.Application.Users;
using Manada.Infrastructure.Identity;
using Manada.Infrastructure.Persistence;
using Manada.IntegrationTests.Infrastructure;

namespace Manada.IntegrationTests.Rbac;

/// <summary>Real UserService, real PermissionService and real PostgreSQL. Only the identity provider is faked.</summary>
public sealed class RbacHarness : IAsyncDisposable
{
    private RbacHarness(TestDatabase database, ManadaDbContext db)
    {
        Database = database;
        Db = db;
        Identity = new FakeIdentityProvider();
        Permissions = new PermissionService(db);
        Users = new UserService(db, Identity, new FixedIssuer(), Permissions);
    }

    public TestDatabase Database { get; }

    public ManadaDbContext Db { get; }

    public FakeIdentityProvider Identity { get; }

    public PermissionService Permissions { get; }

    public UserService Users { get; }

    public static async Task<RbacHarness> CreateAsync(PostgresFixture postgres)
    {
        var database = await postgres.CreateDatabaseAsync();
        return new RbacHarness(database, database.CreateContext());
    }

    public async ValueTask DisposeAsync() => await Db.DisposeAsync();
}
