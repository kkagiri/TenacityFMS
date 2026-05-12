using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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

public class GetUserActivitiesQuery : IRequest<List<UserActivityDTO>> {
    public string? UserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Action { get; set; }
    public string? Controller { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50; // Increased default page size

    public GetUserActivitiesQuery () { }

    public GetUserActivitiesQuery (string? userId = null, DateTime? startDate = null, DateTime? endDate = null, string? controller = null) {
        UserId = userId;
        StartDate = startDate;
        EndDate = endDate;
        Controller = controller;
    }
}

public class GetUserActivitiesQueryHandler : IRequestHandler<GetUserActivitiesQuery, List<UserActivityDTO>> {
    private readonly GpsdataContext _context;
    private readonly ILogger<GetUserActivitiesQueryHandler> _logger;
    private readonly IMapper _mapper;

    public GetUserActivitiesQueryHandler (GpsdataContext context, ILogger<GetUserActivitiesQueryHandler> logger, IMapper mapper) {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<List<UserActivityDTO>> Handle (GetUserActivitiesQuery request, CancellationToken cancellationToken) {
        try {
            _logger.LogInformation ("Getting user activities with filters: UserId={UserId}, StartDate={StartDate}, EndDate={EndDate}, Action={Action}, Controller={Controller}",
                request.UserId, request.StartDate, request.EndDate, request.Action, request.Controller);

            var query = _context.UserActivities
                .Include (ua => ua.User)
                .AsQueryable ();

            // Apply filters
            if (!string.IsNullOrEmpty (request.UserId)) {
                query = query.Where (x => x.UserId == request.UserId);
            }

            if (request.StartDate.HasValue) {
                query = query.Where (x => x.Timestamp >= request.StartDate.Value);
            }

            if (request.EndDate.HasValue) {
                query = query.Where (x => x.Timestamp <= request.EndDate.Value);
            }

            if (!string.IsNullOrEmpty (request.Controller)) {
                query = query.Where (x => x.Controller == request.Controller);
            }

            if (!string.IsNullOrEmpty (request.Action)) {
                query = query.Where (x => x.Action.Contains (request.Action));
            }

            // Apply pagination
            var activities = await query
                .OrderByDescending (x => x.Timestamp)
                .Skip ((request.PageNumber - 1) * request.PageSize)
                .Take (request.PageSize)
                .ToListAsync (cancellationToken);

            // Map entities to DTOs
            var activityDTOs = _mapper.Map<List<UserActivityDTO>> (activities);

            return activityDTOs;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error getting user activities: {Message}", ex.Message);
            throw;
        }
    }
}