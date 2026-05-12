using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Queries.V2.DeviceTypes;

/// <summary>
/// Get all Device Types
/// </summary>
public record GetDeviceTypesQuery() : IRequest<FMSResponse<List<DeviceTypeDTO>>>;

/// <summary>
/// Get Device Type by ID
/// </summary>
public record GetDeviceTypeByIdQuery(int Id) : IRequest<FMSResponse<DeviceTypeDTO>>;
