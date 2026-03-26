/**
 * File: VehicleDocumentUserPreferenceConfiguration.cs
 * Purpose: Configures EF Core mapping for per-user vehicle document reminder defaults.
 * Dependencies: VehicleDocumentUserPreference entity and Entity Framework Core.
 * Last Modified: 2026-03-25
 */
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleDocumentUserPreferenceConfiguration : IEntityTypeConfiguration<VehicleDocumentUserPreference>
{
    public void Configure(EntityTypeBuilder<VehicleDocumentUserPreference> builder)
    {
        builder.ToTable("vehicle_document_user_preferences");

        builder.HasKey(preference => preference.Id);

        builder.Property(preference => preference.Id)
            .HasColumnName("Id")
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(preference => preference.UserId)
            .HasColumnName("UserId")
            .HasColumnType("VARCHAR(100)")
            .IsRequired();

        builder.Property(preference => preference.ComplianceCategory)
            .HasColumnName("ComplianceCategory")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(preference => preference.ReminderLeadDays)
            .HasColumnName("ReminderLeadDays")
            .HasColumnType("INT")
            .HasDefaultValue(30)
            .IsRequired();

        builder.Property(preference => preference.CreatedAt)
            .HasColumnName("CreatedAt")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(preference => preference.CreatedBy)
            .HasColumnName("CreatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired();

        builder.Property(preference => preference.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .HasColumnType("DATETIME")
            .IsRequired(false);

        builder.Property(preference => preference.UpdatedBy)
            .HasColumnName("UpdatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired(false);

        builder.HasIndex(preference => preference.UserId)
            .HasDatabaseName("IX_vehicle_document_user_preferences_UserId");

        builder.HasIndex(preference => new { preference.UserId, preference.ComplianceCategory })
            .IsUnique()
            .HasDatabaseName("UK_vehicle_document_user_preferences_UserId_ComplianceCategory");

        builder.HasOne(preference => preference.User)
            .WithMany()
            .HasForeignKey(preference => preference.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_vehicle_document_user_preferences_User");

        builder.HasOne(preference => preference.CreatedByNavigation)
            .WithMany()
            .HasForeignKey(preference => preference.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_vehicle_document_user_preferences_CreatedBy");

        builder.HasOne(preference => preference.UpdatedByNavigation)
            .WithMany()
            .HasForeignKey(preference => preference.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull)
            .HasConstraintName("FK_vehicle_document_user_preferences_UpdatedBy");
    }
}