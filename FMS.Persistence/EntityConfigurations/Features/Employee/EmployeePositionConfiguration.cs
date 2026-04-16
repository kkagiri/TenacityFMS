/**
 * File: EmployeePositionConfiguration.cs
 * Purpose: Maps employee position lookup values to the employee_position table.
 * Dependencies: EF Core, EmployeePosition domain entity
 * Last Modified: 2026-04-07
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class EmployeePositionConfiguration : EntityTypeConfiguration<EmployeePosition>
{
    public override void Configure(EntityTypeBuilder<EmployeePosition> builder)
    {
        builder.HasKey(e => e.Id).HasName("PRIMARY");

        builder.ToTable("employee_position");

        builder.HasIndex(e => e.Name, "ux_employee_position_name").IsUnique();
        builder.HasIndex(e => e.IsActive, "ix_employee_position_is_active");
        builder.HasIndex(e => e.SortOrder, "ix_employee_position_sort_order");

        builder.Property(e => e.Id)
            .HasColumnType("int(11)")
            .HasColumnName("id");

        builder.Property(e => e.Name)
            .HasMaxLength(100)
            .HasColumnName("name");

        builder.Property(e => e.Description)
            .HasMaxLength(255)
            .HasColumnName("description");

        builder.Property(e => e.SortOrder)
            .HasColumnType("int(11)")
            .HasDefaultValue(0)
            .HasColumnName("sort_order");

        builder.Property(e => e.IsActive)
            .HasColumnType("tinyint(1)")
            .HasDefaultValue(true)
            .HasColumnName("is_active");

        builder.Property(e => e.DateCreated)
            .HasColumnType("datetime")
            .HasColumnName("date_created");

        builder.Property(e => e.DateModified)
            .HasColumnType("datetime")
            .HasColumnName("date_modified");
    }
}