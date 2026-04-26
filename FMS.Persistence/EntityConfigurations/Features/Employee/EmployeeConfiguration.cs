/**
 * File: EmployeeConfiguration.cs
 * Purpose: Maps Employee entity fields and relationships to database schema.
 * Dependencies: EF Core, Employee/Site/User domain entities
 * Last Modified: 2026-02-26
 *
 * Key Functions/Components:
 * - Configure(): Defines table/column mapping and disables implicit Employee-Vehicle skip-nav mapping.
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Employee entity
    /// </summary>
    public class EmployeeConfiguration : EntityTypeConfiguration<Employee>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Employee> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("employee");

                builder.HasIndex(e => e.ModifiedBy, "Employe_modifyUser_idx");
                builder.HasIndex(e => e.SiteId, "Employee_site_idx");
                builder.HasIndex(e => e.CreatedBy, "Employee_user_idx");

                builder.Property(e => e.Id);

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100);

                builder.Property(e => e.EmployeeWorkNo)
                    .HasMaxLength(45);

                builder.Property(e => e.EmployeephoneNumber)
                    .HasMaxLength(45)
                    .HasDefaultValueSql("'0700000000'");

                builder.Property(e => e.Employeestatus)
                    .HasMaxLength(45);

                builder.Property(e => e.FullName)
                    .HasMaxLength(45)
                    .HasDefaultValueSql("'Employee Name'");

                builder.Property(e => e.Position)
                    .HasMaxLength(100);

                builder.Property(e => e.Email)
                    .HasMaxLength(255);

                builder.Property(e => e.IsModified)
                    .HasDefaultValueSql("'0'");

                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100);

                builder.Property(e => e.SiteId);

                // Keep only the Site relationship
                builder.HasOne(e => e.Site)
                  .WithMany(s => s.Employees)  // Specify the inverse navigation property
                   .HasForeignKey(e => e.SiteId)
                   .OnDelete(DeleteBehavior.Restrict);

                // Configure the CreatedByNavigation relationship
                builder.HasOne(e => e.CreatedByNavigation)
                    .WithMany(u => u.EmployeeCreatedByNavigations)
                    .HasForeignKey(e => e.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict);

                // Configure the ModifiedByNavigation relationship
                builder.HasOne(e => e.ModifiedByNavigation)
                    .WithMany(u => u.EmployeeModifiedByNavigations)
                    .HasForeignKey(e => e.ModifiedBy)
                    .OnDelete(DeleteBehavior.Restrict);

                builder.HasMany(e => e.EmployeeDocuments)
                    .WithOne(document => document.Employee)
                    .HasForeignKey(document => document.EmployeeId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Prevent implicit many-to-many join table creation (EmployeesId/VehiclesVehicleId).
                // Employee-vehicle links are managed explicitly by EmployeeVehicleConfiguration.
                builder.Ignore(e => e.Vehicles);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring EmployeeConfiguration: {ex.Message}", ex);
            }
        }
    }
}


