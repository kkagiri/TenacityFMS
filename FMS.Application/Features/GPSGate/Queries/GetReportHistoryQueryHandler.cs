using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Queries
{
    public class GetReportHistoryQueryHandler : IRequestHandler<GetReportHistoryQuery, FMSResponse<List<GPSGateReportDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetReportHistoryQueryHandler> _logger;

        public GetReportHistoryQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetReportHistoryQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<List<GPSGateReportDto>>> Handle(GetReportHistoryQuery request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Fetching report history");

                var query = _context.GPSGateReports.AsQueryable();

                if (request.ReportId.HasValue)
                {
                    query = query.Where(r => r.ReportId == request.ReportId.Value);
                }

                if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    query = query.Where(r => r.Status == request.Status);
                }

                var reports = await query
                    .OrderByDescending(r => r.RequestedAt)
                    .ToListAsync(cancellationToken);

                var reportDtos = _mapper.Map<List<GPSGateReportDto>>(reports);

                return FMSResponse<List<GPSGateReportDto>>.Success(reportDtos, $"Retrieved {reportDtos.Count} reports");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching report history");
                return FMSResponse<List<GPSGateReportDto>>.Failed($"Failed to fetch report history: {ex.Message}");
            }
        }
    }
}
