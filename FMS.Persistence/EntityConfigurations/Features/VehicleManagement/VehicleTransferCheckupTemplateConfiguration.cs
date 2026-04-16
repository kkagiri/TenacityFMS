/**
 * File: VehicleTransferCheckupTemplateConfiguration.cs
 * Purpose: Entity Framework mapping for VehicleTransferCheckupTemplate persistence model.
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Persistence.Models
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - VehicleTransferCheckupTemplateConfiguration: Maps table/columns/indexes and optional FK criteria.
 */
using FMS.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// EF Core configuration for vehicle transfer checkup template items.
/// </summary>
public class VehicleTransferCheckupTemplateConfiguration : IEntityTypeConfiguration<VehicleTransferCheckupTemplate>
{
    public void Configure(EntityTypeBuilder<VehicleTransferCheckupTemplate> builder)
    {
        builder.ToTable("vehicle_transfer_checkup_templates");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(e => e.SerialNo)
            .HasColumnName("serial_no");

        builder.Property(e => e.Description)
            .HasColumnName("description")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.CheckType)
            .HasColumnName("check_type")
            .HasMaxLength(100);

        builder.Property(e => e.VehicleTypeId)
            .HasColumnName("vehicle_type_id");

        builder.Property(e => e.VehicleModelId)
            .HasColumnName("vehicle_model_id");

        builder.Property(e => e.HasGps)
            .HasColumnName("has_gps");

        builder.Property(e => e.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(e => e.CreatedBy)
            .HasColumnName("created_by")
            .HasMaxLength(255);

        builder.Property(e => e.ModifiedBy)
            .HasColumnName("modified_by")
            .HasMaxLength(255);

        builder.Property(e => e.DateCreated)
            .HasColumnName("date_created");

        builder.Property(e => e.DateModified)
            .HasColumnName("date_modified");

        builder.HasOne(e => e.VehicleType)
            .WithMany()
            .HasForeignKey(e => e.VehicleTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.VehicleModel)
            .WithMany()
            .HasForeignKey(e => e.VehicleModelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.IsActive)
            .HasDatabaseName("idx_vt_checkup_template_is_active");

        builder.HasIndex(e => e.SortOrder)
            .HasDatabaseName("idx_vt_checkup_template_sort_order");

        builder.HasIndex(e => new { e.VehicleTypeId, e.VehicleModelId, e.HasGps })
            .HasDatabaseName("idx_vt_checkup_template_criteria");
    }
}
