using AutoMapper;
using FMS.Application.Features.FuelComparison.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    /// <summary>
    /// AutoMapper profile for Fuel Data Comparison feature
    /// Maps between domain entities and DTOs
    /// </summary>
    public class FuelComparisonMappingProfile : Profile
    {
        public FuelComparisonMappingProfile()
        {
            // GpsGateReportEntry <-> FuelComparisonSettingsDto
            CreateMap<FuelComparisonSettings, FuelComparisonSettingsDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.UserName : string.Empty));

            CreateMap<FuelComparisonSettingsDto, FuelComparisonSettings>()
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore()); // Set in command handler

            // GpsEntryUpdateDto -> no direct entity mapping (used in command)
            // GpsEntryDeleteDto -> no direct entity mapping (used in command)

            // Note: FuelDataComparisonDto is a composite DTO that aggregates data from multiple sources
            // (FuelRefill, PumpTransaction, GpsGateReportEntry) and is built in query handlers
            // rather than direct mapping from a single entity
        }
    }
}
