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

public record GetVehicleComplianceRequirementsQuery() : IRequest<FMSResponse<List<VehicleComplianceRequirementDto>>>;

public class GetVehicleComplianceRequirementsQueryHandler : IRequestHandler<GetVehicleComplianceRequirementsQuery, FMSResponse<List<VehicleComplianceRequirementDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleComplianceRequirementsQueryHandler> _logger;

    public GetVehicleComplianceRequirementsQueryHandler(GpsdataContext context, ILogger<GetVehicleComplianceRequirementsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleComplianceRequirementDto>>> Handle(GetVehicleComplianceRequirementsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var requirements = await _context.VehicleComplianceRequirements
                .AsNoTracking()
                .Include(requirement => requirement.Site)
                .Include(requirement => requirement.VehicleType)
                .OrderBy(requirement => requirement.Name)
                .Select(requirement => new VehicleComplianceRequirementDto
                {
                    Id = requirement.Id,
                    Name = requirement.Name,
                    ComplianceCategory = requirement.ComplianceCategory,
                    ComplianceCategoryName = requirement.ComplianceCategory.ToString(),
                    DocumentType = requirement.DocumentType,
                    DocumentTypeName = requirement.DocumentType.ToString(),
                    TargetType = requirement.TargetType,
                    TargetTypeName = requirement.TargetType.ToString(),
                    SiteId = requirement.SiteId,
                    SiteName = requirement.Site != null ? requirement.Site.Name : null,
                    VehicleTypeId = requirement.VehicleTypeId,
                    VehicleTypeName = requirement.VehicleType != null ? requirement.VehicleType.Name : null,
                    AlertLeadDays = requirement.AlertLeadDays,
                    DefaultIssuingAuthority = requirement.DefaultIssuingAuthority,
                    Notes = requirement.Notes,
                    IsActive = requirement.IsActive,
                    CreatedAt = requirement.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<VehicleComplianceRequirementDto>>.Success(requirements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicle compliance requirements.");
            return FMSResponse<List<VehicleComplianceRequirementDto>>.SystemError("Error retrieving vehicle compliance requirements.");
        }
    }
}
