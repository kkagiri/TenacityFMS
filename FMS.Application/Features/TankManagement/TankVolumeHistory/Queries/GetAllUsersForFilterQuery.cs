using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Queries {
    public record GetAllUsersForFilterQuery : IRequest<FMSResponse<List<UserFilterDTO>>>;

    public class GetAllUsersForFilterQueryHandler : IRequestHandler<GetAllUsersForFilterQuery, FMSResponse<List<UserFilterDTO>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetAllUsersForFilterQueryHandler> _logger;

        public GetAllUsersForFilterQueryHandler (
            GpsdataContext context,
            ILogger<GetAllUsersForFilterQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<UserFilterDTO>>> Handle (GetAllUsersForFilterQuery request, CancellationToken cancellationToken) {
            try {
                var users = await _context.Users
                    .Where (u => !u.IsDeleted.HasValue || !u.IsDeleted.Value)
                    .Select (u => new UserFilterDTO {
                        Id = u.Id,
                            UserName = u.UserName ?? "Unknown"
                    })
                    .OrderBy (u => u.UserName)
                    .ToListAsync (cancellationToken);

                _logger.LogInformation ("Retrieved {Count} users for filter dropdown", users.Count);

                return FMSResponse<List<UserFilterDTO>>.Success (users);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting users for filter");
                return FMSResponse<List<UserFilterDTO>>.Failed ("Failed to retrieve users");
            }
        }
    }

    public class UserFilterDTO {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
    }
}