using Manada.Application.Abstractions;
using Manada.Application.Audit;
using Manada.Application.Identity;
using Manada.Application.Settings;
using Manada.Application.Users;
using Manada.Infrastructure.Identity;
using Manada.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Manada.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Registers persistence, identity-provider adapters and application services.</summary>
    public static IServiceCollection AddManadaInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("ManadaDb")
            ?? throw new InvalidOperationException("Connection string 'ManadaDb' is not configured.");

        services.AddDbContext<ManadaDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history", "manada")));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<ManadaDbContext>());

        services.Configure<IdentityProviderOptions>(configuration.GetSection(IdentityProviderOptions.SectionName));
        services.AddHttpClient<KeycloakAdminClient>();
        services.AddScoped<IIdentityProviderAdmin>(sp => sp.GetRequiredService<KeycloakAdminClient>());

        services.AddScoped<IPermissionService, PermissionService>();
        services.AddSingleton<IIdentityIssuer, ConfiguredIdentityIssuer>();
        services.AddScoped<UserService>();
        services.AddSingleton<IUniqueViolationDetector, PostgresUniqueViolationDetector>();
        services.AddScoped<IdentityProvisioningService>();
        services.AddScoped<AuditQueryService>();
        services.AddScoped<SettingsService>();
        services.AddScoped<Manada.Application.Governance.GovernanceService>();
        services.AddScoped<Manada.Application.Users.AccountQueryService>();

        return services;
    }
}
