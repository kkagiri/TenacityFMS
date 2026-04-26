using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;
using System;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Supplier entity
    /// </summary>
    public class SupplierConfiguration : EntityTypeConfiguration<Supplier>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Supplier> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("supplier");

                builder.Property(e => e.Id);
                builder.Property(e => e.Contacts).HasMaxLength(45);
                builder.Property(e => e.Name).HasMaxLength(45);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring SupplierConfiguration: {ex.Message}", ex);
            }
        }
    }
}

