using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSDeviceCommands
{
    public record SaveDeviceConnectionCommand : IRequest<FMSResponseMessage<int>>
    {
        public string DeviceId { get; init; }
        public string IpAddress { get; init; }
        public DateTime ConnectedAt { get; init; }
        public DateTime? DisconnectedAt { get; init; }
        public DateTime LastActivityAt { get; init; }
        public string ConnectionType { get; init; }
        public string Status { get; init; }
    }

    public class SaveDeviceConnectionCommandHandler : IRequestHandler<SaveDeviceConnectionCommand, FMSResponseMessage<int>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<SaveDeviceConnectionCommandHandler> _logger;

        public SaveDeviceConnectionCommandHandler(GpsdataContext context, ILogger<SaveDeviceConnectionCommandHandler> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<FMSResponseMessage<int>> Handle(SaveDeviceConnectionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Try to find the PTS device ID if it exists
                var ptsDevice = await _context.Ptsdevices
                    .FirstOrDefaultAsync(p => p.Ptsid.ToString() == request.DeviceId, cancellationToken);

                if (ptsDevice == null)
                {
                    throw new Exception("Device not found");
                }
                //check if there is an existing connection for this device
                var existingConnection = await _context.DeviceConnections.FirstOrDefaultAsync(d => d.PtsdeviceId == request.DeviceId, cancellationToken);
                if (existingConnection != null)
                {
                    _logger.LogInformation("Device connection already exists for device {DeviceId}, updating connection", request.DeviceId);
                    existingConnection.IpAddress = request.IpAddress;
                    existingConnection.LastActivityAt = DateTime.UtcNow;
                    existingConnection.Status = request.Status;
                    existingConnection.ConnectionType = request.ConnectionType;
                    existingConnection.ConnectedAt = DateTime.UtcNow;
                    //  existingConnection.DisconnectedAt = request.DisconnectedAt;
                }
                else
                {
                    var connection = new DeviceConnection
                    {
                        PtsdeviceId = request.DeviceId,
                        IpAddress = request.IpAddress,
                        ConnectedAt = request.ConnectedAt,
                        //DisconnectedAt = request.DisconnectedAt,
                        LastActivityAt = request.LastActivityAt,
                        ConnectionType = request.ConnectionType,
                        Status = request.Status
                    };


                    _context.DeviceConnections.Add(connection);
                }
                await _context.SaveChangesAsync(cancellationToken);



                _logger.LogInformation(
                    "Saved device connection for device {DeviceId} of type {ConnectionType}",
                    request.DeviceId,
                    request.ConnectionType);

                return new FMSResponseMessage<int>(true, "Device connection saved successfully", 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving device connection for device {DeviceId}", request.DeviceId);
                throw;
            }
        }
    }
}