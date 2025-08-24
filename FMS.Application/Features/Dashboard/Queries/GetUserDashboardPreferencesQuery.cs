using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.Dashboard {
    public record GetUserDashboardPreferencesQuery (string UserId) : IRequest<FMSResponseMessage<UserDashboardPreferenceDto>>;

    public class GetUserDashboardPreferencesQueryHandler : IRequestHandler<GetUserDashboardPreferencesQuery, FMSResponseMessage<UserDashboardPreferenceDto>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetUserDashboardPreferencesQueryHandler> _logger;

        public GetUserDashboardPreferencesQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetUserDashboardPreferencesQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<UserDashboardPreferenceDto>> Handle (GetUserDashboardPreferencesQuery request, CancellationToken cancellationToken) {
            try {
                UserDashboardPreference? entity = await _context.UserDashboardPreferencesV2
                    .AsNoTracking ()
                    .FirstOrDefaultAsync (p => p.UserId == request.UserId && p.IsActive, cancellationToken);

                if (entity == null) {
                    return new FMSResponseMessage<UserDashboardPreferenceDto> (false, "No preferences found", null!);
                }

                UserDashboardPreferenceDto dto = _mapper.Map<UserDashboardPreferenceDto> (entity);
                return new FMSResponseMessage<UserDashboardPreferenceDto> (true, "Preferences retrieved", dto);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving dashboard preferences for user {UserId}", request.UserId);
                return new FMSResponseMessage<UserDashboardPreferenceDto> (false, ex.Message, null!);
            }
        }
    }
}