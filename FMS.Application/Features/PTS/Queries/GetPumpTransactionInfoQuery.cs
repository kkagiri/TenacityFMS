using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.PTSServices.PumpService;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTS.Queries
{
    /// <summary>
    /// Query to get detailed pump transaction information from PTS device
    /// Used after authorization success or at EOT to retrieve complete transaction details
    /// </summary>
    public record GetPumpTransactionInfoQuery : IRequest<FMSResponse<Pumptransaction>>
    {
        public string PTSDeviceId { get; init; } = string.Empty;
        public int PumpId { get; init; }
        public int TransactionId { get; init; }
    }

    public class GetPumpTransactionInfoQueryHandler
        : IRequestHandler<GetPumpTransactionInfoQuery, FMSResponse<Pumptransaction>>
    {
        private readonly IPumpService _pumpService;
        private readonly ILogger<GetPumpTransactionInfoQueryHandler> _logger;

        public GetPumpTransactionInfoQueryHandler(
            IPumpService pumpService,
            ILogger<GetPumpTransactionInfoQueryHandler> logger)
        {
            _pumpService = pumpService;
            _logger = logger;
        }

        public async Task<FMSResponse<Pumptransaction>> Handle(
            GetPumpTransactionInfoQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation(
                    "[TransactionInfo] Retrieving transaction {TransactionId} for device {DeviceId}, pump {PumpId}",
                    request.TransactionId, request.PTSDeviceId, request.PumpId);

                // Validate inputs
                if (string.IsNullOrEmpty(request.PTSDeviceId))
                {
                    return FMSResponse<Pumptransaction>.ValidationFailed(
                        new List<string> { "Device ID is required" });
                }

                if (request.PumpId <= 0 || request.PumpId > 50)
                {
                    return FMSResponse<Pumptransaction>.ValidationFailed(
                        new List<string> { "Invalid pump number. Must be between 1 and 50" });
                }

                if (request.TransactionId <= 0)
                {
                    return FMSResponse<Pumptransaction>.ValidationFailed(
                        new List<string> { "Invalid transaction ID" });
                }

                // Call PTS device to get transaction info
                var transaction = await _pumpService.GetPumpTransactionInfoAsync(
                    request.PTSDeviceId,
                    request.PumpId,
                    request.TransactionId);

                if (transaction == null)
                {
                    _logger.LogWarning(
                        "[TransactionInfo] No transaction found for ID {TransactionId}, device {DeviceId}, pump {PumpId}",
                        request.TransactionId, request.PTSDeviceId, request.PumpId);

                    return FMSResponse<Pumptransaction>.Failed(
                        $"Transaction {request.TransactionId} not found");
                }

                _logger.LogInformation(
                    "[TransactionInfo] Successfully retrieved transaction {TransactionId}: Volume={Volume}L, Amount={Amount}",
                    request.TransactionId, transaction.Volume, transaction.Amount);

                return FMSResponse<Pumptransaction>.Success(
                    transaction,
                    "Transaction information retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[TransactionInfo] Error retrieving transaction {TransactionId} for device {DeviceId}, pump {PumpId}",
                    request.TransactionId, request.PTSDeviceId, request.PumpId);

                return FMSResponse<Pumptransaction>.SystemError(
                    $"Error retrieving transaction information: {ex.Message}");
            }
        }
    }
}
