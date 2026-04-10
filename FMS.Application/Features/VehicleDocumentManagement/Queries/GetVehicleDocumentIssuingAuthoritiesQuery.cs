/**
 * File: GetVehicleDocumentIssuingAuthoritiesQuery.cs
 * Purpose: Returns persisted issuing authorities used by vehicle documents and compliance requirements.
 * Dependencies: GpsdataContext, vehicle document DTOs.
 * Last Modified: 2026-04-09
 */
using System;
using System.Collections.Generic;
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

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public record GetVehicleDocumentIssuingAuthoritiesQuery() : IRequest<FMSResponse<List<VehicleDocumentIssuingAuthorityDto>>>;

public class GetVehicleDocumentIssuingAuthoritiesQueryHandler : IRequestHandler<GetVehicleDocumentIssuingAuthoritiesQuery, FMSResponse<List<VehicleDocumentIssuingAuthorityDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleDocumentIssuingAuthoritiesQueryHandler> _logger;

    public GetVehicleDocumentIssuingAuthoritiesQueryHandler(GpsdataContext context, ILogger<GetVehicleDocumentIssuingAuthoritiesQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDocumentIssuingAuthorityDto>>> Handle(GetVehicleDocumentIssuingAuthoritiesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var configuredMappings = await VehicleDocumentIssuingAuthoritySettings.LoadMappingsAsync(_context, cancellationToken);

            var documentAuthorities = await _context.VehicleDocuments
                .AsNoTracking()
                .Select(document => document.IssuingAuthority)
                .Where(name => name != null && name.Trim() != string.Empty)
                .ToListAsync(cancellationToken);

            var requirementAuthorities = await _context.VehicleComplianceRequirements
                .AsNoTracking()
                .Select(requirement => requirement.DefaultIssuingAuthority)
                .Where(name => name != null && name.Trim() != string.Empty)
                .ToListAsync(cancellationToken);

            var documentCounts = documentAuthorities
                .Select(NormalizeAuthorityName)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .GroupBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);

            var requirementCounts = requirementAuthorities
                .Select(NormalizeAuthorityName)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .GroupBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);

            var names = documentCounts.Keys
                .Concat(requirementCounts.Keys)
                .Concat(configuredMappings.Values)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(name => name)
                .ToList();

            var authorities = names.Select(name => new VehicleDocumentIssuingAuthorityDto
            {
                Name = name,
                DocumentUsageCount = documentCounts.TryGetValue(name, out var documentUsageCount) ? documentUsageCount : 0,
                RequirementUsageCount = requirementCounts.TryGetValue(name, out var requirementUsageCount) ? requirementUsageCount : 0,
                AssociatedComplianceCategories = VehicleDocumentIssuingAuthoritySettings.GetAssociatedComplianceCategories(configuredMappings, name),
            }).ToList();

            return FMSResponse<List<VehicleDocumentIssuingAuthorityDto>>.Success(authorities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicle document issuing authorities.");
            return FMSResponse<List<VehicleDocumentIssuingAuthorityDto>>.SystemError("Error retrieving vehicle document issuing authorities.");
        }
    }

    private static string NormalizeAuthorityName(string? value)
    {
        return VehicleDocumentIssuingAuthoritySettings.NormalizeAuthorityName(value);
    }
}