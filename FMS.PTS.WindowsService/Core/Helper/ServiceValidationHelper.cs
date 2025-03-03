using FMS.Application.Handlers.Interface;
using FMS.Infrastructure.webSocket;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace FMS.PTS.WindowsService.Core.Helper
{
    public class ServiceValidationHelper
    {
        private readonly ILogger<ServiceValidationHelper> _logger;
        private readonly IServiceProvider _serviceProvider;

        private record ValidationResult(bool IsValid, string Message);

        private async Task<ValidationResult> ValidateService<T>(Func<T, Task<bool>> healthCheck = null)
        {
            try
            {
                _logger.LogDebug("Validating service: {ServiceType}", typeof(T).Name);

                // First level: Can we resolve it?
                var service = _serviceProvider.GetService<T>();
                if (service == null)
                    return new ValidationResult(false, $"Unable to resolve {typeof(T).Name}");

                // Second level: Custom health check
                if (healthCheck != null)
                {
                    if (!await healthCheck(service))
                        return new ValidationResult(false, $"{typeof(T).Name} failed health check");
                }

                return new ValidationResult(true, $"{typeof(T).Name} validated successfully");
            }
            catch (Exception ex)
            {
                return new ValidationResult(false, $"Error validating {typeof(T).Name}: {ex.Message}");
            }
        }

        public async Task ValidateWebSocketServices()
        {
            _logger.LogInformation("Beginning comprehensive service validation...");

            var validations = new List<Task<ValidationResult>>
        {
            ValidateService<IMediator>(),
            ValidateService<HttpListener>(async listener =>
            {
                // Verify listener can actually bind
                try {
                    listener.Start();
                    listener.Stop();
                    return true;
                }
                catch {
                    return false;
                }
            }),
            ValidateService<BufferManager>(manager => Task.FromResult(manager.TakeBuffer() != null)),
            ValidateService<IPTSMessageProcessor>(),
            ValidateService<PTSServiceSettings>(settings => Task.FromResult(settings != null &&  !string.IsNullOrEmpty(settings.WebSocket.BasePath)))
        };

            var results = await Task.WhenAll(validations);
            var failedValidations = results.Where(r => !r.IsValid);

            if (failedValidations.Any())
            {
                var failures = string.Join(Environment.NewLine,
                    failedValidations.Select(f => $"- {f.Message}"));
                throw new InvalidOperationException(
                    $"Service validation failed:{Environment.NewLine}{failures}");
            }

            _logger.LogInformation("All services validated successfully");
        }
    }
}
