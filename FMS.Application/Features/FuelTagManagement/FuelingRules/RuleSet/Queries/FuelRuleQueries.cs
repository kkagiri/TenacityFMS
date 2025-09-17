using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSet.Queries {

    public record GetFuelTagByNameQuery (string TagName) : IRequest<FuelTag>;

    public record GetFuelTakenTodayQuery (string TagId) : IRequest<decimal>;

    public record GetFuelTakenThisMonthQuery (string TagId) : IRequest<decimal>;

    public record GetNoOfRefillsTodayQuery (string TagId) : IRequest<int>;

    public record GetNoOfRefillsThisWeekQuery (string TagId) : IRequest<int>;

    public record GetNoOfRefillsThisMonthQuery (string TagId) : IRequest<int>;




    public class GetFuelTagByNameHandler : IRequestHandler<GetFuelTagByNameQuery, FuelTag> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetFuelTagByNameHandler> _logger;

        public GetFuelTagByNameHandler (GpsdataContext context, ILogger<GetFuelTagByNameHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FuelTag> Handle (GetFuelTagByNameQuery request, CancellationToken cancellationToken) {
            try {
                return await _context.FuelTags.FirstOrDefaultAsync (t => t.Name == request.TagName, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving tag with name {TagName}", request.TagName);
                throw;
            }
        }
    }


    public class GetFuelTakenTodayHandler : IRequestHandler<GetFuelTakenTodayQuery, decimal> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetFuelTakenTodayHandler> _logger;

        public GetFuelTakenTodayHandler (GpsdataContext context, ILogger<GetFuelTakenTodayHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<decimal> Handle (GetFuelTakenTodayQuery request, CancellationToken cancellationToken) {
            try {

                var today = DateTime.UtcNow.Date;
                return await _context.FuelRefills
                    .Where (ft => ft.TagId != null //TO:DO Make sure all vehicles have tags
                        &&
                        ft.TagId == request.TagId &&
                        ft.DateCreated.Date == today)
                    .SumAsync (ft => ft.ManualFuelrefillAmount ?? 0m, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving today's fuel taken for Tag {TagId}", request.TagId);
                throw;
            }
        }
    }

    public class GetFuelTakenThisMonthHandler : IRequestHandler<GetFuelTakenThisMonthQuery, decimal> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetFuelTakenThisMonthHandler> _logger;

        public GetFuelTakenThisMonthHandler (GpsdataContext context, ILogger<GetFuelTakenThisMonthHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<decimal> Handle (GetFuelTakenThisMonthQuery request, CancellationToken cancellationToken) {
            try {
                var startOfMonth = new DateTime (DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                var endOfMonth = startOfMonth.AddMonths (1).AddDays (-1);

                return await _context.FuelRefills
                    .Where (ft => ft.TagId == request.TagId &&
                        ft.DateCreated >= startOfMonth &&
                        ft.DateCreated <= endOfMonth)
                    .SumAsync (ft => ft.ManualFuelrefillAmount ?? 0m, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving this month's fuel taken for Tag {TagId}", request.TagId);
                throw;
            }
        }
    }

    public class GetNoOfRefillsTodayHandler : IRequestHandler<GetNoOfRefillsTodayQuery, int> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetNoOfRefillsTodayHandler> _logger;

        public GetNoOfRefillsTodayHandler (GpsdataContext context, ILogger<GetNoOfRefillsTodayHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<int> Handle (GetNoOfRefillsTodayQuery request, CancellationToken cancellationToken) {
            try {
                var today = DateTime.UtcNow.Date;
                return await _context.FuelRefills
                    .CountAsync (ft => ft.TagId == request.TagId &&
                        ft.DateCreated.Date == today,
                        cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving today's refill count for Tag {TagId}", request.TagId);
                throw;
            }
        }
    }

    public class GetNoOfRefillsThisWeekHandler : IRequestHandler<GetNoOfRefillsThisWeekQuery, int> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetNoOfRefillsThisWeekHandler> _logger;

        public GetNoOfRefillsThisWeekHandler (GpsdataContext context, ILogger<GetNoOfRefillsThisWeekHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<int> Handle (GetNoOfRefillsThisWeekQuery request, CancellationToken cancellationToken) {
            try {
                var today = DateTime.UtcNow.Date;
                var startOfWeek = today.AddDays (-(int) today.DayOfWeek);
                var endOfWeek = startOfWeek.AddDays (7).AddSeconds (-1);

                return await _context.FuelRefills
                    .CountAsync (ft => ft.TagId == request.TagId &&
                        ft.DateCreated >= startOfWeek &&
                        ft.DateCreated <= endOfWeek,
                        cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving this week's refill count for Tag {TagId}", request.TagId);
                throw;
            }
        }
    }

    public class GetNoOfRefillsThisMonthHandler : IRequestHandler<GetNoOfRefillsThisMonthQuery, int> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetNoOfRefillsThisMonthHandler> _logger;

        public GetNoOfRefillsThisMonthHandler (GpsdataContext context, ILogger<GetNoOfRefillsThisMonthHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<int> Handle (GetNoOfRefillsThisMonthQuery request, CancellationToken cancellationToken) {
            try {
                var startOfMonth = new DateTime (DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                var endOfMonth = startOfMonth.AddMonths (1).AddDays (-1);

                return await _context.FuelRefills
                    .CountAsync (ft => ft.TagId == request.TagId &&
                        ft.DateCreated >= startOfMonth &&
                        ft.DateCreated <= endOfMonth,
                        cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving this month's refill count for Tag {TagId}", request.TagId);
                throw;
            }
        }
    }
}
