/**
 * File: GetEventExpressionsQuery.cs
 * Purpose: MediatR query for listing EventExpressions with optional filters.
 * Dependencies: MediatR, FMSResponse, EventExpressionDto
 * Last Modified: 2026-02-11
 */

using System;
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using MediatR;

namespace FMS.Application.Features.EventEngine.Queries
{
    public record GetEventExpressionsQuery(
        string? EventType = null,
        int? SiteId = null,
        bool? IsActive = null,
        int Skip = 0,
        int Take = 50
    ) : IRequest<FMSResponse<List<EventExpressionDto>>>;
}
