/**
 * File: GetVehicleTransferCheckupTemplatesQueryHandler.cs
 * Purpose: Handles retrieval of vehicle transfer checkup templates for both runtime and admin views.
 * Dependencies: EF Core, GpsdataContext, MediatR
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - Handle(): Applies active filters, optional criteria matching, ordering, and DTO projection.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.VehicleTransfer.Queries;

public class GetVehicleTransferCheckupTemplatesQueryHandler : IRequestHandler<GetVehicleTransferCheckupTemplatesQuery, FMSResponse<List<VehicleTransferCheckupTemplateItemDTO>>>
{
    private readonly GpsdataContext _context;

    public GetVehicleTransferCheckupTemplatesQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<VehicleTransferCheckupTemplateItemDTO>>> Handle(GetVehicleTransferCheckupTemplatesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.VehicleTransferCheckupTemplates
                .AsNoTracking()
                .Include(item => item.VehicleType)
                .Include(item => item.VehicleModel)
                .AsQueryable();

            if (!request.IncludeInactive)
            {
                query = query.Where(item => item.IsActive);
            }

            if (request.ApplyVehicleMatching)
            {
                if (request.VehicleTypeId.HasValue)
                {
                    query = query.Where(item => !item.VehicleTypeId.HasValue || item.VehicleTypeId == request.VehicleTypeId.Value);
                }
                else
                {
                    query = query.Where(item => !item.VehicleTypeId.HasValue);
                }

                if (request.VehicleModelId.HasValue)
                {
                    query = query.Where(item => !item.VehicleModelId.HasValue || item.VehicleModelId == request.VehicleModelId.Value);
                }
                else
                {
                    query = query.Where(item => !item.VehicleModelId.HasValue);
                }

                if (request.HasGps.HasValue)
                {
                    query = query.Where(item => !item.HasGps.HasValue || item.HasGps == request.HasGps.Value);
                }
                else
                {
                    query = query.Where(item => !item.HasGps.HasValue);
                }
            }
            else
            {
                if (request.VehicleTypeId.HasValue)
                {
                    query = query.Where(item => item.VehicleTypeId == request.VehicleTypeId.Value);
                }

                if (request.VehicleModelId.HasValue)
                {
                    query = query.Where(item => item.VehicleModelId == request.VehicleModelId.Value);
                }

                if (request.HasGps.HasValue)
                {
                    query = query.Where(item => item.HasGps == request.HasGps.Value);
                }
            }

            var result = await query
                .OrderBy(item => item.SortOrder)
                .ThenBy(item => item.SerialNo)
                .ThenBy(item => item.Id)
                .Select(item => new VehicleTransferCheckupTemplateItemDTO
                {
                    Id = item.Id,
                    SerialNo = item.SerialNo,
                    Description = item.Description,
                    CheckType = item.CheckType,
                    VehicleTypeId = item.VehicleTypeId,
                    VehicleTypeName = item.VehicleType != null ? item.VehicleType.Name : null,
                    VehicleModelId = item.VehicleModelId,
                    VehicleModelName = item.VehicleModel != null ? item.VehicleModel.Name : null,
                    HasGps = item.HasGps,
                    SortOrder = item.SortOrder,
                    IsActive = item.IsActive,
                    CreatedBy = item.CreatedBy,
                    ModifiedBy = item.ModifiedBy,
                    DateCreated = item.DateCreated,
                    DateModified = item.DateModified
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<VehicleTransferCheckupTemplateItemDTO>>.Success(result, "Checkup template items fetched successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<List<VehicleTransferCheckupTemplateItemDTO>>.Failed($"Error loading checkup template items: {ex.Message}");
        }
    }
}
