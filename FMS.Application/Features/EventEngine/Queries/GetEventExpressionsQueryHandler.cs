/**
 * File: GetEventExpressionsQueryHandler.cs
 * Purpose: Handles listing EventExpressions with optional filtering and pagination.
 * Dependencies: GpsdataContext, AutoMapper, ILogger, FMSResponse
 * Last Modified: 2026-02-11
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.EventEngine.Queries
{
    public class GetEventExpressionsQueryHandler
        : IRequestHandler<GetEventExpressionsQuery, FMSResponse<List<EventExpressionDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetEventExpressionsQueryHandler> _logger;

        public GetEventExpressionsQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetEventExpressionsQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<List<EventExpressionDto>>> Handle(
            GetEventExpressionsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.EventExpressions
                    .Include(e => e.Site)
                    .Include(e => e.Tank)
                    .Include(e => e.NotificationPolicy)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrWhiteSpace(request.EventType))
                    query = query.Where(e => e.EventType == request.EventType);

                if (request.SiteId.HasValue)
                    query = query.Where(e => e.SiteId == request.SiteId.Value);

                if (request.IsActive.HasValue)
                    query = query.Where(e => e.IsActive == request.IsActive.Value);

                query = query.OrderByDescending(e => e.CreatedAt);

                var expressions = await query
                    .Skip(request.Skip)
                    .Take(request.Take)
                    .ToListAsync(cancellationToken);

                var dtos = _mapper.Map<List<EventExpressionDto>>(expressions);
                return FMSResponse<List<EventExpressionDto>>.Success(dtos, "Event expressions fetched successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching event expressions");
                return FMSResponse<List<EventExpressionDto>>.SystemError($"Error fetching event expressions: {ex.Message}");
            }
        }
    }
}
