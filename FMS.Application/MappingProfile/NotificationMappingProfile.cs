using System;
using System.Linq;
using AutoMapper;
using FMS.Application.Features.Notification.Commands;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.Notifications;

namespace FMS.Application.MappingProfile {
    public class NotificationMappingProfile : Profile {
        public NotificationMappingProfile () {
            // Notification entity mappings
            CreateMap<Notification, NotificationDto> ()
                .ForMember (dest => dest.Data, opt => opt.MapFrom (src => src.Data))
                .ReverseMap ();

            // Notification category mappings
            CreateMap<NotificationCategory, NotificationCategoryDto> ()
                .ForMember (dest => dest.DefaultDeliveryMethods,
                    opt => opt.MapFrom (src => src.DefaultDeliveryMethods.Split (',', StringSplitOptions.RemoveEmptyEntries).ToList ()))
                .ReverseMap ()
                .ForMember (dest => dest.DefaultDeliveryMethods,
                    opt => opt.MapFrom (src => string.Join (",", src.DefaultDeliveryMethods)));

            // User notification preference mappings
            CreateMap<UserNotificationPreference, UserNotificationPreferenceDto> ()
                .ForMember (dest => dest.DeliveryMethods,
                    opt => opt.MapFrom (src => src.DeliveryMethods.Split (',', StringSplitOptions.RemoveEmptyEntries).ToList ()))
                .ForMember (dest => dest.QuietHoursStart,
                    opt => opt.MapFrom (src => src.QuietHoursStart.HasValue ? src.QuietHoursStart.Value.ToString (@"hh\:mm") : null))
                .ForMember (dest => dest.QuietHoursEnd,
                    opt => opt.MapFrom (src => src.QuietHoursEnd.HasValue ? src.QuietHoursEnd.Value.ToString (@"hh\:mm") : null))
                .ReverseMap ()
                .ForMember (dest => dest.DeliveryMethods,
                    opt => opt.MapFrom (src => string.Join (",", src.DeliveryMethods)))
                .ForMember (dest => dest.QuietHoursStart,
                    opt => opt.MapFrom (src => !string.IsNullOrEmpty (src.QuietHoursStart) ? TimeSpan.Parse (src.QuietHoursStart) : (TimeSpan?) null))
                .ForMember (dest => dest.QuietHoursEnd,
                    opt => opt.MapFrom (src => !string.IsNullOrEmpty (src.QuietHoursEnd) ? TimeSpan.Parse (src.QuietHoursEnd) : (TimeSpan?) null));

            // Request to entity mappings
            CreateMap<CreateUserNotificationPreferenceRequest, UserNotificationPreference> ()
                .ForMember (dest => dest.DeliveryMethods,
                    opt => opt.MapFrom (src => string.Join (",", src.DeliveryMethods)))
                .ForMember (dest => dest.QuietHoursStart,
                    opt => opt.MapFrom (src => !string.IsNullOrEmpty (src.QuietHoursStart) ? TimeSpan.Parse (src.QuietHoursStart) : (TimeSpan?) null))
                .ForMember (dest => dest.QuietHoursEnd,
                    opt => opt.MapFrom (src => !string.IsNullOrEmpty (src.QuietHoursEnd) ? TimeSpan.Parse (src.QuietHoursEnd) : (TimeSpan?) null))
                .ForMember (dest => dest.CreatedAt, opt => opt.MapFrom (src => DateTime.UtcNow))
                .ForMember (dest => dest.Id, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedBy, opt => opt.Ignore ());

            CreateMap<UpdateUserNotificationPreferenceRequest, UserNotificationPreference> ()
                .ForMember (dest => dest.DeliveryMethods,
                    opt => opt.MapFrom (src => src.DeliveryMethods != null ? string.Join (",", src.DeliveryMethods) : null))
                .ForMember (dest => dest.QuietHoursStart,
                    opt => opt.MapFrom (src => !string.IsNullOrEmpty (src.QuietHoursStart) ? TimeSpan.Parse (src.QuietHoursStart) : (TimeSpan?) null))
                .ForMember (dest => dest.QuietHoursEnd,
                    opt => opt.MapFrom (src => !string.IsNullOrEmpty (src.QuietHoursEnd) ? TimeSpan.Parse (src.QuietHoursEnd) : (TimeSpan?) null))
                .ForMember (dest => dest.UpdatedAt, opt => opt.MapFrom (src => DateTime.UtcNow))
                .ForMember (dest => dest.CreatedAt, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.UserId, opt => opt.Ignore ())
                .ForMember (dest => dest.NotificationCategory, opt => opt.Ignore ());

            // Controller DTO to Application DTO mappings
            CreateMap<BulkUpdatePreferenceDto, UserNotificationPreferenceDto> ()
                .ForMember (dest => dest.NotificationCategoryId, opt => opt.MapFrom (src => src.NotificationCategoryId))
                .ForMember (dest => dest.CreatedAt, opt => opt.MapFrom (src => DateTime.UtcNow))
                .ForMember (dest => dest.UpdatedAt, opt => opt.MapFrom (src => DateTime.UtcNow))
                .ForMember (dest => dest.UserId, opt => opt.Ignore ())
                .ForMember (dest => dest.CreatedBy, opt => opt.Ignore ())
                .ForMember (dest => dest.UpdatedBy, opt => opt.Ignore ());

            // Alarm trigger mappings
            CreateMap<TriggerAlarmRequest, CreateAlarmNotificationRequest> ()
                .ForMember (dest => dest.Category, opt => opt.MapFrom (src => src.Category ?? "Custom"))
                .ForMember (dest => dest.TriggeredBy, opt => opt.Ignore ());

            // Notification policy listing
            CreateMap<NotificationPolicy, NotificationPolicyDto> ()
                .ForMember (d => d.CategoryName, opt => opt.MapFrom (s => s.NotificationCategory != null ? s.NotificationCategory.Name : null))
                .ForMember (d => d.RecipientCount, opt => opt.MapFrom (s => s.PolicyRecipients.Count (r => r.IsActive)))
                .ForMember (d => d.GroupCount, opt => opt.MapFrom (s => s.PolicyGroups.Count ()))
                .ForMember (d => d.NotificationCount, opt => opt.MapFrom (s => s.NotificationCount))
                .ForMember (d => d.LastTriggered, opt => opt.MapFrom (s => s.LastNotificationAt))
                .ForMember (d => d.CreatedBy, opt => opt.MapFrom (s => s.CreatedByNavigation != null ? s.CreatedByNavigation.UserName : s.CreatedBy))
                .ForMember (d => d.ModifiedBy, opt => opt.MapFrom (s => s.ModifiedByNavigation != null ? s.ModifiedByNavigation.UserName : s.ModifiedBy));
        }
    }
}