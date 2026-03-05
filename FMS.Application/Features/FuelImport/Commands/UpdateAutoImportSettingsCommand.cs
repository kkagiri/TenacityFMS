/**
 * File: UpdateAutoImportSettingsCommand.cs
 * Purpose: MediatR command to update fuel auto-import settings in SystemConfigurations table
 * Dependencies: MediatR, FMSResponse, FuelAutoImportSettingsDto
 * Last Modified: 2026-03-03
 */
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using MediatR;

namespace FMS.Application.Features.FuelImport.Commands;

/// <summary>
/// Command to update all fuel auto-import settings in the SystemConfigurations table.
/// Creates rows that don't exist yet; updates rows that do.
/// </summary>
public class UpdateAutoImportSettingsCommand : IRequest<FMSResponse<FuelAutoImportSettingsDto>>
{
    public FuelAutoImportSettingsDto Settings { get; set; } = null!;
    public string ModifiedBy { get; set; } = "System";
}
