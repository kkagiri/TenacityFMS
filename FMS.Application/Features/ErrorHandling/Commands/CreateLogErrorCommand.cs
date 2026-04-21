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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
namespace FMS.Application.Features.ErrorHandling.Commands
{


    public class CreateLogErrorCommand : IRequest<bool>
    {
        public string Message { get; set; }
        public string Stack { get; set; }
        public string ComponentStack { get; set; }
        public string UserAgent { get; set; }
        public string Url { get; set; }
        public string? UserId { get; set; }
    }

    public class CreateLogErrorCommandHandler : IRequestHandler<CreateLogErrorCommand, bool>
    {
        private const int DuplicateWindowMinutes = 10;
        private const int DuplicateCandidateLimit = 200;
        private const int SignatureSegmentLength = 500;

        private readonly GpsdataContext _context;
        private readonly ILogger<CreateLogErrorCommandHandler> _logger;

        public CreateLogErrorCommandHandler(GpsdataContext context, ILogger<CreateLogErrorCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> Handle(CreateLogErrorCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var utcNow = DateTime.UtcNow;
                var normalizedMessage = NormalizeForSignature(request.Message);
                var normalizedStack = NormalizeForSignature(request.Stack);
                var normalizedComponentStack = NormalizeForSignature(request.ComponentStack);
                var normalizedUrl = NormalizeUrl(request.Url);

                if (await HasRecentDuplicateAsync(
                        normalizedMessage,
                        normalizedStack,
                        normalizedComponentStack,
                        normalizedUrl,
                        utcNow,
                        cancellationToken))
                {
                    _logger.LogInformation(
                        "Skipped duplicate frontend error report for URL {Url} within {WindowMinutes} minutes.",
                        normalizedUrl,
                        DuplicateWindowMinutes);
                    return true;
                }

                var errorLog = new ErrorLog
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = utcNow,
                    Message = request.Message?.Trim() ?? string.Empty,
                    Stack = request.Stack?.Trim() ?? string.Empty,
                    ComponentStack = request.ComponentStack?.Trim() ?? string.Empty,
                    UserAgent = request.UserAgent,
                    Url = normalizedUrl,
                    UserId = request.UserId
                };

                _context.ErrorLogs.Add(errorLog);
                await _context.SaveChangesAsync(cancellationToken);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while logging error");
                return false;
            }
        }

        private async Task<bool> HasRecentDuplicateAsync(
            string normalizedMessage,
            string normalizedStack,
            string normalizedComponentStack,
            string normalizedUrl,
            DateTime utcNow,
            CancellationToken cancellationToken)
        {
            var windowStart = utcNow.AddMinutes(-DuplicateWindowMinutes);

            var recentCandidates = await _context.ErrorLogs
                .AsNoTracking()
                .Where(log => log.CreatedAt >= windowStart)
                .OrderByDescending(log => log.CreatedAt)
                .Take(DuplicateCandidateLimit)
                .ToListAsync(cancellationToken);

            return recentCandidates.Any(log =>
                NormalizeForSignature(log.Message) == normalizedMessage &&
                NormalizeForSignature(log.Stack) == normalizedStack &&
                NormalizeForSignature(log.ComponentStack) == normalizedComponentStack &&
                NormalizeUrl(log.Url) == normalizedUrl);
        }

        private static string NormalizeForSignature(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var compact = string.Join(" ", value
                .Split(new[] { '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(segment => segment.Trim())
                .Where(segment => segment.Length > 0));

            if (compact.Length <= SignatureSegmentLength)
            {
                return compact;
            }

            return compact[..SignatureSegmentLength];
        }

        private static string NormalizeUrl(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var trimmed = value.Trim();

            if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
            {
                return trimmed.Length <= SignatureSegmentLength
                    ? trimmed
                    : trimmed[..SignatureSegmentLength];
            }

            var normalized = uri.GetLeftPart(UriPartial.Path);
            return normalized.Length <= SignatureSegmentLength
                ? normalized
                : normalized[..SignatureSegmentLength];
        }
    }
}