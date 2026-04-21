/**
 * File: CreateLogErrorCommand.cs
 * Purpose: Defines the command and handler for logging client-side errors.
 * Dependencies: MediatR, GpsdataContext, ErrorLog
 * Last Modified: 2026-01-26
 *
 * Key Classes:
 * - CreateLogErrorCommand: Request model for error logging
 * - CreateLogErrorCommandHandler: Persists error logs
 */
using FMS.Application.CommonInterface;
using FMS.Domain.Entities.Features.ErrorManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
namespace FMS.Application.Features.ErrorHandling.Commands
{


    public class CreateLogErrorResult
    {
        public bool Success { get; set; }
        public bool WasAggregated { get; set; }
        public string Fingerprint { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime WindowStartUtc { get; set; }
    }

    public class CreateLogErrorCommand : IRequest<CreateLogErrorResult>
    {
        public string Message { get; set; }
        public string Stack { get; set; }
        public string ComponentStack { get; set; }
        public string UserAgent { get; set; }
        public string Url { get; set; }
        public string? UserId { get; set; }
    }

    public class CreateLogErrorCommandHandler : IRequestHandler<CreateLogErrorCommand, CreateLogErrorResult>
    {
        private static readonly TimeSpan AggregationWindow = TimeSpan.FromMinutes(5);
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateLogErrorCommandHandler> _logger;

        public CreateLogErrorCommandHandler(GpsdataContext context, ILogger<CreateLogErrorCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<CreateLogErrorResult> Handle(CreateLogErrorCommand request, CancellationToken cancellationToken)
        {
            var nowUtc = DateTime.UtcNow;
            var normalizedRequest = ErrorLogFingerprintBuilder.Normalize(
                request.Message,
                request.Stack,
                request.ComponentStack,
                request.UserAgent,
                request.Url,
                request.UserId);
            var deduplicationFingerprint = ErrorLogFingerprintBuilder.BuildForDeduplication(normalizedRequest);

            try
            {
                var windowStartUtc = nowUtc.Subtract(AggregationWindow);
                var hasRecentDuplicate = await HasRecentDuplicateAsync(
                    request,
                    deduplicationFingerprint,
                    windowStartUtc,
                    cancellationToken);

                if (hasRecentDuplicate)
                {
                    return new CreateLogErrorResult
                    {
                        Success = true,
                        WasAggregated = true,
                        Fingerprint = deduplicationFingerprint,
                        CreatedAt = nowUtc,
                        WindowStartUtc = windowStartUtc
                    };
                }

                var errorLog = new ErrorLog
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = nowUtc,
                    Message = normalizedRequest.Message,
                    Stack = normalizedRequest.Stack,
                    ComponentStack = normalizedRequest.ComponentStack,
                    UserAgent = normalizedRequest.UserAgent,
                    Url = normalizedRequest.Url,
                    UserId = normalizedRequest.UserId
                };

                _context.ErrorLogs.Add(errorLog);
                await _context.SaveChangesAsync(cancellationToken);

                return new CreateLogErrorResult
                {
                    Success = true,
                    WasAggregated = false,
                    Fingerprint = deduplicationFingerprint,
                    CreatedAt = errorLog.CreatedAt,
                    WindowStartUtc = windowStartUtc
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while logging error");
                return new CreateLogErrorResult
                {
                    Success = false,
                    WasAggregated = false,
                    Fingerprint = deduplicationFingerprint,
                    CreatedAt = nowUtc,
                    WindowStartUtc = nowUtc.Subtract(AggregationWindow)
                };
            }
        }

        private async Task<bool> HasRecentDuplicateAsync(
            CreateLogErrorCommand request,
            string deduplicationFingerprint,
            DateTime windowStartUtc,
            CancellationToken cancellationToken)
        {
            var query = _context.ErrorLogs
                .AsNoTracking()
                .Where(log => log.CreatedAt >= windowStartUtc && log.Message == request.Message);

            if (string.IsNullOrWhiteSpace(request.Url))
            {
                query = query.Where(log => string.IsNullOrEmpty(log.Url));
            }
            else
            {
                query = query.Where(log => log.Url == request.Url);
            }

            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                query = query.Where(log => string.IsNullOrEmpty(log.UserId));
            }
            else
            {
                query = query.Where(log => log.UserId == request.UserId);
            }

            var recentCandidates = await query
                .OrderByDescending(log => log.CreatedAt)
                .Take(25)
                .ToListAsync(cancellationToken);

            return recentCandidates.Any(log =>
            {
                var normalizedLog = ErrorLogFingerprintBuilder.Normalize(
                    log.Message,
                    log.Stack,
                    log.ComponentStack,
                    log.UserAgent,
                    log.Url,
                    log.UserId);
                var existingFingerprint = ErrorLogFingerprintBuilder.BuildForDeduplication(normalizedLog);
                return existingFingerprint == deduplicationFingerprint;
            });
        }
    }

    internal sealed record NormalizedErrorPayload(
        string Message,
        string Stack,
        string ComponentStack,
        string UserAgent,
        string Url,
        string UserId);

    internal static class ErrorLogFingerprintBuilder
    {
        public static NormalizedErrorPayload Normalize(
            string message,
            string stack,
            string componentStack,
            string userAgent,
            string url,
            string userId)
        {
            return new NormalizedErrorPayload(
                NormalizeText(message),
                NormalizeMultilineText(stack),
                NormalizeMultilineText(componentStack),
                NormalizeText(userAgent),
                NormalizeUrl(url),
                NormalizeText(userId));
        }

        public static string BuildForDeduplication(NormalizedErrorPayload payload)
        {
            return ComputeHash(string.Join("|", new[]
            {
                payload.Message,
                payload.Stack,
                payload.ComponentStack,
                payload.UserAgent,
                payload.Url,
                payload.UserId
            }));
        }

        public static string BuildForGrouping(NormalizedErrorPayload payload)
        {
            return ComputeHash(string.Join("|", new[]
            {
                payload.Message,
                payload.Stack,
                payload.ComponentStack,
                payload.Url
            }));
        }

        private static string NormalizeText(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var normalized = value.Trim().ToLowerInvariant();
            var parts = normalized.Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            return string.Join(" ", parts);
        }

        private static string NormalizeMultilineText(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var normalizedLines = value
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(NormalizeText)
                .Where(line => !string.IsNullOrWhiteSpace(line));

            return string.Join("\n", normalizedLines);
        }

        private static string NormalizeUrl(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out var absoluteUri)
                && !Uri.TryCreate(value.Trim(), UriKind.Relative, out var relativeUri))
            {
                return NormalizeText(value);
            }

            if (absoluteUri != null)
            {
                var pathAndQuery = string.Concat(absoluteUri.AbsolutePath, absoluteUri.Query);
                return NormalizeText(pathAndQuery);
            }

            return NormalizeText(relativeUri.ToString());
        }

        private static string ComputeHash(string value)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(bytes);
        }
    }
}