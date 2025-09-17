using AutoMapper;
using FMS.Application.Features.FMS.AutomatedReconciliation;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.AutomaticReconciliation;

namespace FMS.Application.MappingProfile;

//Cursor - AutoMapper profile for automated reconciliation system
public class AutomatedReconciliationMappingProfile : Profile {
    public AutomatedReconciliationMappingProfile () {
        //Cursor - ReconciliationPolicy mappings
        CreateMap<ReconciliationPolicy, ReconciliationPolicyDTO> ()
            .ForMember (dest => dest.SiteName, opt => opt.MapFrom (src => src.Site != null ? src.Site.Name : string.Empty))
            .ReverseMap ()
            .ForMember (dest => dest.Site, opt => opt.Ignore ());

        //Cursor - ReconciliationTankScope mappings - now enabled with DTO
        CreateMap<ReconciliationTankScope, ReconciliationTankScopeDTO> ()
            .ReverseMap ();

        //Cursor - ReconciliationPolicyExecution mappings - remove Duration property that doesn't exist
        CreateMap<ReconciliationPolicyExecution, ReconciliationPolicyExecutionDTO> ()
            .ForMember (dest => dest.PolicyName, opt => opt.MapFrom (src => src.Policy != null ? src.Policy.Name : string.Empty))
            .ReverseMap ()
            .ForMember (dest => dest.Policy, opt => opt.Ignore ())
            .ForMember (dest => dest.Discrepancies, opt => opt.Ignore ());

        //Cursor - DiscrepancyRecord mappings - now enabled with DTO
        CreateMap<DiscrepancyRecord, DiscrepancyRecordDTO> ()
            .ForMember (dest => dest.TankName, opt => opt.MapFrom (src => src.Tank != null ? src.Tank.Name : string.Empty))
            .ForMember (dest => dest.PolicyName, opt => opt.MapFrom (src => src.Policy != null ? src.Policy.Name : string.Empty))
            .ReverseMap ()
            .ForMember (dest => dest.Tank, opt => opt.Ignore ())
            .ForMember (dest => dest.Policy, opt => opt.Ignore ())
            .ForMember (dest => dest.Execution, opt => opt.Ignore ());

        //Cursor - ReconciliationDiscrepancy mappings (existing entity)
        CreateMap<ReconciliationDiscrepancy, ReconciliationDiscrepancyDTO> ()
            .ReverseMap ()
            .ForMember (dest => dest.PolicyExecution, opt => opt.Ignore ())
            .ForMember (dest => dest.Tank, opt => opt.Ignore ());
    }
}