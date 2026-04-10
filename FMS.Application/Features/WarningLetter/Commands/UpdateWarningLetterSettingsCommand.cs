/**
 * File: UpdateWarningLetterSettingsCommand.cs
 * Purpose: Persists Warning Letter admin settings (fuel price per litre) to SystemConfigurations.
 * Dependencies: MediatR, ISystemConfigurationService, FMSResponse, WarningLetterSettingsDto
 * Last Modified: 2026-04-08
 */
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Features.WarningLetter.Queries;
using FMS.Application.Services.Configuration;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.WarningLetter.Commands;

public class UpdateWarningLetterSettingsCommand : IRequest<FMSResponse<WarningLetterSettingsDto>>
{
    public WarningLetterSettingsDto Settings { get; set; } = new();
}

public class UpdateWarningLetterSettingsCommandHandler
    : IRequestHandler<UpdateWarningLetterSettingsCommand, FMSResponse<WarningLetterSettingsDto>>
{
    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly ILogger<UpdateWarningLetterSettingsCommandHandler> _logger;

    public UpdateWarningLetterSettingsCommandHandler(
        ISystemConfigurationService systemConfigurationService,
        ILogger<UpdateWarningLetterSettingsCommandHandler> logger)
    {
        _systemConfigurationService = systemConfigurationService;
        _logger = logger;
    }

    public async Task<FMSResponse<WarningLetterSettingsDto>> Handle(
        UpdateWarningLetterSettingsCommand request,
        CancellationToken cancellationToken)
    {
        if (request.Settings == null)
        {
            return FMSResponse<WarningLetterSettingsDto>.Failed("Settings payload is required.");
        }

        if (request.Settings.FuelPricePerLitre < 0m)
        {
            return FMSResponse<WarningLetterSettingsDto>.Failed("Fuel price per litre cannot be negative.");
        }

        if (request.Settings.MaxWarningCountBeforeLast <= 0)
        {
            return FMSResponse<WarningLetterSettingsDto>.Failed("Maximum warning count before last warning must be greater than zero.");
        }

        var valueAsString = request.Settings.FuelPricePerLitre.ToString(CultureInfo.InvariantCulture);
        var issuerName = request.Settings.IssuerName?.Trim() ?? string.Empty;
        var issuerTitle = request.Settings.IssuerTitle?.Trim() ?? string.Empty;
        var maxWarningCountValue = request.Settings.MaxWarningCountBeforeLast.ToString(CultureInfo.InvariantCulture);

        var fuelPriceUpdated = await _systemConfigurationService.UpdateConfigurationAsync(
            GetWarningLetterSettingsQueryHandler.FuelPricePerLitreConfigKey,
            valueAsString,
            cancellationToken);

        var issuerNameUpdated = await _systemConfigurationService.UpdateConfigurationAsync(
            GetWarningLetterSettingsQueryHandler.IssuerNameConfigKey,
            issuerName,
            cancellationToken);

        var issuerTitleUpdated = await _systemConfigurationService.UpdateConfigurationAsync(
            GetWarningLetterSettingsQueryHandler.IssuerTitleConfigKey,
            issuerTitle,
            cancellationToken);

        var maxWarningCountUpdated = await _systemConfigurationService.UpdateConfigurationAsync(
            GetWarningLetterSettingsQueryHandler.MaxWarningCountBeforeLastConfigKey,
            maxWarningCountValue,
            cancellationToken);

        if (!fuelPriceUpdated || !issuerNameUpdated || !issuerTitleUpdated || !maxWarningCountUpdated)
        {
            _logger.LogWarning(
                "Failed to persist warning letter settings. FuelPriceUpdated={FuelPriceUpdated}, IssuerNameUpdated={IssuerNameUpdated}, IssuerTitleUpdated={IssuerTitleUpdated}, MaxWarningCountUpdated={MaxWarningCountUpdated}",
                fuelPriceUpdated,
                issuerNameUpdated,
                issuerTitleUpdated,
                maxWarningCountUpdated);

            _logger.LogWarning(
                "Latest attempted warning letter settings values: fuelPrice={FuelPrice}, issuerName={IssuerName}, issuerTitle={IssuerTitle}, maxWarningCount={MaxWarningCount}",
                valueAsString,
                issuerName,
                issuerTitle,
                maxWarningCountValue);

            _logger.LogWarning(
                "Failed to persist warning letter fuel price setting (key={Key}, value={Value})",
                GetWarningLetterSettingsQueryHandler.FuelPricePerLitreConfigKey,
                valueAsString);

            return FMSResponse<WarningLetterSettingsDto>.SystemError(
                "Failed to update warning letter settings.");
        }

        // Read back so the client sees the canonical persisted value.
        var persisted = await _systemConfigurationService.GetDecimalAsync(
            GetWarningLetterSettingsQueryHandler.FuelPricePerLitreConfigKey,
            0m,
            cancellationToken);
        var persistedIssuerName = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerNameConfigKey,
            cancellationToken);
        var persistedIssuerTitle = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.IssuerTitleConfigKey,
            cancellationToken);
        var persistedMaxWarningCountRaw = await _systemConfigurationService.GetConfigurationValueAsync(
            GetWarningLetterSettingsQueryHandler.MaxWarningCountBeforeLastConfigKey,
            cancellationToken);

        var persistedMaxWarningCount = int.TryParse(persistedMaxWarningCountRaw, out var parsedCount) && parsedCount > 0
            ? parsedCount
            : GetWarningLetterSettingsQueryHandler.DefaultMaxWarningCountBeforeLast;

        return FMSResponse<WarningLetterSettingsDto>.Success(
            new WarningLetterSettingsDto
            {
                FuelPricePerLitre = persisted,
                IssuerName = persistedIssuerName,
                IssuerTitle = persistedIssuerTitle,
                MaxWarningCountBeforeLast = persistedMaxWarningCount
            },
            "Warning letter settings updated.");
    }
}
