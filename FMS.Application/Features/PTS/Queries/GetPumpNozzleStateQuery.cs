using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.PTS.PTSStatus;
using MediatR;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using FMS.Domain.Entities.PTS.PTSStatus;

namespace FMS.Application.Features.PTS.Queries
{
    /// <summary>
    /// Query to get the current nozzle state for a pump from latest UploadStatus
    /// Used to validate that nozzle is lifted before authorizing pump
    /// </summary>
    public record GetPumpNozzleStateQuery(string DeviceId, int PumpId)
        : IRequest<FMSResponse<PumpNozzleStateDto>>;

    public class PumpNozzleStateDto
    {
        public int PumpId { get; set; }
        public bool IsNozzleUp { get; set; }
        public int? NozzleNumber { get; set; }
        public DateTime LastUpdated { get; set; }
        public string Status { get; set; } = string.Empty; // "NozzleUp", "NozzleDown", "Unknown"
        public string Message { get; set; } = string.Empty;
    }

    public class GetPumpNozzleStateQueryHandler
        : IRequestHandler<GetPumpNozzleStateQuery, FMSResponse<PumpNozzleStateDto>>
    {
        private readonly IDatabase _redisDb;
        private readonly ILogger<GetPumpNozzleStateQueryHandler> _logger;

        public GetPumpNozzleStateQueryHandler(
            IConnectionMultiplexer redisConnection,
            ILogger<GetPumpNozzleStateQueryHandler> logger)
        {
            _redisDb = redisConnection.GetDatabase();
            _logger = logger;
        }

        public async Task<FMSResponse<PumpNozzleStateDto>> Handle(
            GetPumpNozzleStateQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("[NozzleState] Checking nozzle state for device {DeviceId}, pump {PumpId}",
                    request.DeviceId, request.PumpId);

                // Get latest UploadStatus from Redis (using same key format as UploadStatusCommand)
                var statusKey = $"device:{request.DeviceId}:status";
                var statusJson = await _redisDb.StringGetAsync(statusKey);

                if (statusJson.IsNullOrEmpty)
                {
                    _logger.LogWarning("[NozzleState] No status available for device {DeviceId}", request.DeviceId);
                    return FMSResponse<PumpNozzleStateDto>.Failed(
                        "No recent status available from device. Please wait a moment and try again."
                    );
                }

                var uploadStatus = JsonSerializer.Deserialize<UploadStatus>(statusJson!);
                if (uploadStatus?.Pumps == null)
                {
                    _logger.LogWarning("[NozzleState] Invalid status data structure for device {DeviceId}", request.DeviceId);
                    return FMSResponse<PumpNozzleStateDto>.Failed(
                        "Unable to read pump status. Please try again."
                    );
                }

                var idleStatus = uploadStatus.Pumps.IdleStatus;
                var deviceDateTime = uploadStatus.DateTime;

                // If no IdleStatus, pump might be offline or in other state
                if (idleStatus?.Ids == null || !idleStatus.Ids.Any())
                {
                    _logger.LogWarning("[NozzleState] No idle pumps found for device {DeviceId}", request.DeviceId);
                    return FMSResponse<PumpNozzleStateDto>.Success(new PumpNozzleStateDto
                    {
                        PumpId = request.PumpId,
                        IsNozzleUp = false,
                        Status = "Unknown",
                        Message = "Pump status unknown. Pump may be offline or in use.",
                        LastUpdated = deviceDateTime
                    });
                }

                // Find our pump in IdleStatus.Ids array
                var pumpIndex = idleStatus.Ids.IndexOf(request.PumpId);
                if (pumpIndex == -1)
                {
                    _logger.LogInformation("[NozzleState] Pump {PumpId} not in idle state on device {DeviceId}",
                        request.PumpId, request.DeviceId);

                    return FMSResponse<PumpNozzleStateDto>.Success(new PumpNozzleStateDto
                    {
                        PumpId = request.PumpId,
                        IsNozzleUp = false,
                        Status = "NotIdle",
                        Message = "Pump is not in idle state. May be filling or offline.",
                        LastUpdated = deviceDateTime
                    });
                }

                // Check NozzlesUp array at the same index
                var nozzlesUp = idleStatus.NozzlesUp ?? new System.Collections.Generic.List<int>();
                var nozzleNumber = pumpIndex < nozzlesUp.Count ? nozzlesUp[pumpIndex] : 0;
                var isNozzleUp = nozzleNumber > 0;

                var result = new PumpNozzleStateDto
                {
                    PumpId = request.PumpId,
                    IsNozzleUp = isNozzleUp,
                    NozzleNumber = isNozzleUp ? nozzleNumber : null,
                    Status = isNozzleUp ? "NozzleUp" : "NozzleDown",
                    Message = isNozzleUp
                        ? $"Nozzle {nozzleNumber} is lifted and ready"
                        : "Nozzle is down. Please lift nozzle to continue.",
                    LastUpdated = deviceDateTime
                };

                _logger.LogInformation("[NozzleState] Device {DeviceId}, Pump {PumpId}: {Status} (Nozzle: {Nozzle})",
                    request.DeviceId, request.PumpId, result.Status, result.NozzleNumber);

                return FMSResponse<PumpNozzleStateDto>.Success(result);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "[NozzleState] Error parsing status data for device {DeviceId}",
                    request.DeviceId);
                return FMSResponse<PumpNozzleStateDto>.SystemError(
                    "Error reading pump status. Please try again."
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NozzleState] Unexpected error checking nozzle state for device {DeviceId}, pump {PumpId}",
                    request.DeviceId, request.PumpId);
                return FMSResponse<PumpNozzleStateDto>.SystemError(
                    "Unexpected error checking nozzle state. Please try again."
                );
            }
        }
    }
}
