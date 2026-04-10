/**
 * File: DeleteVehicleDocumentIssuingAuthorityCommand.cs
 * Purpose: Clears an issuing authority from persisted vehicle documents and compliance requirements.
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

public record DeleteVehicleDocumentIssuingAuthorityCommand(DeleteVehicleDocumentIssuingAuthorityDto Request) : IRequest<FMSResponse<bool>>;

public class DeleteVehicleDocumentIssuingAuthorityCommandHandler : IRequestHandler<DeleteVehicleDocumentIssuingAuthorityCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteVehicleDocumentIssuingAuthorityCommandHandler> _logger;

    public DeleteVehicleDocumentIssuingAuthorityCommandHandler(GpsdataContext context, ILogger<DeleteVehicleDocumentIssuingAuthorityCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteVehicleDocumentIssuingAuthorityCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var authorityName = NormalizeAuthorityName(request.Request.Name);
            if (string.IsNullOrWhiteSpace(authorityName))
            {
                return FMSResponse<bool>.ValidationFailed(new System.Collections.Generic.List<string> { "Issuing authority name is required." });
            }

            var normalizedAuthorityName = authorityName.ToLowerInvariant();

            var updatedDocumentCount = await _context.VehicleDocuments
                .Where(document => document.IssuingAuthority != null && document.IssuingAuthority.Trim().ToLower() == normalizedAuthorityName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(document => document.IssuingAuthority, string.Empty), cancellationToken);

            var updatedRequirementCount = await _context.VehicleComplianceRequirements
                .Where(requirement => requirement.DefaultIssuingAuthority != null && requirement.DefaultIssuingAuthority.Trim().ToLower() == normalizedAuthorityName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(requirement => requirement.DefaultIssuingAuthority, string.Empty), cancellationToken);

            var authorityMappings = await VehicleDocumentIssuingAuthoritySettings.LoadMappingsAsync(_context, cancellationToken);
            var removedMappingCount = VehicleDocumentIssuingAuthoritySettings.RemoveAuthority(authorityMappings, authorityName);

            if (removedMappingCount > 0)
            {
                await VehicleDocumentIssuingAuthoritySettings.SaveMappingsAsync(_context, authorityMappings, updatedBy: "System", cancellationToken);
            }

            if (updatedDocumentCount + updatedRequirementCount + removedMappingCount == 0)
            {
                return FMSResponse<bool>.Failed("Issuing authority not found.");
            }

            return FMSResponse<bool>.Success(true, "Issuing authority deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting vehicle document issuing authority.");
            return FMSResponse<bool>.SystemError("Error deleting vehicle document issuing authority.");
        }
    }

    private static string NormalizeAuthorityName(string? value)
    {
        return VehicleDocumentIssuingAuthoritySettings.NormalizeAuthorityName(value);
    }
}