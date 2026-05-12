/**
 * File: DeleteEventExpressionCommand.cs
 * Purpose: MediatR command for deleting (deactivating) an EventExpression.
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-02-11
 */

using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.EventEngine.Commands
{
    public class DeleteEventExpressionCommand : IRequest<FMSResponse<bool>>
    {
        public int Id { get; set; }
        public string DeletedBy { get; set; } = null!;
    }
}
