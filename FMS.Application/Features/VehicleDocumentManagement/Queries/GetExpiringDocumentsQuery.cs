using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
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

public class GetExpiringDocumentsQuery : IRequest<FMSResponse<List<VehicleDocumentDto>>>
{
    public int DaysThreshold { get; set; } = 30;
}

public class GetExpiringDocumentsQueryHandler : IRequestHandler<GetExpiringDocumentsQuery, FMSResponse<List<VehicleDocumentDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetExpiringDocumentsQueryHandler> _logger;

    public GetExpiringDocumentsQueryHandler(GpsdataContext context, ILogger<GetExpiringDocumentsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDocumentDto>>> Handle(GetExpiringDocumentsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var rows = await _context.VehicleDocuments
                .AsNoTracking()
                .Where(vd => vd.ExpiryDate >= DateTime.UtcNow.Date)
                .ProjectToVehicleDocumentRows()
                .ToListAsync(cancellationToken);

            var filteredRows = rows
                .Where(vd => (vd.ExpiryDate.Date - DateTime.UtcNow.Date).Days <= (request.DaysThreshold > 0 ? request.DaysThreshold : vd.AlertLeadDays))
                .ToList();

            var documentDtos = filteredRows.ToDtos();

            return FMSResponse<List<VehicleDocumentDto>>.Success(documentDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expiring documents.");
            return FMSResponse<List<VehicleDocumentDto>>.SystemError("Error getting expiring documents.");
        }
    }
}
