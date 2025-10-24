
using MediatR;
using FMS.Application.CommonInterface;
using FMS.Application.Features.ErrorHandling.Dtos;
using FMS.Persistence.DataAccess;
using FMS.Application.Common;
using System.Collections.Generic;
using System;
using System.Threading.Tasks;
using System.Threading;
using System.Linq;
using Microsoft.EntityFrameworkCore;
namespace FMS.Application.Features.ErrorHandling.Queries
{
    public class GetErrorLogQuery : IRequest<FMSResponse<List<ErrorLogDto>>>
    {
        public int PageSize { get; set; } = 50;
        public int PageNumber { get; set; } = 1;

        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class GetErrorLogQueryHandler : IRequestHandler<GetErrorLogQuery, FMSResponse<List<ErrorLogDto>>>
    {
        private readonly GpsdataContext _context;

        public GetErrorLogQueryHandler(GpsdataContext context)
        {
            _context = context;
        }
        public async Task<FMSResponse<List<ErrorLogDto>>> Handle(GetErrorLogQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.ErrorLogs.AsQueryable();

                if (request.FromDate.HasValue)
                {
                    query = query.Where(e => e.CreatedAt >= request.FromDate.Value);
                }

                if (request.ToDate.HasValue)
                {
                    query = query.Where(e => e.CreatedAt <= request.ToDate.Value);
                }

                query = query.OrderByDescending(e => e.CreatedAt);

                var totalRecords = await query.CountAsync(cancellationToken);

                var errorLogs = await query
                    .Take(request.PageSize)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync(cancellationToken);

                var errorLogDtos = errorLogs.Select(e => new ErrorLogDto
                {
                    Id = e.Id,
                    TimeStamp = e.CreatedAt,
                    Message = e.Message,
                    Stack = e.Stack,
                    ComponentStack = e.ComponentStack,
                    UserAgent = e.UserAgent,
                    Url = e.Url,
                    UserId = e.UserId,
                    CreatedAt = e.CreatedAt
                }).ToList();

                return FMSResponse<List<ErrorLogDto>>.Success(errorLogDtos, "Error logs retrieved successfully.");
            }
            catch (Exception ex)
            {
                return FMSResponse<List<ErrorLogDto>>.Failed($"An error occurred while retrieving error logs: {ex.Message}");
            }
        }
    }
}