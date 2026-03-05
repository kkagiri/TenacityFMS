/**
 * File: GetAutoImportSettingsQuery.cs
 * Purpose: MediatR query to retrieve fuel auto-import settings from SystemConfigurations table
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-03-03
 */
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using MediatR;

namespace FMS.Application.Features.FuelImport.Queries;

/// <summary>
/// Query to retrieve the aggregated fuel auto-import settings from the SystemConfigurations table.
/// </summary>
public class GetAutoImportSettingsQuery : IRequest<FMSResponse<FuelAutoImportSettingsDto>>
{
}
