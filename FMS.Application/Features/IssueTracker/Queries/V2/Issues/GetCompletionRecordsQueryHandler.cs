/**
 * File: GetCompletionRecordsQueryHandler.cs
 * Purpose: Handles fetching structured completion records for an issue, with denormalized vehicle names
 * Dependencies: MediatR, GpsdataContext, IssueCompletionRecordDTO
 * Last Modified: 2026-02-21
 *
 * Key Functions:
 * - Handle: Queries IssueCompletionRecords by IssueId with projection to DTO
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.IssueTracker.Queries.V2.Issues
{
    public class GetCompletionRecordsQueryHandler
        : IRequestHandler<GetCompletionRecordsQuery, FMSResponse<List<IssueCompletionRecordDTO>>>
    {
        private readonly GpsdataContext _context;

        public GetCompletionRecordsQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<List<IssueCompletionRecordDTO>>> Handle(
            GetCompletionRecordsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Verify issue exists
                var issueExists = await _context.Issuetrackers
                    .AnyAsync(i => i.Id == request.IssueId, cancellationToken);

                if (!issueExists)
                {
                    return FMSResponse<List<IssueCompletionRecordDTO>>.Failed(
                        $"Issue with ID {request.IssueId} not found.");
                }

                var records = await _context.IssueCompletionRecords
                    .Where(r => r.IssueId == request.IssueId)
                    .OrderByDescending(r => r.CompletedAt)
                    .Select(r => new IssueCompletionRecordDTO
                    {
                        Id = r.Id,
                        IssueId = r.IssueId,
                        TemplateActionId = r.TemplateActionId,
                        ActionName = r.ActionName,
                        ActionType = r.TemplateAction != null ? r.TemplateAction.ActionType : null,
                        RootCause = r.RootCause,
                        Notes = r.Notes,
                        OldDeviceType = r.OldDeviceType,
                        OldDeviceImei = r.OldDeviceImei,
                        NewDeviceType = r.NewDeviceType,
                        NewDeviceImei = r.NewDeviceImei,
                        DevicePhoneNumber = r.DevicePhoneNumber,
                        SourceVehicleId = r.SourceVehicleId,
                        SourceVehicleName = r.SourceVehicle != null
                            ? r.SourceVehicle.HyoungNo ?? r.SourceVehicle.NumberPlate
                            : null,
                        CameraImei = r.CameraImei,
                        CameraPosition = r.CameraPosition,
                        CameraSimNumber = r.CameraSimNumber,
                        AdditionalNotes = r.AdditionalNotes,
                        CompletedByUserId = r.CompletedByUserId,
                        CompletedByUserName = r.CompletedByUserName,
                        CompletedAt = r.CompletedAt
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<IssueCompletionRecordDTO>>.Success(records);
            }
            catch (Exception ex)
            {
                return FMSResponse<List<IssueCompletionRecordDTO>>.Failed(
                    $"Error fetching completion records: {ex.Message}");
            }
        }
    }
}
