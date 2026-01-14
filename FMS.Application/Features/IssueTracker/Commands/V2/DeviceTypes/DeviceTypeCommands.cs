using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Commands.V2.DeviceTypes;

/// <summary>
/// Create a new Device Type
/// </summary>
public record CreateDeviceTypeCommand(CreateDeviceTypeDTO DeviceType)
    : IRequest<FMSResponse<DeviceTypeDTO>>;

/// <summary>
/// Update an existing Device Type
/// </summary>
public record UpdateDeviceTypeCommand(UpdateDeviceTypeDTO DeviceType)
    : IRequest<FMSResponse<DeviceTypeDTO>>;

/// <summary>
/// Delete a Device Type
/// </summary>
public record DeleteDeviceTypeCommand(int Id)
    : IRequest<FMSResponse<bool>>;
