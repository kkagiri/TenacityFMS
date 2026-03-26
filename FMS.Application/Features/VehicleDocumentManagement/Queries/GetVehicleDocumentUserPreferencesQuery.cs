/**
 * File: GetVehicleDocumentUserPreferencesQuery.cs
 * Purpose: Returns per-user default reminder lead days for vehicle document compliance categories.
 * Dependencies: GpsdataContext and vehicle document preference DTOs.
 * Last Modified: 2026-03-25
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public record GetVehicleDocumentUserPreferencesQuery(string UserId) : IRequest<FMSResponse<List<VehicleDocumentUserPreferenceDto>>>;

public class GetVehicleDocumentUserPreferencesQueryHandler : IRequestHandler<GetVehicleDocumentUserPreferencesQuery, FMSResponse<List<VehicleDocumentUserPreferenceDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleDocumentUserPreferencesQueryHandler> _logger;

    public GetVehicleDocumentUserPreferencesQueryHandler(
        GpsdataContext context,
        ILogger<GetVehicleDocumentUserPreferencesQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDocumentUserPreferenceDto>>> Handle(GetVehicleDocumentUserPreferencesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.ValidationFailed(new List<string> { "User ID is required." });
            }

            var preferences = await _context.VehicleDocumentUserPreferences
                .AsNoTracking()
                .Where(preference => preference.UserId == request.UserId)
                .OrderBy(preference => preference.ComplianceCategory)
                .Select(preference => new VehicleDocumentUserPreferenceDto
                {
                    Id = preference.Id,
                    UserId = preference.UserId,
                    ComplianceCategory = preference.ComplianceCategory,
                    ComplianceCategoryName = preference.ComplianceCategory.ToString(),
                    ReminderLeadDays = preference.ReminderLeadDays,
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.Success(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicle document reminder defaults for user {UserId}.", request.UserId);
            return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.SystemError("Error retrieving vehicle document reminder defaults.");
        }
    }
}