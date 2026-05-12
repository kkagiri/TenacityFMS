using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class NotificationCategoryConfiguration : IEntityTypeConfiguration<NotificationCategory> {
        public void Configure (EntityTypeBuilder<NotificationCategory> builder) {
            builder.ToTable ("notificationcategories");

            // Primary Key
            builder.HasKey (nc => nc.Id);

            // Id - VARCHAR(50) NOT NULL
            builder.Property (nc => nc.Id)
                .ValueGeneratedOnAdd ().IsRequired ();

            // Name - VARCHAR(100) NOT NULL
            builder.Property (nc => nc.Name)
                .IsRequired ()
                .HasMaxLength (100);

            // Description - VARCHAR(500) NULL
            builder.Property (nc => nc.Description)
                .HasMaxLength (500);

            // DefaultPriority - VARCHAR(20) NOT NULL DEFAULT 'Medium'
            builder.Property (nc => nc.DefaultPriority)
                .IsRequired ()
                .HasMaxLength (20)
                .HasDefaultValue ("Medium");

            // IsActive - TINYINT(1) NOT NULL DEFAULT '1'
            builder.Property (nc => nc.IsActive)
                .IsRequired ()
                .HasDefaultValue (true);

            // DisplayOrder - INT(11) NOT NULL DEFAULT '0'
            builder.Property (nc => nc.DisplayOrder)
                .IsRequired ()
                .HasDefaultValue (0);

            // IconClass - VARCHAR(50) NULL
            builder.Property (nc => nc.IconClass)
                .HasMaxLength (50);

            // DefaultRequireAcknowledgment - TINYINT(1) NOT NULL DEFAULT '0'
            builder.Property (nc => nc.DefaultRequireAcknowledgment)
                .IsRequired ()
                .HasDefaultValue (false);

            // DefaultDeliveryMethods - VARCHAR(100) NOT NULL DEFAULT 'System'
            builder.Property (nc => nc.DefaultDeliveryMethods)
                .IsRequired ()
                .HasMaxLength (100)
                .HasDefaultValue ("System");

            // CreatedAt - DATETIME NOT NULL
            builder.Property (nc => nc.CreatedAt)
                .IsRequired ();

            // UpdatedAt - DATETIME NULL
            builder.Property (nc => nc.UpdatedAt);

            // CreatedBy - VARCHAR(100) NOT NULL
            builder.Property (nc => nc.CreatedBy)
                .IsRequired ()
                .HasMaxLength (100);

            // UpdatedBy - VARCHAR(100) NULL
            builder.Property (nc => nc.UpdatedBy)
                .HasMaxLength (100);

            // Indexes
            builder.HasIndex (nc => nc.IsActive)
                .HasDatabaseName ("idx_notification_categories_active");

            builder.HasIndex (nc => nc.DisplayOrder)
                .HasDatabaseName ("idx_notification_categories_display_order");

            builder.HasIndex (nc => nc.CreatedBy)
                .HasDatabaseName ("FK_notification_categories_createdby");

            builder.HasIndex (nc => nc.UpdatedBy)
                .HasDatabaseName ("FK_notification_categories_updatedby");

            // Foreign Key Relationships
            // Configure the relationship with UserNotificationPreference to match existing DB schema
            builder.HasMany (nc => nc.UserPreferences)
                .WithOne (unp => unp.NotificationCategory)
                .HasForeignKey (unp => unp.NotificationCategoryId)
                .OnDelete (DeleteBehavior.Cascade)
                .HasConstraintName ("FK_UserNotificationPreference_Category");

            // Configure User relationships to match existing DB schema
            builder.HasOne<User> ()
                .WithMany ()
                .HasForeignKey (nc => nc.CreatedBy)
                .HasConstraintName ("FK_notification_categories_createdby")
                .OnDelete (DeleteBehavior.NoAction);

            builder.HasOne<User> ()
                .WithMany ()
                .HasForeignKey (nc => nc.UpdatedBy)
                .HasConstraintName ("FK_notification_categories_updatedby")
                .OnDelete (DeleteBehavior.NoAction);

        }
    }
}