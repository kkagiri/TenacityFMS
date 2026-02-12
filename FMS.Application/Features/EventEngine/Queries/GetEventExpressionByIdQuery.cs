/**
 * File: GetEventExpressionByIdQuery.cs
 * Purpose: MediatR query for fetching a single EventExpression by ID.
 * Dependencies: MediatR, FMSResponse, EventExpressionDto
 * Last Modified: 2026-02-11
 */

using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using MediatR;

namespace FMS.Application.Features.EventEngine.Queries
{
    public record GetEventExpressionByIdQuery(int Id) : IRequest<FMSResponse<EventExpressionDto>>;
}
