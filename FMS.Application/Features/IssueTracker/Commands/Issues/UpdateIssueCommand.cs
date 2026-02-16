/*
 * File: UpdateIssueCommand.cs
 * Purpose: Updates issue records and synchronizes multi-tag mappings for issue categories.
 * Dependencies: MediatR, GpsdataContext, EF Core
 * Last Modified: 2026-02-14
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues;

public record UpdateIssueCommand(IssueTrackerDTO IssueTracker) : IRequest<Unit>;

public class UpdateIssueCommandHandler : IRequestHandler<UpdateIssueCommand, Unit>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateIssueCommandHandler> _logger;

    public UpdateIssueCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateIssueCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateIssueCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var normalizedCategoryTags = NormalizeCategoryTags(request.IssueTracker.IssueCategoryTags, request.IssueTracker.IssueCategory);

            var entity = await _context.Issuetrackers.FindAsync(request.IssueTracker.Id);
            if (entity == null)
            {
                _logger.LogWarning("Issue with ID: {Id} not found", request.IssueTracker.Id);
                return Unit.Value;
            }

            // Resolve usernames to user IDs before mapping
            string? openbyUserId = null;
            var assignToUsers = new List<User>();

            // Find user by username for Openby field
            if (!string.IsNullOrEmpty(request.IssueTracker.Openby))
            {
                var openbyUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserName == request.IssueTracker.Openby, cancellationToken);
                if (openbyUser != null)
                {
                    openbyUserId = openbyUser.Id;
                }
                else
                {
                    throw new Exception($"User '{request.IssueTracker.Openby}' not found");
                }
            }

            // Find users by username(s) for AssignTo field
            var requestedAssignees = ParseAssignees(request.IssueTracker.AssignTo);
            if (requestedAssignees.Count > 0)
            {
                assignToUsers = await _context.Users
                    .Where(u => requestedAssignees.Contains(u.UserName))
                    .ToListAsync(cancellationToken);

                var foundUserNames = assignToUsers
                    .Select(u => u.UserName)
                    .Where(userName => !string.IsNullOrWhiteSpace(userName))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var missingAssignees = requestedAssignees
                    .Where(assignee => !foundUserNames.Contains(assignee))
                    .ToList();

                if (missingAssignees.Count > 0)
                {
                    throw new Exception($"Assignee(s) not found: {string.Join(", ", missingAssignees)}");
                }
            }

            var primaryAssigneeId = assignToUsers.Count > 0
                ? assignToUsers[0].Id
                : null;

            // Manually map DTO to Entity with resolved user IDs
            if (normalizedCategoryTags.Count > 0)
            {
                entity.IssueCategoryId = normalizedCategoryTags[0];
            }
            else if (request.IssueTracker.IssueCategory > 0)
            {
                entity.IssueCategoryId = request.IssueTracker.IssueCategory;
            }
            entity.IssueTemplateId = request.IssueTracker.IssueTemplateId;
            entity.DeviceTypeId = request.IssueTracker.DeviceTypeId ?? request.IssueTracker.DeviceType;
            entity.SiteId = request.IssueTracker.Site;
            entity.Openby = openbyUserId ?? entity.Openby;
            entity.RelatedIssue = request.IssueTracker.RelatedIssue;
            entity.ProblemDescription = request.IssueTracker.ProblemDescription;
            entity.ProblemTitle = request.IssueTracker.ProblemTitle;
            entity.Status = request.IssueTracker.Status;
            entity.Priority = request.IssueTracker.Priority;
            entity.DueDate = request.IssueTracker.DueDate;
            entity.ClosingDate = request.IssueTracker.ClosingDate;
            entity.LastModfield = DateTime.UtcNow;
            entity.VehicleId = request.IssueTracker.Vehicle;
            //entity.DeviceId = request.IssueTracker.Device;
            entity.DeviceType = request.IssueTracker.DeviceType;
            entity.CanAutoClose = request.IssueTracker.CanAutoClose ?? entity.CanAutoClose;
            entity.IsAutoCreated = request.IssueTracker.IsAutoCreated ?? entity.IsAutoCreated;
            entity.AssignTo = primaryAssigneeId ?? entity.AssignTo;

            await _context.SaveChangesAsync(cancellationToken);
            if (request.IssueTracker.IssueCategoryTags != null)
            {
                await ReplaceIssueTagsAsync(entity.Id, normalizedCategoryTags, cancellationToken);
            }

            if (assignToUsers.Count > 0)
            {
                await PersistIssueAssigneesAsync(
                    entity.Id,
                    openbyUserId ?? entity.Openby,
                    assignToUsers,
                    cancellationToken);
            }

            _logger.LogInformation("Issue with ID: {Id} updated", entity.Id);

            return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError("An error occured while updating issue with ID: {Id}", request.IssueTracker.Id);
            throw new Exception(ex.Message);
        }
    }

    private async Task PersistIssueAssigneesAsync(
        int issueId,
        string assignedFromUserId,
        List<User> assignees,
        CancellationToken cancellationToken)
    {
        var existingRows = await _context.Issueassignmenttrackers
            .Where(row => row.Issue == issueId)
            .ToListAsync(cancellationToken);

        if (existingRows.Count > 0)
        {
            _context.Issueassignmenttrackers.RemoveRange(existingRows);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var startId = await _context.Issueassignmenttrackers
            .Select(row => (int?)row.Id)
            .MaxAsync(cancellationToken) ?? 0;

        var nextId = startId;
        var rows = assignees
            .Where(user => !string.IsNullOrWhiteSpace(user.Id))
            .Select(user => new Issueassignmenttracker
            {
                Id = ++nextId,
                Issue = issueId,
                AssignedFrom = assignedFromUserId,
                AssignedTo = user.Id,
                AssignedDate = DateTime.UtcNow
            })
            .ToList();

        if (rows.Count == 0)
        {
            return;
        }

        await _context.Issueassignmenttrackers.AddRangeAsync(rows, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static List<string> ParseAssignees(string? assignToValue)
    {
        if (string.IsNullOrWhiteSpace(assignToValue))
        {
            return new List<string>();
        }

        return assignToValue
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(userName => userName.Trim())
            .Where(userName => !string.IsNullOrWhiteSpace(userName))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static List<int> NormalizeCategoryTags(List<int>? issueCategoryTags, int fallbackCategoryId)
    {
        var tags = (issueCategoryTags ?? new List<int>())
            .Where(tagId => tagId > 0)
            .Distinct()
            .ToList();

        if (tags.Count == 0 && fallbackCategoryId > 0)
        {
            tags.Add(fallbackCategoryId);
        }

        return tags;
    }

    private async Task ReplaceIssueTagsAsync(int issueId, List<int> categoryTags, CancellationToken cancellationToken)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM issuetracker_tags WHERE IssueID = {0}",
            new object[] { issueId },
            cancellationToken);

        if (categoryTags.Count == 0)
        {
            return;
        }

        foreach (var tagId in categoryTags)
        {
            await _context.Database.ExecuteSqlRawAsync(
                "INSERT IGNORE INTO issuetracker_tags (IssueID, IssueCategoryID) VALUES ({0}, {1})",
                new object[] { issueId, tagId },
                cancellationToken);
        }
    }
}
