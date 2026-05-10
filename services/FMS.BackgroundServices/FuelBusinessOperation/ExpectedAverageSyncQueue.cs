/**
 * File: ExpectedAverageSyncQueue.cs
 * Purpose: In-memory channel queue for deferred GPSGate expected-average sync jobs.
 * Dependencies: System.Threading.Channels, ExpectedAverageSyncQueue contracts
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - QueueAsync(): enqueues a vehicle sync request.
 * - DequeueAsync(): waits for the next queued sync request.
 */

using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using FMS.Application.Features.ExpectedFuelAverage.Services;

namespace FMS.BackgroundServices.FuelBusinessOperation;

public class ExpectedAverageSyncQueue : IExpectedAverageSyncQueue
{
    private readonly Channel<ExpectedAverageSyncRequest> _channel = Channel.CreateUnbounded<ExpectedAverageSyncRequest>(
        new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });

    public ValueTask QueueAsync(ExpectedAverageSyncRequest request, CancellationToken cancellationToken = default)
    {
        if (request.VehicleId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(request.VehicleId), "VehicleId must be greater than 0");
        }

        return _channel.Writer.WriteAsync(request, cancellationToken);
    }

    public ValueTask<ExpectedAverageSyncRequest> DequeueAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAsync(cancellationToken);
    }
}