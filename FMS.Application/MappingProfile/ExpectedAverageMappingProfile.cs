using AutoMapper;
using FMS.Application.Features.FMS.ExpectedAVG;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile {
    public class ExpectedAverageMappingProfile : Profile {
        public ExpectedAverageMappingProfile () {
            CreateMap<Expectedaverage, ExpectedAVGDto> ()
                .ForMember (dest => dest.Id, opt => opt.MapFrom (src => src.Id))
                .ForMember (dest => dest.VehicleId, opt => opt.MapFrom (src => src.VehicleId))
                .ForMember (dest => dest.ExpectedAverageValue, opt => opt.MapFrom (src => src.ExpectedAverageValue))
                .ForMember (dest => dest.ExpectedAverageClassificationId, opt => opt.MapFrom (src => src.ExpectedAverageClassificationId))
                .ForMember (dest => dest.ExpectedAverageclassificationName, opt => opt.MapFrom (src => src.ExpectedAverageClassification.Name))
                .ReverseMap ();

            CreateMap<Expectedaverageclassification, FMS.Application.Features.FMS.ExpectedAVGClassficationDTO> ().ReverseMap ();
        }
    }
}