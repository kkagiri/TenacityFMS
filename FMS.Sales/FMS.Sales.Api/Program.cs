/*
 * File:          Program.cs
 * Purpose:       Composition root for the FMS.Sales API host. Separately
 *                deployable web application; shares the same Postgres
 *                database as FMS but uses its own DbContext / migrations.
 *                Validates JWTs minted by FMS.WebClient (same signing key)
 *                and exposes operator-only billing endpoints.
 * Last Modified: 2026-05-14
 */
using System.Text;
using FMS.Sales.Application;
using FMS.Sales.Persistence;
using FMS.Sales.Persistence.Seeding;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

const string AdminCorsPolicy = "FmsAdminCors";

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.Local.json",
                 optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

var connectionString =
    builder.Configuration.GetConnectionString("SalesConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__SalesConnection")
    ?? builder.Configuration.GetConnectionString("FMSConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__FMSConnection")
    ?? throw new InvalidOperationException(
        "Set ConnectionStrings:SalesConnection (preferred) or ConnectionStrings:FMSConnection.");

var jwtSecret =
    builder.Configuration["JwtSettings:SecretKey"]
    ?? Environment.GetEnvironmentVariable("JwtSettings__SecretKey")
    ?? throw new InvalidOperationException("Set JwtSettings:SecretKey (same as FMS.WebClient).");

var jwtIssuer =
    builder.Configuration["JwtSettings:Issuer"]
    ?? Environment.GetEnvironmentVariable("JwtSettings__Issuer")
    ?? throw new InvalidOperationException("Set JwtSettings:Issuer.");

var jwtAudience =
    builder.Configuration["JwtSettings:Audience"]
    ?? Environment.GetEnvironmentVariable("JwtSettings__Audience")
    ?? throw new InvalidOperationException("Set JwtSettings:Audience.");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5181", "http://localhost:4174" };

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSalesApplication();
builder.Services.AddSalesPersistence(connectionString);

builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy(AdminCorsPolicy, policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddSingleton<FMS.Sales.Api.Services.Invoicing.IPuppeteerBrowserPool, FMS.Sales.Api.Services.Invoicing.PuppeteerBrowserPool>();
builder.Services.AddScoped<FMS.Sales.Api.Services.Invoicing.IInvoicePdfRenderer, FMS.Sales.Api.Services.Invoicing.InvoicePdfRenderer>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(AdminCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Apply migrations + seed defaults at startup. Idempotent.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SalesDbContext>();
    await db.Database.MigrateAsync();
    await SalesSeedData.SeedAsync(db);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "FMS.Sales" }));

app.MapGet("/api/plans", async (SalesDbContext db) =>
{
    var plans = await db.Plans
        .AsNoTracking()
        .Where(p => p.IsActive && p.IsPublic)
        .OrderBy(p => p.SortOrder)
        .Select(p => new
        {
            p.Id,
            p.Code,
            p.Name,
            p.Description,
            Quotas = p.Quotas.Select(q => new { q.Metric, q.IncludedUnits }),
            Features = p.Features.Select(f => new { f.FeatureKey, f.FeatureValue }),
            Prices = p.Prices.Select(pr => new { pr.CurrencyCode, pr.BillingCycle, pr.Amount }),
        })
        .ToListAsync();
    return Results.Ok(plans);
});

app.MapGet("/api/currencies", async (SalesDbContext db) =>
{
    var currencies = await db.Currencies.AsNoTracking().Where(c => c.IsActive).ToListAsync();
    return Results.Ok(currencies);
});

app.Run();
