using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public class GetVehicleDocumentsQuery : IRequest<FMSResponse<List<VehicleDocumentDto>>>
{
    public int? VehicleId { get; set; }
    public VehicleDocumentType? DocumentType { get; set; }
    public VehicleComplianceCategory? ComplianceCategory { get; set; }
    public DocumentStatus? Status { get; set; }
}

public class GetVehicleDocumentsQueryHandler : IRequestHandler<GetVehicleDocumentsQuery, FMSResponse<List<VehicleDocumentDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleDocumentsQueryHandler> _logger;

    public GetVehicleDocumentsQueryHandler(GpsdataContext context, ILogger<GetVehicleDocumentsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDocumentDto>>> Handle(GetVehicleDocumentsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.VehicleDocuments
                .AsNoTracking()
                .AsQueryable();

            if (request.VehicleId.HasValue)
            {
                query = query.Where(vd => vd.VehicleId == request.VehicleId.Value);
            }

            if (request.DocumentType.HasValue)
            {
                query = query.Where(vd => vd.DocumentType == request.DocumentType.Value);
            }

            if (request.ComplianceCategory.HasValue)
            {
                query = query.Where(vd => vd.ComplianceCategory == request.ComplianceCategory.Value);
            }

            if (request.Status.HasValue)
            {
                query = query.Where(vd => vd.Status == request.Status.Value);
            }

            var rows = await query
                .ProjectToVehicleDocumentRows()
                .ToListAsync(cancellationToken);
            var documentDtos = rows.ToDtos();
            await documentDtos.ApplyCreatedByDisplayAsync(_context, cancellationToken);

            return FMSResponse<List<VehicleDocumentDto>>.Success(documentDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting vehicle documents.");
            return FMSResponse<List<VehicleDocumentDto>>.SystemError("Error getting vehicle documents.");
        }
    }
}
