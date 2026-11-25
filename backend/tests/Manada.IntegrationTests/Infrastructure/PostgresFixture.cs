using Manada.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace Manada.IntegrationTests.Infrastructure;

/// <summary>
/// One real PostgreSQL 18 container for the test collection. The application's EF Core migrations
/// are applied once to a template database. Each test then receives its own copy of that template,
/// so tests never see each other's rows. No in-memory provider is used.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private const string TemplateDatabase = "manada_template";

    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("postgres")
        .WithUsername("postgres")
        .WithPassword("test-only-password")
        .Build();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        await ExecuteAdminAsync($"CREATE DATABASE \"{TemplateDatabase}\"");

        await using (var db = CreateContext(ConnectionStringFor(TemplateDatabase)))
        {
            await db.Database.MigrateAsync();
        }

        // Pooled connections to the template would block CREATE DATABASE ... TEMPLATE.
        NpgsqlConnection.ClearAllPools();
    }

    /// <summary>Creates a new, fully migrated and seeded database for one test.</summary>
    public async Task<TestDatabase> CreateDatabaseAsync()
    {
        var name = $"t_{Guid.NewGuid():N}";
        await ExecuteAdminAsync($"CREATE DATABASE \"{name}\" TEMPLATE \"{TemplateDatabase}\"");
        return new TestDatabase(ConnectionStringFor(name));
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    internal static ManadaDbContext CreateContext(string connectionString) =>
        new(new DbContextOptionsBuilder<ManadaDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history", "manada"))
            .Options);

    private string ConnectionStringFor(string database) =>
        new NpgsqlConnectionStringBuilder(_container.GetConnectionString()) { Database = database }.ConnectionString;

    private async Task ExecuteAdminAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(_container.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}

/// <summary>A test-owned database cloned from the migrated template.</summary>
public sealed record TestDatabase(string ConnectionString)
{
    public ManadaDbContext CreateContext() => PostgresFixture.CreateContext(ConnectionString);
}

[CollectionDefinition("Postgres")]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>;
