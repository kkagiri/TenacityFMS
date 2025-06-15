//  using AutoMapper;
//  using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using FMS.Domain.Entities;
// using FMS.Domain.Entities.Features.AutomaticReconciliation;

//  namespace FMS.Application.MappingProfile;

//  //Cursor - AutoMapper profile for automated reconciliation system
//  public class AutomatedReconciliationMappingProfile : Profile {
//      public AutomatedReconciliationMappingProfile () {
//          //Cursor - ReconciliationPolicy mappings
//          CreateMap<ReconciliationPolicy, ReconciliationPolicyDTO> ()
//              .ForMember (dest => dest.SiteName, opt => opt.MapFrom (src => src.Site != null ? src.Site.Name : string.Empty))
//              .ReverseMap ()
//              .ForMember (dest => dest.Site, opt => opt.Ignore ())
//              .ForMember (dest => dest.Executions, opt => opt.Ignore ())
//              .ForMember (dest => dest.DiscrepancyRecords, opt => opt.Ignore ());

//          //Cursor - ReconciliationTankScope mappings
//          CreateMap<ReconciliationTankScope, ReconciliationTankScopeDTO> ()
//              .ReverseMap ();

//          //Cursor - ReconciliationPolicyExecution mappings
//          CreateMap<ReconciliationPolicyExecution, ReconciliationExecutionResultDTO> ()
//              .ForMember (dest => dest.PolicyName, opt => opt.MapFrom (src => src.Policy != null ? src.Policy.Name : string.Empty))
//              .ForMember (dest => dest.Duration, opt => opt.MapFrom (src => src.Duration));

//          //Cursor - DiscrepancyRecord mappings
//          CreateMap<DiscrepancyRecord, DiscrepancyRecordDTO> ()
//              .ForMember (dest => dest.TankName, opt => opt.MapFrom (src => src.Tank != null ? src.Tank.Name : string.Empty))
//              .ForMember (dest => dest.PolicyName, opt => opt.MapFrom (src => src.Policy != null ? src.Policy.Name : string.Empty));
//      }
//  }