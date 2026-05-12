/**
 * File: InTankDeliveryCompletedNotification.cs
 * Purpose: MediatR notification published when a server-side in-tank delivery is detected and persisted.
 *          Consumed by CalibrationExtractionTriggerHandler to automatically extract calibration data points.
 * Dependencies: MediatR
 * Last Modified: 2026-02-10
 */
using System;
using MediatR;

namespace FMS.Application.Features.TankManagement.TankCalibration.Events
{
    public sealed record InTankDeliveryCompletedNotification(
        int DeliveryId,
        int TankId,
        DateTime DetectedAtUtc) : INotification;
}
