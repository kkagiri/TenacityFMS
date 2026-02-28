/**
 * File: GetVehicleTransferCheckupTemplatesQuery.cs
 * Purpose: Query contract for reading vehicle transfer checkup template rows with optional criteria filters.
 * Dependencies: MediatR, FMSResponse, DTOs
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - GetVehicleTransferCheckupTemplatesQuery: Supports admin listing and runtime vehicle-matched template loading.
 */
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTransfer.Queries;

public record GetVehicleTransferCheckupTemplatesQuery(
    int? VehicleTypeId = null,
    int? VehicleModelId = null,
    bool? HasGps = null,
    bool IncludeInactive = false,
    bool ApplyVehicleMatching = false
) : IRequest<FMSResponse<List<VehicleTransferCheckupTemplateItemDTO>>>;
