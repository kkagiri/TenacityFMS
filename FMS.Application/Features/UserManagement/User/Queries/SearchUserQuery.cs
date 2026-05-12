using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.UserManagement.User.Queries;

/// <summary>
/// Query for searching users by username or email
/// </summary>
public record SearchUserQuery : IRequest<FMSResponse<List<SearchUserDto>>>
{
    [Required]
    public string SearchTerm { get; init; } = string.Empty;

    public int Limit { get; init; } = 10;
}

/// <summary>
/// Lightweight DTO for user search results
/// </summary>
public class SearchUserDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class SearchUserQueryHandler : IRequestHandler<SearchUserQuery, FMSResponse<List<SearchUserDto>>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<SearchUserQueryHandler> _logger;

    public SearchUserQueryHandler(GpsdataContext context, ILogger<SearchUserQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<SearchUserDto>>> Handle(SearchUserQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // Validation checks
            if (string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                return FMSResponse<List<SearchUserDto>>.Failed("Search term is required");
            }

            if (request.SearchTerm.Length < 2)
            {
                return FMSResponse<List<SearchUserDto>>.Failed("Search term must be at least 2 characters long");
            }

            if (request.Limit <= 0 || request.Limit > 100)
            {
                return FMSResponse<List<SearchUserDto>>.Failed("Limit must be between 1 and 100");
            }

            var searchTerm = request.SearchTerm.Trim().ToLower();
            var limit = request.Limit;

            _logger.LogDebug("Searching users with term: {SearchTerm}, limit: {Limit}", searchTerm, limit);

            // Search users by username or email (case-insensitive)
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserName.ToLower().Contains(searchTerm) ||
                           (u.Email != null && u.Email.ToLower().Contains(searchTerm)))
                .Take(limit)
                .Select(u => new SearchUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName ?? "",
                    Email = u.Email ?? ""
                })
                .ToListAsync(cancellationToken);

            _logger.LogDebug("Found {Count} users matching search term", users.Count);

            return FMSResponse<List<SearchUserDto>>.Success(users, $"Found {users.Count} users");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with term: {SearchTerm}", request.SearchTerm);
            return FMSResponse<List<SearchUserDto>>.Failed($"Error searching users: {ex.Message}");
        }
    }
}
