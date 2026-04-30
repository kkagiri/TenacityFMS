/*
 * File:          SalesPersistenceServiceCollectionExtensions.cs
 * Purpose:       Registers SalesDbContext with snake_case naming and a separate
 *                migrations history table to keep it isolated from the main
 *                FMS context.
 * Last Modified: 2026-04-29
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Sales.Persistence;

public static class SalesPersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddSalesPersistence(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<SalesDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsHistoryTable(SalesDbContext.MigrationsHistoryTable);
                npgsql.MigrationsAssembly(typeof(SalesDbContext).Assembly.GetName().Name);
            });
            options.UseSnakeCaseNamingConvention();
        });
        return services;
    }
}
