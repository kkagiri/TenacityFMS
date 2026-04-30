/*
 * File:          Program.cs
 * Purpose:       Composition root for the FMS.Sales API host. Runs as a
 *                separately deployable web application; uses the same
 *                Postgres database as FMS but its own DbContext / migrations.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Application;
using FMS.Sales.Persistence;
using FMS.Sales.Persistence.Seeding;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Allow developers to override settings without committing secrets.
// `appsettings.Local.json` and `appsettings.{Environment}.Local.json` should
// be added to .gitignore.
builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.Local.json",
                 optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// FMS.Sales uses its OWN connection string key (`SalesConnection`) so it can
// be deployed against a different database / credentials than the main FMS
// app. It falls back to FMSConnection only when SalesConnection is not set,
// which keeps the dev box working out-of-the-box against the shared Postgres
// instance.
var connectionString =
    builder.Configuration.GetConnectionString("SalesConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__SalesConnection")
    ?? builder.Configuration.GetConnectionString("FMSConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__FMSConnection")
    ?? throw new InvalidOperationException(
        "Set ConnectionStrings:SalesConnection (preferred) or ConnectionStrings:FMSConnection.");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSalesApplication();
builder.Services.AddSalesPersistence(connectionString);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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
