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

namespace FMS.Application.Command.DatabaseCommand.Dashboard {
    public record SaveUserDashboardPreferencesCommand (string UserId, string PreferencesJson, string Version, string Actor) : IRequest<FMSResponseMessage<UserDashboardPreferenceDto>>;

    public class SaveUserDashboardPreferencesCommandHandler : IRequestHandler<SaveUserDashboardPreferencesCommand, FMSResponseMessage<UserDashboardPreferenceDto>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<SaveUserDashboardPreferencesCommandHandler> _logger;

        public SaveUserDashboardPreferencesCommandHandler (GpsdataContext context, IMapper mapper, ILogger<SaveUserDashboardPreferencesCommandHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<UserDashboardPreferenceDto>> Handle (SaveUserDashboardPreferencesCommand request, CancellationToken cancellationToken) {
            try {
                UserDashboardPreference? existing = await _context.UserDashboardPreferencesV2.FirstOrDefaultAsync (p => p.UserId == request.UserId && p.IsActive, cancellationToken);
                if (existing == null) {
                    UserDashboardPreference entity = new UserDashboardPreference {
                    UserId = request.UserId,
                    PreferencesJson = request.PreferencesJson,
                    Version = request.Version,
                    CreatedBy = request.Actor,
                    UpdatedBy = request.Actor
                    };
                    _context.UserDashboardPreferencesV2.Add (entity);
                    await _context.SaveChangesAsync (cancellationToken);
                    UserDashboardPreferenceDto dtoNew = _mapper.Map<UserDashboardPreferenceDto> (entity);
                    return new FMSResponseMessage<UserDashboardPreferenceDto> (true, "Preferences created", dtoNew);
                } else {
                    existing.PreferencesJson = request.PreferencesJson;
                    existing.Version = request.Version;
                    existing.UpdatedAt = DateTime.UtcNow;
                    existing.UpdatedBy = request.Actor;
                    await _context.SaveChangesAsync (cancellationToken);
                    UserDashboardPreferenceDto dto = _mapper.Map<UserDashboardPreferenceDto> (existing);
                    return new FMSResponseMessage<UserDashboardPreferenceDto> (true, "Preferences updated", dto);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error saving dashboard preferences for user {UserId}", request.UserId);
                return new FMSResponseMessage<UserDashboardPreferenceDto> (false, ex.Message, null!);
            }
        }
    }
}