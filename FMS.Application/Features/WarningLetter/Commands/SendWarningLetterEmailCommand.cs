/**
 * File: SendWarningLetterEmailCommand.cs
 * Purpose: Sends finalized warning letters by email with the generated PDF attached.
 * Dependencies: MediatR, FMSResponse, IWarningLetterService
 * Last Modified: 2026-04-06
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter.Services;
using MediatR;

namespace FMS.Application.Features.WarningLetter.Commands;

public record SendWarningLetterEmailCommand(int Id, string ModifiedBy, string? EmailRecipient) : IRequest<FMSResponse>;

public class SendWarningLetterEmailCommandHandler : IRequestHandler<SendWarningLetterEmailCommand, FMSResponse>
{
    private readonly IWarningLetterService _warningLetterService;

    public SendWarningLetterEmailCommandHandler(IWarningLetterService warningLetterService)
    {
        _warningLetterService = warningLetterService;
    }

    public Task<FMSResponse> Handle(SendWarningLetterEmailCommand request, CancellationToken cancellationToken)
    {
        return _warningLetterService.SendEmailAsync(request.Id, request.ModifiedBy, request.EmailRecipient, cancellationToken);
    }
}