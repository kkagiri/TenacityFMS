/**
 * File: GetInTankDeliveriesBySiteQuery.cs
 * Purpose: Query to retrieve in-tank deliveries filtered by site and date range
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-02-10
 */
using System;
using System.Collections.Generic;
using MediatR;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.Deliveries.DTOs;

namespace FMS.Application.Features.TankManagement.Deliveries.Queries
{
    public record GetInTankDeliveriesBySiteQuery(
        int SiteId,
        DateTime? StartDate = null,
        DateTime? EndDate = null,
        string? Status = null
    ) : IRequest<FMSResponse<List<InTankDeliveryDetectionDTO>>>;
}
