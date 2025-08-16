using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// Lightweight metadata for categories backed by WellKnownCategories enum.
    /// </summary>
    public sealed record CategoryMetadata (
        int Id,
        string Name,
        string? Description,
        string DefaultPriority,
        bool DefaultRequireAcknowledgment,
        string DefaultDeliveryMethods,
        int DisplayOrder,
        string? IconClass,
        bool IsActive
    );

    public interface ICategoryMetadataProvider {
        CategoryMetadata Get (Notification.Enums.WellKnownCategories category);
        IReadOnlyList<CategoryMetadata> GetAll ();
        bool IsActive (Notification.Enums.WellKnownCategories category);
    }
}