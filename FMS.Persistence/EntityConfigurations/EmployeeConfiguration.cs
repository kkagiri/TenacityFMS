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

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");

                builder.Property(e => e.EmployeeWorkNo)
                    .HasMaxLength(45)
                    .HasDefaultValueSql("'New'");

                builder.Property(e => e.EmployeephoneNumber)
                    .HasMaxLength(45)
                    .HasDefaultValueSql("'0700000000'")
                    .HasColumnName("employeephoneNumber");

                builder.Property(e => e.Employeestatus)
                    .HasMaxLength(45)
                    .HasColumnName("employeestatus");

                builder.Property(e => e.FullName)
                    .HasMaxLength(45)
                    .HasDefaultValueSql("'Employee Name'");

                builder.Property(e => e.IsModified)
                    .HasDefaultValueSql("'0'")
                    .HasColumnType("tinyint(4)");

                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteID");

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

                // Many-to-many relationship is configured in EmployeeVehicleConfiguration
                // No need to duplicate it here
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring EmployeeConfiguration: {ex.Message}", ex);
            }
        }
    }
}
