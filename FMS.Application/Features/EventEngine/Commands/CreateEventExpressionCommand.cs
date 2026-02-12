/**
 * File: CreateEventExpressionCommand.cs
 * Purpose: MediatR command for creating a new EventExpression.
 * Dependencies: MediatR, FMSResponse, CreateEventExpressionRequest
 * Last Modified: 2026-02-11
 */

using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using MediatR;

namespace FMS.Application.Features.EventEngine.Commands
{
    public class CreateEventExpressionCommand : IRequest<FMSResponse<EventExpressionDto>>
    {
        public CreateEventExpressionRequest Request { get; set; } = null!;
        public string CreatedBy { get; set; } = null!;
    }
}
