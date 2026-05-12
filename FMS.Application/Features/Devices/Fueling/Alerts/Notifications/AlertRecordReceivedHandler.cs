/**
 * File:          AlertRecordReceivedHandler.cs
 * Purpose:       Consumes canonical fueling alert notifications and stores alert records
 *                through the existing PTS alert table.
 * Dependencies:  MediatR, FMS.Devices.Abstractions, GPSDataContext
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - Handle(): Maps AlertRecordMessage to PTSAlertRecord and persists it.
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Fueling.Notifications;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Devices.Fueling.Alerts.Notifications;

public sealed class AlertRecordReceivedHandler : INotificationHandler<AlertRecordReceivedNotification>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<AlertRecordReceivedHandler> _logger;

    public AlertRecordReceivedHandler(
        GpsdataContext context,
        ILogger<AlertRecordReceivedHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(AlertRecordReceivedNotification notification, CancellationToken cancellationToken)
    {
        var message = notification.Message;
        var payload = message.Payload;
        var (deviceType, deviceNumber) = ParseSource(payload.Source);
        var alertCode = TryParseInt(payload.AlertCode);

        var exists = await _context.PTSAlertRecords.AnyAsync(record =>
            record.PtsId == message.ExternalDeviceId
            && record.DeviceType == deviceType
            && record.DeviceNumber == deviceNumber
            && record.AlertCode == alertCode
            && record.DateTime == payload.RaisedAtUtc,
            cancellationToken);

        if (exists)
        {
            _logger.LogDebug("Skipping duplicate canonical alert for provider {Provider}, device {DeviceId}, alert {AlertCode}.",
                message.ProviderName, message.ExternalDeviceId, payload.AlertCode);
            return;
        }

        _context.PTSAlertRecords.Add(new PTSAlertRecord
        {
            PtsId = message.ExternalDeviceId,
            DeviceType = deviceType,
            DeviceNumber = deviceNumber,
            AlertCode = alertCode,
            State = payload.Severity,
            DateTime = payload.RaisedAtUtc,
            ConfigurationId = TryGetHeader(message.Headers, "configurationId"),
            AlarmId = null,
            ProcessedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Canonical alert record processed for provider {Provider}, device {DeviceId}, alert {AlertCode}.",
            message.ProviderName, message.ExternalDeviceId, payload.AlertCode);
    }

    private static (string DeviceType, int DeviceNumber) ParseSource(string? source)
    {
        if (string.IsNullOrWhiteSpace(source))
        {
            return ("PTS", 0);
        }

        var parts = source.Split(':', 2, StringSplitOptions.TrimEntries);
        var deviceType = string.IsNullOrWhiteSpace(parts[0]) ? "PTS" : parts[0];
        var deviceNumber = parts.Length > 1 ? TryParseInt(parts[1]) : 0;
        return (deviceType, deviceNumber);
    }

    private static int TryParseInt(string? value) =>
        int.TryParse(value, out var parsed) ? parsed : 0;

    private static string? TryGetHeader(IReadOnlyDictionary<string, string>? headers, string key) =>
        headers != null && headers.TryGetValue(key, out var value) ? value : null;
}
