using System;
using System.IO;
using System.Threading.Tasks;
using CommandLine;
using TenacyFMS.Deployment.Interfaces;
using TenacyFMS.Deployment.Models;
using TenacyFMS.Deployment.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;

namespace TenacyFMS.Deployment
{
    class Program
    {
        static async Task<int> Main(string[] args)
        {
            // Define command line options
            var parser = new CommandLine.Parser(with => with.HelpWriter = Console.Error);
            var result = parser.ParseArguments<CommandLineOptions>(args);

            return await result.MapResult(
                async options => await RunDeploymentAsync(options),
                _ => Task.FromResult(1) // Invalid options, error code 1
            );
        }

        private static async Task<int> RunDeploymentAsync(CommandLineOptions options)
        {
            // Create timestamp for logging
            string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");

            // Set up configuration
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{options.Environment ?? Environment.GetEnvironmentVariable("ENVIRONMENT") ?? "production"}.json", optional: true)
                .AddEnvironmentVariables()
                .AddCommandLine(Environment.GetCommandLineArgs())
                .Build();

            // Determine log file path
            string logFilePath = options.LogFile ?? configuration["LogSettings:FilePath"] ?? $"./logs/deployment_log_{timestamp}.txt";
            logFilePath = logFilePath.Replace("{timestamp}", timestamp);

            // Create logs directory if it doesn't exist
            Directory.CreateDirectory(Path.GetDirectoryName(logFilePath));

            // Set up logging
            LogEventLevel minimumLevel = options.Verbose
                ? LogEventLevel.Debug
                : Enum.Parse<LogEventLevel>(configuration["LogSettings:MinimumLevel"] ?? "Information");

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Is(minimumLevel)
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Day)
                .CreateLogger();

            var serviceProvider = ConfigureServices(configuration);
            var logger = serviceProvider.GetRequiredService<ILogger<Program>>();

            try
            {
                logger.LogInformation("Starting deployment process");
                logger.LogInformation($"Deployment parameters: FrontendOnly={options.FrontendOnly}, BackendOnly={options.BackendOnly}");

                // Create deployment service
                var deploymentService = serviceProvider.GetRequiredService<IDeploymentService>();

                // Execute deployment
                bool success = await deploymentService.ExecuteDeploymentAsync(options.FrontendOnly, options.BackendOnly);

                // Handle rollback if needed
                if (!success && options.RollbackOnFailure)
                {
                    logger.LogWarning("Deployment failed, attempting rollback");
                    await deploymentService.RollbackDeploymentAsync(options.FrontendOnly, options.BackendOnly);
                }

                if (success)
                {
                    logger.LogInformation("Deployment completed successfully");
                    return 0;
                }
                else
                {
                    logger.LogError("Deployment failed");
                    return 1;
                }
            }
            catch (Exception ex)
            {
                logger.LogCritical(ex, "Fatal error during deployment");

                // Try to send error notification
                try
                {
                    var notificationService = serviceProvider.GetRequiredService<INotificationService>();
                    await notificationService.SendErrorNotificationAsync(ex);
                }
                catch
                {
                    // Ignore errors in error handling
                }

                return 1;
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        private static IServiceProvider ConfigureServices(IConfiguration configuration)
        {
            var services = new ServiceCollection();

            // Add logging
            services.AddLogging(builder =>
            {
                builder.ClearProviders();
                builder.AddSerilog(dispose: true);
            });

            // Add configuration
            services.AddSingleton(configuration);

            // Add services
            services.AddTransient<IIISManager, IISManager>();
            services.AddTransient<IFileManager, FileManager>();
            services.AddTransient<INotificationService, EmailNotificationService>();
            services.AddTransient<IDeploymentService, DeploymentService>();

            // Add HttpClient
            services.AddHttpClient();

            return services.BuildServiceProvider();
        }
    }
}
