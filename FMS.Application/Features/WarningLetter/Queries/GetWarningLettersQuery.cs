/**
 * File: GetWarningLettersQuery.cs
 * Purpose: Returns filtered warning letter lists for API consumers.
 * Dependencies: MediatR, GpsdataContext, FMSResponse, WarningLetter DTOs/entities
 * Last Modified: 2026-04-09
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.WarningLetter;
using FMS.Application.Features.WarningLetter.DTOs;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.WarningLetter.Queries;

public class GetWarningLettersQuery : IRequest<FMSResponse<List<WarningLetterListDto>>>
{
    public int? SiteId { get; set; }
    public int? EmployeeId { get; set; }
    public int? VehicleId { get; set; }
    public WarningLetterType? LetterType { get; set; }
    public WarningLetterStatus? Status { get; set; }
    public WarningLetterWorkflowStage? WorkflowStage { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class GetWarningLettersQueryHandler : IRequestHandler<GetWarningLettersQuery, FMSResponse<List<WarningLetterListDto>>>
{
    private readonly GpsdataContext _context;

    public GetWarningLettersQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<WarningLetterListDto>>> Handle(GetWarningLettersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.WarningLetters
            .AsNoTracking()
            .Include(w => w.Employee)
            .Include(w => w.Vehicle)
            .Include(w => w.Site)
            .AsQueryable();

        if (request.SiteId.HasValue)
        {
            query = query.Where(w => w.SiteId == request.SiteId.Value);
        }

        if (request.EmployeeId.HasValue)
        {
            query = query.Where(w => w.EmployeeId == request.EmployeeId.Value);
        }

        if (request.VehicleId.HasValue)
        {
            query = query.Where(w => w.VehicleId == request.VehicleId.Value);
        }

        if (request.LetterType.HasValue)
        {
            query = query.Where(w => w.LetterType == request.LetterType.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(w => w.Status == request.Status.Value);
        }

        if (request.WorkflowStage.HasValue)
        {
            query = request.WorkflowStage.Value switch
            {
                WarningLetterWorkflowStage.Draft => query.Where(w => w.ApproveLetterUploadedAt == null && w.SignatureRequestedAt == null && w.SignedCopyUploadedAt == null && w.EmployeeAcknowledgedAt == null),
                WarningLetterWorkflowStage.Approved => query.Where(w => w.ApproveLetterUploadedAt != null && w.SignatureRequestedAt == null && w.SignedCopyUploadedAt == null && w.EmployeeAcknowledgedAt == null),
                WarningLetterWorkflowStage.PendingSigned => query.Where(w => w.SignatureRequestedAt != null && w.SignedCopyUploadedAt == null && w.EmployeeAcknowledgedAt == null),
                WarningLetterWorkflowStage.Signed => query.Where(w => w.SignedCopyUploadedAt != null && w.EmployeeAcknowledgedAt == null && w.Status != WarningLetterStatus.Acknowledged),
                WarningLetterWorkflowStage.Acknowledged => query.Where(w => w.EmployeeAcknowledgedAt != null || w.Status == WarningLetterStatus.Acknowledged),
                _ => query
            };
        }

        if (request.StartDate.HasValue)
        {
            query = query.Where(w => w.LetterDate >= request.StartDate.Value);
        }

        if (request.EndDate.HasValue)
        {
            query = query.Where(w => w.LetterDate <= request.EndDate.Value);
        }

        var letters = await query
            .OrderByDescending(w => w.LetterDate)
            .ThenByDescending(w => w.DateCreated)
            .Select(w => new WarningLetterListDto
            {
                Id = w.Id,
                LetterType = w.LetterType,
                EmployeeId = w.EmployeeId,
                EmployeeName = w.Employee.FullName,
                VehicleId = w.VehicleId,
                VehicleHyoungNo = w.Vehicle.HyoungNo,
                NumberPlate = w.Vehicle.NumberPlate,
                SiteId = w.SiteId,
                SiteName = w.Site.Name,
                LetterDate = w.LetterDate,
                PeriodStart = w.PeriodStart,
                Status = w.Status,
                WorkflowStage = w.EmployeeAcknowledgedAt != null || w.Status == WarningLetterStatus.Acknowledged
                    ? WarningLetterWorkflowStage.Acknowledged
                    : w.SignedCopyUploadedAt != null
                        ? WarningLetterWorkflowStage.Signed
                        : w.SignatureRequestedAt != null
                            ? WarningLetterWorkflowStage.PendingSigned
                            : w.ApproveLetterUploadedAt != null
                                ? WarningLetterWorkflowStage.Approved
                                : WarningLetterWorkflowStage.Draft,
                EmailSentAt = w.EmailSentAt,
                EmailRecipient = w.EmailRecipient,
                SignatureRequestRecipient = w.SignatureRequestRecipient,
                SignatureRequestCcRecipients = w.SignatureRequestCcRecipients,
                ApproveLetterUploadedAt = w.ApproveLetterUploadedAt,
                SignatureRequestedAt = w.SignatureRequestedAt,
                SignedCopyUploadedAt = w.SignedCopyUploadedAt,
                EmployeeAcknowledgedAt = w.EmployeeAcknowledgedAt,
                CreatedBy = w.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return FMSResponse<List<WarningLetterListDto>>.Success(letters);
    }
}