/*
 * File: DepartmentConfiguration.cs
 * Purpose: Entity Framework configuration for Department entity
 * Dependencies: Microsoft.EntityFrameworkCore
 * Last Modified: 2026-02-05
 */
using FMS.Domain.Entities.Features.UserManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// Configuration for the Department entity
/// </summary>
public class DepartmentConfiguration : EntityTypeConfiguration<Department>
{
    /// <summary>
    /// Configures the entity
    /// </summary>
    /// <param name="builder">The entity type builder</param>
    public override void Configure(EntityTypeBuilder<Department> builder)
    {
        try
        {
            builder.HasKey(e => e.DepartmentId).HasName("PRIMARY");

            builder.ToTable("department");

            builder.HasIndex(e => e.Name, "IX_Department_Name");
            builder.HasIndex(e => e.Code, "IX_Department_Code");

            builder.Property(e => e.DepartmentId);

            builder.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.Code)
                .HasMaxLength(20);

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.IsActive)
                .HasDefaultValue(true);

            builder.Property(e => e.CreatedDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.ModifiedDate);

            // Navigation - Users in this department
            builder.HasMany(d => d.Users)
                .WithOne(u => u.Department)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_User_Department");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring DepartmentConfiguration: {ex.Message}");
            throw new Exception($"Error configuring DepartmentConfiguration: {ex.Message}", ex);
        }
    }
}


