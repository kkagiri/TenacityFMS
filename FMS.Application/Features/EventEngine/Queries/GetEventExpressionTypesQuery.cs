/**
 * File: GetEventExpressionTypesQuery.cs
 * Purpose: MediatR query for fetching available event type metadata.
 * Dependencies: MediatR, FMSResponse, EventExpressionTypeMetadataDto
 * Last Modified: 2026-02-11
 */

using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using MediatR;

namespace FMS.Application.Features.EventEngine.Queries
{
    public record GetEventExpressionTypesQuery() : IRequest<FMSResponse<List<EventExpressionTypeMetadataDto>>>;
}
