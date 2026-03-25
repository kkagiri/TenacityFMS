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

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public record GetVehicleComplianceDashboardQuery() : IRequest<FMSResponse<VehicleComplianceDashboardDto>>;

public class GetVehicleComplianceDashboardQueryHandler : IRequestHandler<GetVehicleComplianceDashboardQuery, FMSResponse<VehicleComplianceDashboardDto>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleComplianceDashboardQueryHandler> _logger;

    public GetVehicleComplianceDashboardQueryHandler(GpsdataContext context, ILogger<GetVehicleComplianceDashboardQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleComplianceDashboardDto>> Handle(GetVehicleComplianceDashboardQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var requirements = await _context.VehicleComplianceRequirements
                .AsNoTracking()
                .Where(requirement => requirement.IsActive)
                .ToListAsync(cancellationToken);

            var vehicles = await _context.Vehicles
                .AsNoTracking()
                .Select(vehicle => new VehicleScopeRow
                {
                    VehicleId = vehicle.VehicleId,
                    SiteId = vehicle.WorkingSiteId,
                    SiteName = vehicle.WorkingSite != null ? vehicle.WorkingSite.Name : "Unassigned",
                    VehicleTypeId = vehicle.VehicleTypeId,
                    VehicleTypeName = vehicle.VehicleType != null ? vehicle.VehicleType.Name : "Unspecified"
                })
                .ToListAsync(cancellationToken);

            var allDocuments = await _context.VehicleDocuments
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var applicableRequirements = requirements
                .SelectMany(requirement => ExpandRequirement(requirement, vehicles))
                .GroupBy(requirement => new { requirement.VehicleId, requirement.ComplianceCategory })
                .Select(group => group.OrderByDescending(item => item.TargetType == VehicleComplianceTargetType.VehicleType).First())
                .ToList();

            var latestDocumentLookup = allDocuments
                .GroupBy(document => new { document.VehicleId, document.ComplianceCategory })
                .Select(group => group.OrderByDescending(document => document.ExpiryDate).ThenByDescending(document => document.CreatedAt).First())
                .ToDictionary(
                    document => $"{document.VehicleId}:{(int)document.ComplianceCategory}",
                    document => document);

            var records = applicableRequirements.Select(requirement =>
            {
                latestDocumentLookup.TryGetValue($"{requirement.VehicleId}:{(int)requirement.ComplianceCategory}", out var document);
                return BuildRecord(requirement, document);
            }).ToList();

            var dashboard = new VehicleComplianceDashboardDto
            {
                TotalApplicableRequirements = records.Count,
                CompletedCount = records.Count(record => record.State == ComplianceDashboardState.Completed),
                DueCount = records.Count(record => record.State != ComplianceDashboardState.Completed),
                ExpiringSoonCount = records.Count(record => record.State == ComplianceDashboardState.ExpiringSoon),
                ExpiredCount = records.Count(record => record.State == ComplianceDashboardState.Expired),
                MissingCount = records.Count(record => record.State == ComplianceDashboardState.Missing),
                BySite = BuildSummary(records, record => record.SiteName),
                ByVehicleType = BuildSummary(records, record => record.VehicleTypeName),
                ByDocumentType = BuildSummary(records, record => record.ComplianceCategory.ToString())
            };

            return FMSResponse<VehicleComplianceDashboardDto>.Success(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating vehicle compliance dashboard.");
            return FMSResponse<VehicleComplianceDashboardDto>.Failed("Error generating vehicle compliance dashboard.");
        }
    }

    private static IEnumerable<ApplicableComplianceRequirementRow> ExpandRequirement(VehicleComplianceRequirement requirement, IReadOnlyCollection<VehicleScopeRow> vehicles)
    {
        return requirement.TargetType switch
        {
            VehicleComplianceTargetType.Site when requirement.SiteId != null => vehicles
                .Where(vehicle => vehicle.SiteId == requirement.SiteId)
                .Select(vehicle => ApplicableComplianceRequirementRow.From(requirement, vehicle)),
            VehicleComplianceTargetType.VehicleType when requirement.VehicleTypeId != null => vehicles
                .Where(vehicle => vehicle.VehicleTypeId == requirement.VehicleTypeId)
                .Select(vehicle => ApplicableComplianceRequirementRow.From(requirement, vehicle)),
            _ => Enumerable.Empty<ApplicableComplianceRequirementRow>()
        };
    }

    private static ComplianceDashboardRecord BuildRecord(ApplicableComplianceRequirementRow requirement, VehicleDocument? document)
    {
        if (document == null)
        {
            return new ComplianceDashboardRecord(requirement.SiteName, requirement.VehicleTypeName, requirement.ComplianceCategory, ComplianceDashboardState.Missing);
        }

        return document.Status switch
        {
            DocumentStatus.Expired => new ComplianceDashboardRecord(requirement.SiteName, requirement.VehicleTypeName, requirement.ComplianceCategory, ComplianceDashboardState.Expired),
            DocumentStatus.ExpiringSoon => new ComplianceDashboardRecord(requirement.SiteName, requirement.VehicleTypeName, requirement.ComplianceCategory, ComplianceDashboardState.ExpiringSoon),
            _ => new ComplianceDashboardRecord(requirement.SiteName, requirement.VehicleTypeName, requirement.ComplianceCategory, ComplianceDashboardState.Completed)
        };
    }

    private static List<VehicleComplianceGroupSummaryDto> BuildSummary(IEnumerable<ComplianceDashboardRecord> records, Func<ComplianceDashboardRecord, string> selector)
    {
        return records
            .GroupBy(selector)
            .Select(group => new VehicleComplianceGroupSummaryDto
            {
                GroupName = string.IsNullOrWhiteSpace(group.Key) ? "Unassigned" : group.Key,
                TotalCount = group.Count(),
                CompletedCount = group.Count(record => record.State == ComplianceDashboardState.Completed),
                DueCount = group.Count(record => record.State != ComplianceDashboardState.Completed),
                ExpiringSoonCount = group.Count(record => record.State == ComplianceDashboardState.ExpiringSoon),
                ExpiredCount = group.Count(record => record.State == ComplianceDashboardState.Expired),
                MissingCount = group.Count(record => record.State == ComplianceDashboardState.Missing)
            })
            .OrderByDescending(group => group.DueCount)
            .ThenBy(group => group.GroupName)
            .ToList();
    }

    private sealed class VehicleScopeRow
    {
        public int VehicleId { get; set; }
        public int? SiteId { get; set; }
        public string SiteName { get; set; } = "Unassigned";
        public int? VehicleTypeId { get; set; }
        public string VehicleTypeName { get; set; } = "Unspecified";
    }

    private sealed class ApplicableComplianceRequirementRow
    {
        public int VehicleId { get; private set; }
        public string SiteName { get; private set; } = "Unassigned";
        public string VehicleTypeName { get; private set; } = "Unspecified";
        public VehicleComplianceCategory ComplianceCategory { get; private set; }
        public VehicleComplianceTargetType TargetType { get; private set; }

        public static ApplicableComplianceRequirementRow From(VehicleComplianceRequirement requirement, VehicleScopeRow vehicle)
        {
            return new ApplicableComplianceRequirementRow
            {
                VehicleId = vehicle.VehicleId,
                SiteName = vehicle.SiteName,
                VehicleTypeName = vehicle.VehicleTypeName,
                ComplianceCategory = requirement.ComplianceCategory,
                TargetType = requirement.TargetType
            };
        }
    }

    private sealed record ComplianceDashboardRecord(
        string SiteName,
        string VehicleTypeName,
        VehicleComplianceCategory ComplianceCategory,
        ComplianceDashboardState State);

    private enum ComplianceDashboardState
    {
        Completed,
        ExpiringSoon,
        Expired,
        Missing
    }
}
