using FMS.PTS.WindowsService.Infrastructure.Communication.RedisMessageHandling;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.PTS.WindowsService.Infrastructure.Communication.RedisMessageHandling {
    //Cursor: Added hosted service to properly start RedisPTSCommandProcessor
    public class RedisPTSCommandProcessorHostedService : BackgroundService {
        private readonly RedisPTSCommandProcessor _commandProcessor;
        private readonly ILogger<RedisPTSCommandProcessorHostedService> _logger;

        public RedisPTSCommandProcessorHostedService (
            RedisPTSCommandProcessor commandProcessor,
            ILogger<RedisPTSCommandProcessorHostedService> logger) {
            _commandProcessor = commandProcessor ??
                throw new ArgumentNullException (nameof (commandProcessor));
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            try {
                _logger.LogInformation ("Starting Redis PTS Command Processor...");
                await _commandProcessor.Start ();
                _logger.LogInformation ("Redis PTS Command Processor started successfully");

                // Keep the service running until cancellation is requested
                while (!stoppingToken.IsCancellationRequested) {
                    await Task.Delay (1000, stoppingToken);
                }
            } catch (OperationCanceledException) {
                _logger.LogInformation ("Redis PTS Command Processor service is stopping due to cancellation");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error in Redis PTS Command Processor service");
                throw;
            }
        }

        public override async Task StopAsync (CancellationToken cancellationToken) {
            _logger.LogInformation ("Stopping Redis PTS Command Processor service...");
            await base.StopAsync (cancellationToken);
            _logger.LogInformation ("Redis PTS Command Processor service stopped");
        }
    }
}