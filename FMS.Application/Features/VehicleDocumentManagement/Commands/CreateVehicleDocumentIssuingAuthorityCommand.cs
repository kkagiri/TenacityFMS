/**
 * File: CreateVehicleDocumentIssuingAuthorityCommand.cs
 * Purpose: Persists an issuing authority default for a vehicle compliance category.
 * Dependencies: GpsdataContext, vehicle document DTOs, issuing authority settings helper.
 * Last Modified: 2026-04-09
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Application.Features.VehicleDocumentManagement.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record CreateVehicleDocumentIssuingAuthorityCommand(CreateVehicleDocumentIssuingAuthorityDto Request) : IRequest<FMSResponse<bool>>;

public class CreateVehicleDocumentIssuingAuthorityCommandHandler : IRequestHandler<CreateVehicleDocumentIssuingAuthorityCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateVehicleDocumentIssuingAuthorityCommandHandler> _logger;

    public CreateVehicleDocumentIssuingAuthorityCommandHandler(GpsdataContext context, ILogger<CreateVehicleDocumentIssuingAuthorityCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(CreateVehicleDocumentIssuingAuthorityCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var authorityName = VehicleDocumentIssuingAuthoritySettings.NormalizeAuthorityName(request.Request.Name);
            if (string.IsNullOrWhiteSpace(authorityName))
            {
                return FMSResponse<bool>.ValidationFailed(new System.Collections.Generic.List<string> { "Issuing authority name is required." });
            }

            if (request.Request.ComplianceCategory <= 0)
            {
                return FMSResponse<bool>.ValidationFailed(new System.Collections.Generic.List<string> { "Compliance category is required." });
            }

            var mappings = await VehicleDocumentIssuingAuthoritySettings.LoadMappingsAsync(_context, cancellationToken);
            if (mappings.TryGetValue(request.Request.ComplianceCategory, out var existingAuthority)
                && string.Equals(existingAuthority, authorityName, StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<bool>.Success(true, "Issuing authority already linked to that compliance category.");
            }

            mappings[request.Request.ComplianceCategory] = authorityName;
            await VehicleDocumentIssuingAuthoritySettings.SaveMappingsAsync(_context, mappings, updatedBy: "System", cancellationToken);

            return FMSResponse<bool>.Success(true, "Issuing authority saved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving vehicle document issuing authority.");
            return FMSResponse<bool>.SystemError("Error saving vehicle document issuing authority.");
        }
    }
}