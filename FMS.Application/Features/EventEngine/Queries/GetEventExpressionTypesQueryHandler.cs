/**
 * File: GetEventExpressionTypesQueryHandler.cs
 * Purpose: Returns all available event types with their condition metadata.
 * Dependencies: EventExpressionTypeMetadataDto, FMSResponse
 * Last Modified: 2026-02-11
 */

using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using MediatR;

namespace FMS.Application.Features.EventEngine.Queries
{
    public class GetEventExpressionTypesQueryHandler
        : IRequestHandler<GetEventExpressionTypesQuery, FMSResponse<List<EventExpressionTypeMetadataDto>>>
    {
        public Task<FMSResponse<List<EventExpressionTypeMetadataDto>>> Handle(
            GetEventExpressionTypesQuery request,
            CancellationToken cancellationToken)
        {
            var types = EventExpressionTypeMetadataDto.GetAvailableTypes();
            return Task.FromResult(
                FMSResponse<List<EventExpressionTypeMetadataDto>>.Success(types, "Event types fetched successfully"));
        }
    }
}
