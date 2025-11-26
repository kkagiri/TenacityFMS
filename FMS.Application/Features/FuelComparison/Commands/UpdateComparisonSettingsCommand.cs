using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FuelComparison.DTOs;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Persistence.DataAccess;

namespace FMS.Application.Features.FuelComparison.Commands
{
    /// <summary>
    /// Command to update user-specific fuel comparison settings
    /// Creates new settings if none exist for the user
    /// </summary>
    public record UpdateComparisonSettingsCommand(FuelComparisonSettingsDto SettingsDto) : IRequest<FMSResponse<FuelComparisonSettingsDto>>;

    public class UpdateComparisonSettingsCommandHandler : IRequestHandler<UpdateComparisonSettingsCommand, FMSResponse<FuelComparisonSettingsDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        public UpdateComparisonSettingsCommandHandler(GpsdataContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<FMSResponse<FuelComparisonSettingsDto>> Handle(UpdateComparisonSettingsCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.SettingsDto;

                // Validate input
                if (dto.VarianceThreshold < 0)
                {
                    return FMSResponse<FuelComparisonSettingsDto>.ValidationFailed(
                        new List<string> { "Variance threshold must be 0 or greater" });
                }

                if (dto.VarianceThreshold > 999.99m)
                {
                    return FMSResponse<FuelComparisonSettingsDto>.ValidationFailed(
                        new List<string> { "Variance threshold cannot exceed 999.99 liters" });
                }

                var validFilters = new[] { "all", "site", "tank" };
                if (!Array.Exists(validFilters, f => f.Equals(dto.DefaultFilter, StringComparison.OrdinalIgnoreCase)))
                {
                    return FMSResponse<FuelComparisonSettingsDto>.ValidationFailed(
                        new List<string> { "Default filter must be 'all', 'site', or 'tank'" });
                }

                var validGroupings = new[] { "vehicle", "site", "tank", "none" };
                if (!Array.Exists(validGroupings, g => g.Equals(dto.DefaultGrouping, StringComparison.OrdinalIgnoreCase)))
                {
                    return FMSResponse<FuelComparisonSettingsDto>.ValidationFailed(
                        new List<string> { "Default grouping must be 'vehicle', 'site', 'tank', or 'none'" });
                }

                // Find existing settings or create new
                var settings = await _context.FuelComparisonSettings
                    .FirstOrDefaultAsync(s => s.UserId == dto.UserId, cancellationToken);

                if (settings == null)
                {
                    // Create new settings
                    settings = new FuelComparisonSettings
                    {
                        UserId = dto.UserId,
                        VarianceThreshold = dto.VarianceThreshold,
                        ShowDeleted = dto.ShowDeleted,
                        DefaultFilter = dto.DefaultFilter.ToLower(),
                        DefaultGrouping = dto.DefaultGrouping.ToLower(),
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.FuelComparisonSettings.Add(settings);
                }
                else
                {
                    // Update existing settings
                    settings.VarianceThreshold = dto.VarianceThreshold;
                    settings.ShowDeleted = dto.ShowDeleted;
                    settings.DefaultFilter = dto.DefaultFilter.ToLower();
                    settings.DefaultGrouping = dto.DefaultGrouping.ToLower();
                    settings.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Reload with user info for DTO mapping
                await _context.Entry(settings).Reference(s => s.User).LoadAsync(cancellationToken);

                var resultDto = _mapper.Map<FuelComparisonSettingsDto>(settings);

                return FMSResponse<FuelComparisonSettingsDto>.Success(
                    resultDto,
                    "Settings updated successfully");
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("Duplicate entry") == true)
            {
                return FMSResponse<FuelComparisonSettingsDto>.Conflict(
                    "DUPLICATE_SETTINGS",
                    "Settings already exist for this user. Please try again.");
            }
            catch (Exception ex)
            {
                return FMSResponse<FuelComparisonSettingsDto>.SystemError(
                    $"Error updating settings: {ex.Message}");
            }
        }
    }
}
