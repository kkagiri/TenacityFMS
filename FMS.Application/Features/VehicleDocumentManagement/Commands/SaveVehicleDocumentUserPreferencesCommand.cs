/**
 * File: SaveVehicleDocumentUserPreferencesCommand.cs
 * Purpose: Saves per-user default reminder lead days for vehicle document compliance categories.
 * Dependencies: GpsdataContext, vehicle document preference DTOs, and preference entity.
 * Last Modified: 2026-03-25
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record SaveVehicleDocumentUserPreferencesCommand(SaveVehicleDocumentUserPreferencesDto Request) : IRequest<FMSResponse<List<VehicleDocumentUserPreferenceDto>>>;

public class SaveVehicleDocumentUserPreferencesCommandHandler : IRequestHandler<SaveVehicleDocumentUserPreferencesCommand, FMSResponse<List<VehicleDocumentUserPreferenceDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<SaveVehicleDocumentUserPreferencesCommandHandler> _logger;

    public SaveVehicleDocumentUserPreferencesCommandHandler(
        GpsdataContext context,
        ILogger<SaveVehicleDocumentUserPreferencesCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDocumentUserPreferenceDto>>> Handle(SaveVehicleDocumentUserPreferencesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Request.UserId))
            {
                return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.ValidationFailed(new List<string> { "User ID is required." });
            }

            var preferences = request.Request.Preferences ?? new List<VehicleDocumentUserPreferenceValueDto>();
            if (preferences.Count == 0)
            {
                return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.ValidationFailed(new List<string> { "At least one reminder default is required." });
            }

            var duplicateCategories = preferences
                .GroupBy(preference => preference.ComplianceCategory)
                .Where(group => group.Count() > 1)
                .Select(group => group.Key)
                .ToList();

            if (duplicateCategories.Count > 0)
            {
                return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.ValidationFailed(new List<string>
                {
                    $"Duplicate compliance categories were provided: {string.Join(", ", duplicateCategories)}."
                });
            }

            var invalidCategories = preferences
                .Where(preference => !Enum.IsDefined(typeof(VehicleComplianceCategory), preference.ComplianceCategory))
                .Select(preference => preference.ComplianceCategory)
                .Distinct()
                .ToList();

            if (invalidCategories.Count > 0)
            {
                return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.ValidationFailed(new List<string>
                {
                    $"Unsupported compliance categories were provided: {string.Join(", ", invalidCategories)}."
                });
            }

            var categories = preferences.Select(preference => preference.ComplianceCategory).ToList();
            var existingPreferences = await _context.VehicleDocumentUserPreferences
                .Where(preference => preference.UserId == request.Request.UserId && categories.Contains(preference.ComplianceCategory))
                .ToListAsync(cancellationToken);

            foreach (var preference in preferences)
            {
                var existingPreference = existingPreferences.FirstOrDefault(existing => existing.ComplianceCategory == preference.ComplianceCategory);
                if (existingPreference is null)
                {
                    await _context.VehicleDocumentUserPreferences.AddAsync(
                        new VehicleDocumentUserPreference(
                            request.Request.UserId,
                            preference.ComplianceCategory,
                            preference.ReminderLeadDays,
                            request.Request.UserId),
                        cancellationToken);

                    continue;
                }

                existingPreference.UpdateReminderLeadDays(preference.ReminderLeadDays, request.Request.UserId);
            }

            await _context.SaveChangesAsync(cancellationToken);

            var updatedPreferences = await _context.VehicleDocumentUserPreferences
                .AsNoTracking()
                .Where(preference => preference.UserId == request.Request.UserId)
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

            return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.Success(updatedPreferences, "Vehicle document reminder defaults saved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving vehicle document reminder defaults for user {UserId}.", request.Request.UserId);
            return FMSResponse<List<VehicleDocumentUserPreferenceDto>>.SystemError("Error saving vehicle document reminder defaults.");
        }
    }
}