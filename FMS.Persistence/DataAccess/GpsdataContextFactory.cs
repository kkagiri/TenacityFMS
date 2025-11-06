using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace FMS.Persistence.DataAccess;

// Design-time factory to enable EF Core migrations without relying on the web startup project.
public class GpsdataContextFactory : IDesignTimeDbContextFactory<GpsdataContext>
{
    public GpsdataContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<GpsdataContext>();

        // Prefer environment variable if provided; otherwise use a safe local default.
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__FMSConnection");


        // Specify a server version explicitly to avoid requiring a live connection during design time.
        var serverVersion = new MySqlServerVersion(new Version(5, 5, 6));

        optionsBuilder.UseMySql(connectionString, serverVersion);

        return new GpsdataContext(optionsBuilder.Options);
    }
}
