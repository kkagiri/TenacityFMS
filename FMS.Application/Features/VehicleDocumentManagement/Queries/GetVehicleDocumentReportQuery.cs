/**
 * File: GetVehicleDocumentReportQuery.cs
 * Purpose: Returns flattened vehicle document compliance rows for reporting and export workflows.
 * Dependencies: GpsdataContext, report DTOs.
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
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public class GetVehicleDocumentReportQuery : IRequest<FMSResponse<List<VehicleDocumentReportRowDto>>>
{
    public int? VehicleId { get; set; }
    public int? SiteId { get; set; }
    public int? VehicleTypeId { get; set; }
    public VehicleComplianceCategory? ComplianceCategory { get; set; }
    public DocumentStatus? Status { get; set; }
}

public class GetVehicleDocumentReportQueryHandler : IRequestHandler<GetVehicleDocumentReportQuery, FMSResponse<List<VehicleDocumentReportRowDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleDocumentReportQueryHandler> _logger;

    public GetVehicleDocumentReportQueryHandler(GpsdataContext context, ILogger<GetVehicleDocumentReportQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDocumentReportRowDto>>> Handle(GetVehicleDocumentReportQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.VehicleDocuments
                .AsNoTracking()
                .Select(document => new VehicleDocumentReportQueryRow
                {
                    Id = document.Id,
                    VehicleId = document.VehicleId,
                    VehicleRegistration = document.Vehicle != null ? document.Vehicle.HyoungNo : string.Empty,
                    SiteId = document.Vehicle != null ? document.Vehicle.WorkingSiteId : null,
                    SiteName = document.Vehicle != null && document.Vehicle.WorkingSite != null ? document.Vehicle.WorkingSite.Name : string.Empty,
                    VehicleTypeId = document.Vehicle != null ? document.Vehicle.VehicleTypeId : null,
                    VehicleTypeName = document.Vehicle != null && document.Vehicle.VehicleType != null ? document.Vehicle.VehicleType.Name : string.Empty,
                    ComplianceCategory = document.ComplianceCategory,
                    DocumentType = document.DocumentType,
                    DocumentNumber = document.DocumentNumber ?? string.Empty,
                    IssuingAuthority = document.IssuingAuthority ?? string.Empty,
                    IssueDate = document.IssueDate,
                    ExpiryDate = document.ExpiryDate,
                    AlertLeadDays = document.AlertLeadDays,
                    Status = document.Status,
                    DaysUntilExpiry = EF.Functions.DateDiffDay(DateTime.UtcNow.Date, document.ExpiryDate),
                    Notes = document.Notes ?? string.Empty,
                    CreatedAt = document.CreatedAt,
                    CreatedBy = document.CreatedBy ?? string.Empty,
                })
                .AsQueryable();

            if (request.VehicleId.HasValue)
            {
                query = query.Where(row => row.VehicleId == request.VehicleId.Value);
            }

            if (request.SiteId.HasValue)
            {
                query = query.Where(row => row.SiteId == request.SiteId.Value);
            }

            if (request.VehicleTypeId.HasValue)
            {
                query = query.Where(row => row.VehicleTypeId == request.VehicleTypeId.Value);
            }

            if (request.ComplianceCategory.HasValue)
            {
                query = query.Where(row => row.ComplianceCategory == request.ComplianceCategory.Value);
            }

            if (request.Status.HasValue)
            {
                query = query.Where(row => row.Status == request.Status.Value);
            }

            var rows = await query
                .OrderBy(row => row.VehicleRegistration)
                .ThenBy(row => row.ComplianceCategory)
                .ThenBy(row => row.ExpiryDate)
                .ToListAsync(cancellationToken);

            var result = rows.Select(row => new VehicleDocumentReportRowDto
            {
                Id = row.Id,
                VehicleId = row.VehicleId,
                VehicleRegistration = row.VehicleRegistration,
                SiteId = row.SiteId,
                SiteName = row.SiteName,
                VehicleTypeId = row.VehicleTypeId,
                VehicleTypeName = row.VehicleTypeName,
                ComplianceCategory = row.ComplianceCategory,
                ComplianceCategoryName = row.ComplianceCategory.ToString(),
                DocumentType = row.DocumentType,
                DocumentTypeName = row.DocumentType.ToString(),
                DocumentNumber = row.DocumentNumber,
                IssuingAuthority = row.IssuingAuthority,
                IssueDate = row.IssueDate,
                ExpiryDate = row.ExpiryDate,
                AlertLeadDays = row.AlertLeadDays,
                Status = row.Status,
                StatusName = row.Status.ToString(),
                DaysUntilExpiry = row.DaysUntilExpiry,
                Notes = row.Notes,
                CreatedAt = row.CreatedAt,
                CreatedBy = row.CreatedBy,
            }).ToList();

            return FMSResponse<List<VehicleDocumentReportRowDto>>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicle document report rows.");
            return FMSResponse<List<VehicleDocumentReportRowDto>>.SystemError("Error retrieving vehicle document report rows.");
        }
    }
}

internal sealed class VehicleDocumentReportQueryRow
{
    public Guid Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleRegistration { get; set; } = string.Empty;
    public int? SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public int? VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public VehicleComplianceCategory ComplianceCategory { get; set; }
    public VehicleDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string IssuingAuthority { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int AlertLeadDays { get; set; }
    public DocumentStatus Status { get; set; }
    public int DaysUntilExpiry { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}