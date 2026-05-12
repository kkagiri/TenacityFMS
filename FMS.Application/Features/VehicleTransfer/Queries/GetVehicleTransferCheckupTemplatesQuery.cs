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
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTransfer.Queries;

public record GetVehicleTransferCheckupTemplatesQuery(
    int? VehicleTypeId = null,
    int? VehicleModelId = null,
    bool? HasGps = null,
    bool IncludeInactive = false,
    bool ApplyVehicleMatching = false
) : IRequest<FMSResponse<List<VehicleTransferCheckupTemplateItemDTO>>>;

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
