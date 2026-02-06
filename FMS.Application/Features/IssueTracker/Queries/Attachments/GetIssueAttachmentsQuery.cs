/**
 * File: GetIssueAttachmentsQuery.cs
 * Purpose: Query definition for retrieving all attachments for a given issue
 * Dependencies: MediatR, FMS.Application.Common
 * Last Modified: 2026-02-06
 */
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Queries.Attachments
{
    public record GetIssueAttachmentsQuery(int IssueId) : IRequest<FMSResponse<List<IssueAttachmentDTO>>>;
}
