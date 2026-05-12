/**
 * File: GetTankMeasurementHistoryQuery.cs
 * Purpose: Query to retrieve tank measurement history for charting.
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-02-12
 */
using System;
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.TankMeasurements.DTOs;
using MediatR;

namespace FMS.Application.Features.TankManagement.TankMeasurements.Queries
{
    public record GetTankMeasurementHistoryQuery(
        int TankId,
        DateTime? StartDate = null,
        DateTime? EndDate = null
    ) : IRequest<FMSResponse<List<TankMeasurementHistoryDto>>>;
}
