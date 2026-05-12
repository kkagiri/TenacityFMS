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
            .ValueGeneratedOnAdd();

        builder.Property(e => e.SerialNo);

        builder.Property(e => e.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.CheckType)
            .HasMaxLength(100);

        builder.Property(e => e.VehicleTypeId);

        builder.Property(e => e.VehicleModelId);

        builder.Property(e => e.HasGps);

        builder.Property(e => e.SortOrder)
            .HasDefaultValue(0);

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(255);

        builder.Property(e => e.ModifiedBy)
            .HasMaxLength(255);

        builder.Property(e => e.DateCreated);

        builder.Property(e => e.DateModified);

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
