using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;


namespace FMS.Persistence.FactoryPattern
{
    public class GPSDataContextFactory : IDesignTimeDbContextFactory<GpsdataContext>
    {
        public GpsdataContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<GpsdataContext>();
            //chatgpt: Replace "Your_Connection_String" with your actual connection string.
            var connectionString = "server=10.0.10.150;port=3306;database=gpsdata;user=root;password=Niwewenamimi1000;connection timeout=2000;command timeout=2000;AllowZeroDateTime=True";
            optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(5, 5, 61)));
            optionsBuilder.EnableSensitiveDataLogging();
            optionsBuilder.EnableDetailedErrors();
            optionsBuilder.LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Information);

            return new GpsdataContext(optionsBuilder.Options);
        }
    }
}
