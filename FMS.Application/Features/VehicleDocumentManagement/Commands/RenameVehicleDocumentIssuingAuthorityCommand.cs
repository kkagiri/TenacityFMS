/**
 * File: RenameVehicleDocumentIssuingAuthorityCommand.cs
 * Purpose: Renames an issuing authority across persisted vehicle documents and compliance requirements.
 * Dependencies: GpsdataContext, vehicle document DTOs.
 * Last Modified: 2026-04-09
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Application.Features.VehicleDocumentManagement.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record RenameVehicleDocumentIssuingAuthorityCommand(RenameVehicleDocumentIssuingAuthorityDto Request) : IRequest<FMSResponse<bool>>;

public class RenameVehicleDocumentIssuingAuthorityCommandHandler : IRequestHandler<RenameVehicleDocumentIssuingAuthorityCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<RenameVehicleDocumentIssuingAuthorityCommandHandler> _logger;

    public RenameVehicleDocumentIssuingAuthorityCommandHandler(GpsdataContext context, ILogger<RenameVehicleDocumentIssuingAuthorityCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(RenameVehicleDocumentIssuingAuthorityCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var oldName = NormalizeAuthorityName(request.Request.OldName);
            var newName = NormalizeAuthorityName(request.Request.NewName);

            if (string.IsNullOrWhiteSpace(oldName) || string.IsNullOrWhiteSpace(newName))
            {
                return FMSResponse<bool>.ValidationFailed(new System.Collections.Generic.List<string> { "Old and new issuing authority names are required." });
            }

            if (string.Equals(oldName, newName, StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<bool>.Success(true, "Issuing authority is already using that name.");
            }

            var normalizedOldName = oldName.ToLowerInvariant();

            var updatedDocumentCount = await _context.VehicleDocuments
                .Where(document => document.IssuingAuthority != null && document.IssuingAuthority.Trim().ToLower() == normalizedOldName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(document => document.IssuingAuthority, newName), cancellationToken);

            var updatedRequirementCount = await _context.VehicleComplianceRequirements
                .Where(requirement => requirement.DefaultIssuingAuthority != null && requirement.DefaultIssuingAuthority.Trim().ToLower() == normalizedOldName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(requirement => requirement.DefaultIssuingAuthority, newName), cancellationToken);

            var authorityMappings = await VehicleDocumentIssuingAuthoritySettings.LoadMappingsAsync(_context, cancellationToken);
            var updatedMappingCount = VehicleDocumentIssuingAuthoritySettings.ReplaceAuthorityName(authorityMappings, oldName, newName);

            if (updatedMappingCount > 0)
            {
                await VehicleDocumentIssuingAuthoritySettings.SaveMappingsAsync(_context, authorityMappings, updatedBy: "System", cancellationToken);
            }

            if (updatedDocumentCount + updatedRequirementCount + updatedMappingCount == 0)
            {
                return FMSResponse<bool>.Failed("Issuing authority not found.");
            }

            return FMSResponse<bool>.Success(true, "Issuing authority updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error renaming vehicle document issuing authority.");
            return FMSResponse<bool>.SystemError("Error renaming vehicle document issuing authority.");
        }
    }

    private static string NormalizeAuthorityName(string? value)
    {
        return VehicleDocumentIssuingAuthoritySettings.NormalizeAuthorityName(value);
    }
}