/*
 * File:          SalesDbContextFactory.cs
 * Purpose:       Design-time factory for `dotnet ef` tooling. Reads the
 *                connection string from the SalesConnection environment
 *                variable (preferred) so migrations can be generated without
 *                spinning up the API host.
 * Last Modified: 2026-04-29
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FMS.Sales.Persistence;

public class SalesDbContextFactory : IDesignTimeDbContextFactory<SalesDbContext>
{
    public SalesDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__SalesConnection")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__FMSConnection")
            ?? throw new InvalidOperationException(
                "Set ConnectionStrings__SalesConnection (preferred) or ConnectionStrings__FMSConnection " +
                "before running EF tooling.");

        var optionsBuilder = new DbContextOptionsBuilder<SalesDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsHistoryTable(SalesDbContext.MigrationsHistoryTable);
            npgsql.MigrationsAssembly(typeof(SalesDbContext).Assembly.GetName().Name);
        });
        optionsBuilder.UseSnakeCaseNamingConvention();
        return new SalesDbContext(optionsBuilder.Options);
    }
}
