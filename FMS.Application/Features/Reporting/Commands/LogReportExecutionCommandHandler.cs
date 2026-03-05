using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Domain.Entities.Features.Reporting;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Handler for logging report executions
    /// </summary>
    public class LogReportExecutionCommandHandler
        : IRequestHandler<LogReportExecutionCommand, FMSResponse<ReportExecutionHistoryDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<LogReportExecutionCommandHandler> _logger;

        public LogReportExecutionCommandHandler(
            GpsdataContext context,
            ILogger<LogReportExecutionCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<ReportExecutionHistoryDTO>> Handle(
            LogReportExecutionCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var resolvedReportDefinitionId = await ResolveReportDefinitionIdAsync(request, cancellationToken);
                if (resolvedReportDefinitionId <= 0)
                {
                    _logger.LogWarning(
                        "Skipping execution log — could not resolve ReportDefinitionId. Input id: {Id}, filters: {Filters}",
                        request.ReportDefinitionId,
                        request.Filters);
                    return FMSResponse<ReportExecutionHistoryDTO>.Failed(
                        "Cannot log execution: report definition could not be resolved.");
                }

                var entity = new ReportExecutionHistory
                {
                    ReportDefinitionId = resolvedReportDefinitionId,
                    ExecutedBy = request.ExecutedBy,
                    ExecutedAt = DateTime.UtcNow,
                    Filters = request.Filters,
                    ExportFormat = request.ExportFormat,
                    RecordCount = request.RecordCount,
                    ExecutionTimeMs = request.ExecutionTimeMs,
                    Success = request.Success,
                    ErrorMessage = request.ErrorMessage,
                    IpAddress = request.IpAddress,
                    UserAgent = request.UserAgent
                };

                _context.ReportExecutionHistories.Add(entity);
                await _context.SaveChangesAsync(cancellationToken);

                var dto = new ReportExecutionHistoryDTO
                {
                    ReportExecutionId = entity.ReportExecutionId,
                    ReportDefinitionId = entity.ReportDefinitionId,
                    ExecutedBy = entity.ExecutedBy,
                    ExecutedAt = entity.ExecutedAt,
                    Filters = entity.Filters,
                    ExportFormat = entity.ExportFormat,
                    RecordCount = entity.RecordCount,
                    ExecutionTimeMs = entity.ExecutionTimeMs,
                    Success = entity.Success,
                    ErrorMessage = entity.ErrorMessage,
                    IpAddress = entity.IpAddress
                };

                return FMSResponse<ReportExecutionHistoryDTO>.Success(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging report execution");
                return FMSResponse<ReportExecutionHistoryDTO>.Failed($"Error: {ex.Message}");
            }
        }

        private async Task<int> ResolveReportDefinitionIdAsync(
            LogReportExecutionCommand request,
            CancellationToken cancellationToken)
        {
            if (request.ReportDefinitionId > 0)
            {
                var exists = await _context.ReportDefinitions
                    .AsNoTracking()
                    .AnyAsync(d => d.ReportDefinitionId == request.ReportDefinitionId, cancellationToken);

                if (exists)
                {
                    return request.ReportDefinitionId;
                }
            }

            var candidateKeys = ExtractCandidateReportKeys(request.Filters);
            if (candidateKeys.Count == 0)
            {
                return 0;
            }

            var definitions = await _context.ReportDefinitions
                .AsNoTracking()
                .Select(d => new
                {
                    d.ReportDefinitionId,
                    d.ReportId,
                    d.ReportName,
                    d.DataSourceEndpoint
                })
                .ToListAsync(cancellationToken);

            foreach (var candidate in candidateKeys)
            {
                var exactMatch = definitions.FirstOrDefault(d =>
                    string.Equals(d.ReportId, candidate, StringComparison.OrdinalIgnoreCase));
                if (exactMatch != null)
                {
                    return exactMatch.ReportDefinitionId;
                }
            }

            foreach (var candidate in candidateKeys)
            {
                var byName = definitions.FirstOrDefault(d =>
                    string.Equals(d.ReportName, candidate, StringComparison.OrdinalIgnoreCase));
                if (byName != null)
                {
                    return byName.ReportDefinitionId;
                }
            }

            foreach (var candidate in candidateKeys)
            {
                var containsMatch = definitions.FirstOrDefault(d =>
                    (!string.IsNullOrWhiteSpace(d.ReportId) &&
                     d.ReportId.Contains(candidate, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(d.DataSourceEndpoint) &&
                     d.DataSourceEndpoint.Contains(candidate, StringComparison.OrdinalIgnoreCase)));

                if (containsMatch != null)
                {
                    return containsMatch.ReportDefinitionId;
                }
            }

            return 0;
        }

        private static HashSet<string> ExtractCandidateReportKeys(string? filtersJson)
        {
            var candidates = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (string.IsNullOrWhiteSpace(filtersJson))
            {
                return candidates;
            }

            try
            {
                var root = JObject.Parse(filtersJson);

                AddCandidate(candidates, root.Value<string>("reportId"));
                AddCandidate(candidates, root.Value<string>("sourceId"));
                AddCandidate(candidates, root.Value<string>("sourceName"));
                AddCandidate(candidates, root.Value<string>("templateName"));
                AddCandidate(candidates, root.Value<string>("reportType"));
            }
            catch
            {
                return candidates;
            }

            return candidates;
        }

        private static void AddCandidate(HashSet<string> candidates, string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            var trimmed = value.Trim();
            if (trimmed.Length == 0)
            {
                return;
            }

            candidates.Add(trimmed);

            var kebab = ToKebabCase(trimmed);
            if (!string.IsNullOrWhiteSpace(kebab))
            {
                candidates.Add(kebab);
                if (!kebab.EndsWith("-report", StringComparison.OrdinalIgnoreCase))
                {
                    candidates.Add($"{kebab}-report");
                }
                else
                {
                    candidates.Add(kebab[..^7]);
                }
            }
        }

        private static string ToKebabCase(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var chars = new List<char>(value.Length + 8);
            for (var i = 0; i < value.Length; i++)
            {
                var c = value[i];
                if (char.IsUpper(c) && i > 0 && value[i - 1] != '-' && value[i - 1] != '_' && !char.IsUpper(value[i - 1]))
                {
                    chars.Add('-');
                }

                if (c == '_' || c == ' ')
                {
                    chars.Add('-');
                    continue;
                }

                chars.Add(char.ToLowerInvariant(c));
            }

            return new string(chars.ToArray()).Trim('-');
        }
    }
}
