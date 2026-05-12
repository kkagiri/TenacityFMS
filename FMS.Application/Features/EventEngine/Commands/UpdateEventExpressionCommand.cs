/**
 * File: UpdateEventExpressionCommand.cs
 * Purpose: MediatR command for updating an existing EventExpression.
 * Dependencies: MediatR, FMSResponse, UpdateEventExpressionRequest
 * Last Modified: 2026-02-11
 */

using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using MediatR;

namespace FMS.Application.Features.EventEngine.Commands
{
    public class UpdateEventExpressionCommand : IRequest<FMSResponse<EventExpressionDto>>
    {
        public int Id { get; set; }
        public UpdateEventExpressionRequest Request { get; set; } = null!;
        public string ModifiedBy { get; set; } = null!;
    }
}
