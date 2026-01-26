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
                var errorLog = new ErrorLog
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    Message = request.Message,
                    Stack = request.Stack,
                    ComponentStack = request.ComponentStack,
                    UserAgent = request.UserAgent,
                    Url = request.Url,
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
    }
}