/**
 * File: EventEngineMappingProfile.cs
 * Purpose: AutoMapper profile for Event Expression Engine DTO/entity conversions.
 * Dependencies: AutoMapper, EventExpression entity, EventExpressionDto
 * Last Modified: 2026-02-11
 *
 * Key Mappings:
 * - EventExpression → EventExpressionDto (with navigation property name resolution)
 */

using AutoMapper;
using FMS.Application.Features.EventEngine.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile
{
    public class EventEngineMappingProfile : Profile
    {
        public EventEngineMappingProfile()
        {
            CreateMap<EventExpression, EventExpressionDto>()
                .ForMember(dest => dest.SiteName, opt =>
                    opt.MapFrom(src => src.Site != null ? src.Site.Name : null))
                .ForMember(dest => dest.TankName, opt =>
                    opt.MapFrom(src => src.Tank != null ? src.Tank.Name : null))
                .ForMember(dest => dest.PolicyName, opt =>
                    opt.MapFrom(src => src.NotificationPolicy != null ? src.NotificationPolicy.Name : null));
        }
    }
}
