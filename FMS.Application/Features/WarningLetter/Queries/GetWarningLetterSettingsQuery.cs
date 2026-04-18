/**
 * File: GetWarningLetterSettingsQuery.cs
 * Purpose: Returns system-configured settings (e.g. fuel price per litre) used to pre-fill warning letter fields.
 * Dependencies: MediatR, ISystemConfigurationService, FMSResponse, WarningLetterSettingsDto
 * Last Modified: 2026-04-07
 */
using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Application.Services.Configuration;
using MediatR;

namespace FMS.Application.Features.WarningLetter.Queries;

public class GetWarningLetterSettingsQuery : IRequest<FMSResponse<WarningLetterSettingsDto>>
{
}

public class GetWarningLetterSettingsQueryHandler : IRequestHandler<GetWarningLetterSettingsQuery, FMSResponse<WarningLetterSettingsDto>>
{
    internal const string FuelPricePerLitreConfigKey = "WarningLetter:FuelPricePerLitre";
    internal const string IssuerNameConfigKey = "WarningLetter:IssuerName";
    internal const string IssuerTitleConfigKey = "WarningLetter:IssuerTitle";
    internal const string MaxWarningCountBeforeLastConfigKey = "WarningLetter:MaxWarningCountBeforeLast";
    internal const string EffectiveStartDateConfigKey = "WarningLetter:EffectiveStartDate";
    internal const int DefaultMaxWarningCountBeforeLast = 3;
    // System-in-place date for the Warning Letter feature. Letters, candidates, and analytics
    // prior to this date are ignored unless the configuration value overrides it.
    internal static readonly DateTime DefaultEffectiveStartDate = new(2026, 4, 14);

    private readonly ISystemConfigurationService _systemConfigurationService;

    public GetWarningLetterSettingsQueryHandler(ISystemConfigurationService systemConfigurationService)
    {
        _systemConfigurationService = systemConfigurationService;
    }

    public async Task<FMSResponse<WarningLetterSettingsDto>> Handle(GetWarningLetterSettingsQuery request, CancellationToken cancellationToken)
    {
        var fuelPrice = await _systemConfigurationService.GetDecimalAsync(FuelPricePerLitreConfigKey, 0m, cancellationToken);
        var issuerName = await _systemConfigurationService.GetConfigurationValueAsync(IssuerNameConfigKey, cancellationToken);
        var issuerTitle = await _systemConfigurationService.GetConfigurationValueAsync(IssuerTitleConfigKey, cancellationToken);
        var maxWarningCountValue = await _systemConfigurationService.GetConfigurationValueAsync(MaxWarningCountBeforeLastConfigKey, cancellationToken);

        var maxWarningCountBeforeLast = int.TryParse(maxWarningCountValue, out var parsedCount) && parsedCount > 0
            ? parsedCount
            : DefaultMaxWarningCountBeforeLast;

        var effectiveStartDate = await GetEffectiveStartDateAsync(_systemConfigurationService, cancellationToken);

        return FMSResponse<WarningLetterSettingsDto>.Success(new WarningLetterSettingsDto
        {
            FuelPricePerLitre = fuelPrice,
            IssuerName = issuerName,
            IssuerTitle = issuerTitle,
            MaxWarningCountBeforeLast = maxWarningCountBeforeLast,
            EffectiveStartDate = effectiveStartDate
        });
    }

    /// <summary>
    /// Resolves the warning-letter effective start date. Returns the configured value when present
    /// and parseable, otherwise falls back to <see cref="DefaultEffectiveStartDate"/>.
    /// </summary>
    internal static async Task<DateTime> GetEffectiveStartDateAsync(
        ISystemConfigurationService systemConfigurationService,
        CancellationToken cancellationToken)
    {
        var rawValue = await systemConfigurationService.GetConfigurationValueAsync(EffectiveStartDateConfigKey, cancellationToken);
        if (!string.IsNullOrWhiteSpace(rawValue)
            && DateTime.TryParse(rawValue.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal | DateTimeStyles.AdjustToUniversal, out var parsed))
        {
            return parsed.Date;
        }

        return DefaultEffectiveStartDate;
    }
}
