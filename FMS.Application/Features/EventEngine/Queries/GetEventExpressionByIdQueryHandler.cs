/**
 * File: GetEventExpressionByIdQueryHandler.cs
 * Purpose: Handles fetching a single EventExpression entity by ID.
 * Dependencies: GpsdataContext, AutoMapper, FMSResponse
 * Last Modified: 2026-02-11
 */

using System;
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
    public class GetEventExpressionByIdQueryHandler
        : IRequestHandler<GetEventExpressionByIdQuery, FMSResponse<EventExpressionDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetEventExpressionByIdQueryHandler> _logger;

        public GetEventExpressionByIdQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetEventExpressionByIdQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<EventExpressionDto>> Handle(
            GetEventExpressionByIdQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var entity = await _context.EventExpressions
                    .Include(e => e.Site)
                    .Include(e => e.Tank)
                    .Include(e => e.NotificationPolicy)
                    .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

                if (entity == null)
                    return FMSResponse<EventExpressionDto>.Failed(
                        $"Event expression with ID {request.Id} not found", "NOT_FOUND");

                var dto = _mapper.Map<EventExpressionDto>(entity);
                return FMSResponse<EventExpressionDto>.Success(dto, "Event expression fetched successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching event expression {Id}", request.Id);
                return FMSResponse<EventExpressionDto>.SystemError($"Error fetching event expression: {ex.Message}");
            }
        }
    }
}
