using Microsoft.AspNetCore.DataProtection;
using FluentValidation;
using Manada.API.Auth;
using Manada.API.Bootstrap;
using Manada.API.Endpoints;
using Manada.API.Errors;
using Manada.API.Middleware;
using Manada.API.Options;
using Manada.Application.Users;
using Manada.Infrastructure;
using Manada.Infrastructure.Persistence;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Command-line operator modes. They run and exit; the web server does not start.
var command = args.FirstOrDefault();
if (command == "migrate")
{
    // Migrations run with a separate owner credential. The runtime account has no DDL rights.
    builder.Configuration["ConnectionStrings:ManadaDb"] = builder.Configuration.GetConnectionString("ManadaDbMigrations");
}

builder.WebHost.ConfigureKestrel(options => options.AddServerHeader = false);
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();

builder.Services.Configure<BffOptions>(builder.Configuration.GetSection(BffOptions.SectionName));
builder.Services.AddManadaInfrastructure(builder.Configuration);
builder.Services.AddBffAuthentication(builder.Configuration, builder.Environment);
builder.Services.AddManadaAuthorization();
builder.Services.AddDataProtection().SetApplicationName("Manada");
builder.Services.AddScoped<CsrfProtection>();
builder.Services.AddValidatorsFromAssemblyContaining<CreateAccountRequestValidator>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks().AddDbContextCheck<ManadaDbContext>("database");

var app = builder.Build();

if (command is "migrate" or "bootstrap-superadmin")
{
    using var scope = app.Services.CreateScope();
    if (command == "migrate")
    {
        return await BootstrapCommands.MigrateAsync(scope.ServiceProvider);
    }

    var emailIndex = Array.IndexOf(args, "--email");
    var email = emailIndex >= 0 && emailIndex + 1 < args.Length ? args[emailIndex + 1] : null;
    if (string.IsNullOrWhiteSpace(email))
    {
        Console.Error.WriteLine("Usage: bootstrap-superadmin --email <address>");
        return 1;
    }

    return await BootstrapCommands.BootstrapSuperAdminAsync(scope.ServiceProvider, email);
}

app.UseExceptionHandler();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseAuthentication();
app.UseMiddleware<CsrfMiddleware>();
app.UseAuthorization();

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready").AllowAnonymous();

app.MapBffEndpoints();
app.MapManadaApi();

app.Run();
return 0;
