using AutoMapper;

namespace FMS.Application.MappingProfile
{
    /// <summary>
    /// Main mapping profile - All mappings have been moved to separate domain-specific files:
    /// - SiteMappingProfile.cs
    /// - UserMappingProfile.cs
    /// - VehicleMappingProfile.cs
    /// - EmployeeMappingProfile.cs
    /// - TankMappingProfile.cs
    /// - ConsumptionMappingProfile.cs
    /// - TagMappingProfile.cs
    /// - DeliveryMappingProfile.cs
    /// - PTSMappingProfile.cs
    /// - ExpectedAverageMappingProfile.cs
    ///
    /// AutoMapper will automatically discover and register all Profile classes in the assembly.
    /// </summary>
    public class MainMappingProfile : Profile
    {
        public MainMappingProfile()
        {
            // All mappings have been moved to separate domain-specific profile files
            // AutoMapper will automatically discover and register all Profile classes
        }
    }
}