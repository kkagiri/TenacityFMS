/**
 * File: GetLoginActivitiesQuery.cs
 * Purpose: CQRS query to fetch login/sign-in activities for a user (last 7 days by default)
 * Dependencies: MediatR, AutoMapper, EF Core, GpsdataContext
 * Last Modified: 2026-02-25
 *
 * Key Functions:
 * - GetLoginActivitiesQuery: Request with UserId, StartDate, EndDate, PageNumber, PageSize
 * - GetLoginActivitiesQueryHandler: Fetches from loginactivities table, filtered and paginated
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.UserActivities;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserActivities;

public class GetLoginActivitiesQuery : IRequest<List<LoginActivityDTO>>
{
    public string? UserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetLoginActivitiesQueryHandler : IRequestHandler<GetLoginActivitiesQuery, List<LoginActivityDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetLoginActivitiesQueryHandler> _logger;
    private readonly IMapper _mapper;

    public GetLoginActivitiesQueryHandler(GpsdataContext context, ILogger<GetLoginActivitiesQueryHandler> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<List<LoginActivityDTO>> Handle(GetLoginActivitiesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Getting login activities for UserId={UserId}, StartDate={StartDate}, EndDate={EndDate}",
                request.UserId, request.StartDate, request.EndDate);

            var query = _context.Loginactivities.AsQueryable();

            if (!string.IsNullOrEmpty(request.UserId))
            {
                query = query.Where(x => x.UserId == request.UserId);
            }

            if (request.StartDate.HasValue)
            {
                query = query.Where(x => x.Timestamp >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue)
            {
                query = query.Where(x => x.Timestamp <= request.EndDate.Value);
            }

            var activities = await query
                .OrderByDescending(x => x.Timestamp)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            var dtos = _mapper.Map<List<LoginActivityDTO>>(activities);

            _logger.LogInformation("Retrieved {Count} login activities", dtos.Count);
            return dtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting login activities: {Message}", ex.Message);
            throw;
        }
    }
}
