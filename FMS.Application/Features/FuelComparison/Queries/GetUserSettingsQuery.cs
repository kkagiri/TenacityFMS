using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FuelComparison.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelComparison.Queries
{
    /// <summary>
    /// Query to get user-specific fuel comparison settings
    /// Returns default settings if user has not configured any
    /// </summary>
    public record GetUserSettingsQuery(string UserId) : IRequest<FMSResponse<FuelComparisonSettingsDto>>;

    public class GetUserSettingsQueryHandler : IRequestHandler<GetUserSettingsQuery, FMSResponse<FuelComparisonSettingsDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetUserSettingsQueryHandler> _logger;

        public GetUserSettingsQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetUserSettingsQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<FuelComparisonSettingsDto>> Handle(
            GetUserSettingsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation($"Getting settings for user {request.UserId}");

                var settings = await _context.FuelComparisonSettings
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.UserId == request.UserId, cancellationToken);

                if (settings == null)
                {
                    // Return default settings if none exist
                    _logger.LogInformation($"No settings found for user {request.UserId}, returning defaults");

                    var user = await _context.Users
                        .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

                    var defaultSettings = new FuelComparisonSettingsDto
                    {
                        Id = 0,
                        UserId = request.UserId,
                        UserName = user?.UserName ?? "Unknown",
                        VarianceThreshold = 10.0m,
                        ShowDeleted = false,
                        DefaultFilter = "all",
                        DefaultGrouping = "vehicle",
                        UpdatedAt = DateTime.UtcNow
                    };

                    return FMSResponse<FuelComparisonSettingsDto>.Success(
                        defaultSettings,
                        "Using default settings. Save to customize.");
                }

                var settingsDto = _mapper.Map<FuelComparisonSettingsDto>(settings);

                _logger.LogInformation($"Retrieved settings for user {request.UserId}");

                return FMSResponse<FuelComparisonSettingsDto>.Success(
                    settingsDto,
                    "Settings retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting settings for user {request.UserId}");
                return FMSResponse<FuelComparisonSettingsDto>.Failed(
                    $"Error getting settings: {ex.Message}");
            }
        }
    }
}
