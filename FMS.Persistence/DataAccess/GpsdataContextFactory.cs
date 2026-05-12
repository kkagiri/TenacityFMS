using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FMS.Persistence.DataAccess;

// Design-time factory to enable EF Core migrations without relying on the web startup project.
public class GpsdataContextFactory : IDesignTimeDbContextFactory<GpsdataContext>
{
    public GpsdataContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<GpsdataContext>();

        // Prefer environment variable if provided; otherwise use a safe local default.
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__FMSConnection")
            ?? "Host=localhost;Port=5432;Database=tenacyfms;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString).UseSnakeCaseNamingConvention();

        return new GpsdataContext(optionsBuilder.Options);
    }
}

