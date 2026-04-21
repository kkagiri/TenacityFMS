
using MediatR;
using FMS.Application.CommonInterface;
using FMS.Application.Features.ErrorHandling.Commands;
using FMS.Application.Features.ErrorHandling.Dtos;
using FMS.Domain.Entities.Features.ErrorManagement;
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
    public class GetErrorLogQuery : IRequest<FMSResponse<ErrorLogDashboardDto>>
    {
        public int PageSize { get; set; } = 50;
        public int PageNumber { get; set; } = 1;

        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class GetErrorLogQueryHandler : IRequestHandler<GetErrorLogQuery, FMSResponse<ErrorLogDashboardDto>>
    {
        private static readonly TimeSpan GroupingWindow = TimeSpan.FromMinutes(5);
        private readonly GpsdataContext _context;

        public GetErrorLogQueryHandler(GpsdataContext context)
        {
            _context = context;
        }
        public async Task<FMSResponse<ErrorLogDashboardDto>> Handle(GetErrorLogQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.ErrorLogs.AsNoTracking().AsQueryable();

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
                var normalizedPageSize = Math.Max(1, request.PageSize);
                var normalizedPageNumber = Math.Max(1, request.PageNumber);

                var errorLogs = await query
                    .Skip((normalizedPageNumber - 1) * normalizedPageSize)
                    .Take(normalizedPageSize)
                    .ToListAsync(cancellationToken);

                var groupingCandidateLimit = Math.Min(Math.Max(normalizedPageSize * 20, 250), 1000);
                var groupingCandidates = await query
                    .Take(groupingCandidateLimit)
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
                    Fingerprint = ErrorLogFingerprintBuilder.BuildForGrouping(
                        ErrorLogFingerprintBuilder.Normalize(
                            e.Message,
                            e.Stack,
                            e.ComponentStack,
                            e.UserAgent,
                            e.Url,
                            e.UserId)),
                    CreatedAt = e.CreatedAt
                }).ToList();

                var groupedErrors = BuildGroupedErrors(groupingCandidates);

                var dashboardDto = new ErrorLogDashboardDto
                {
                    GroupedErrors = groupedErrors,
                    RecentErrors = errorLogDtos,
                    PageNumber = normalizedPageNumber,
                    PageSize = normalizedPageSize,
                    TotalRecentRecords = totalRecords,
                    HasMore = (normalizedPageNumber * normalizedPageSize) < totalRecords
                };

                return FMSResponse<ErrorLogDashboardDto>.Success(dashboardDto, "Error logs retrieved successfully.");
            }
            catch (Exception ex)
            {
                return FMSResponse<ErrorLogDashboardDto>.Failed($"An error occurred while retrieving error logs: {ex.Message}");
            }
        }

        private static List<ErrorLogGroupDto> BuildGroupedErrors(List<ErrorLog> logs)
        {
            return logs
                .GroupBy(log => ErrorLogFingerprintBuilder.BuildForGrouping(
                    ErrorLogFingerprintBuilder.Normalize(
                        log.Message,
                        log.Stack,
                        log.ComponentStack,
                        log.UserAgent,
                        log.Url,
                        log.UserId)))
                .SelectMany(group => BuildRollingWindows(group.Key, group.OrderBy(log => log.CreatedAt).ToList()))
                .OrderByDescending(group => group.OccurrenceCount)
                .ThenByDescending(group => group.LastSeenAt)
                .Take(12)
                .ToList();
        }

        private static IEnumerable<ErrorLogGroupDto> BuildRollingWindows(
            string fingerprint,
            List<ErrorLog> orderedLogs)
        {
            ErrorLogGroupDto currentWindow = null;

            foreach (var log in orderedLogs)
            {
                if (currentWindow == null || (log.CreatedAt - currentWindow.LastSeenAt) > GroupingWindow)
                {
                    if (currentWindow != null)
                    {
                        yield return currentWindow;
                    }

                    currentWindow = new ErrorLogGroupDto
                    {
                        Fingerprint = fingerprint,
                        Message = log.Message,
                        Stack = log.Stack,
                        ComponentStack = log.ComponentStack,
                        Url = log.Url,
                        UserAgent = log.UserAgent,
                        FirstSeenAt = log.CreatedAt,
                        LastSeenAt = log.CreatedAt,
                        OccurrenceCount = 1,
                        DistinctUserCount = string.IsNullOrWhiteSpace(log.UserId) ? 0 : 1,
                        UserIds = string.IsNullOrWhiteSpace(log.UserId) ? new List<string>() : new List<string> { log.UserId },
                        LatestLogId = log.Id
                    };

                    continue;
                }

                currentWindow.OccurrenceCount += 1;
                currentWindow.LastSeenAt = log.CreatedAt;
                currentWindow.LatestLogId = log.Id;

                if (!string.IsNullOrWhiteSpace(log.UserId) && !currentWindow.UserIds.Contains(log.UserId))
                {
                    currentWindow.UserIds.Add(log.UserId);
                    currentWindow.DistinctUserCount = currentWindow.UserIds.Count;
                }
            }

            if (currentWindow != null)
            {
                yield return currentWindow;
            }
        }
    }
}