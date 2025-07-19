using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.PTSService.Commands;
using FMS.Application.Features.PTSService.DTOs;

namespace FMS.Application.Features.PTSService.Services {
    public interface IServiceControlService {
        Task<ServiceStatusDto> ExecuteServiceActionAsync (ServiceAction action, string serviceName);
        Task<ServiceStatusDto> GetServiceStatusAsync (string serviceName);
        Task<List<string>> GetRecentLogsAsync (string logPath, int lineCount = 50);
        Task<bool> IsServiceInstalledAsync (string serviceName);
    }
}