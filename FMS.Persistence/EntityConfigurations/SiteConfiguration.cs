using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Site entity
    /// </summary>
    public class SiteConfiguration : EntityTypeConfiguration<Site>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Site> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("site", tb => tb.HasComment("			"));

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");

                builder.Property(e => e.Name)
                    .HasMaxLength(45)
                    .HasColumnName("name");

                builder.Property(e => e.IsActive)
                    .IsRequired()
                    .HasColumnType("TINYINT(1)")
                    .HasDefaultValue(true)
                    .HasComment("Indicates whether the site is active for fuel reporting");

                // Site Administrator relationship
                builder.Property(e => e.SiteAdministratorId)
                    .HasMaxLength(100)
                    .HasColumnName("site_administrator_id");

                builder.HasOne(d => d.SiteAdministrator)
                    .WithMany()
                    .HasForeignKey(d => d.SiteAdministratorId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Site_SiteAdministrator");

                // Index for Site Administrator
                builder.HasIndex(e => e.SiteAdministratorId, "IX_Site_SiteAdministrator");

                // Many-to-many relationship with User
                // builder.HasMany(d => d.Users).WithMany(p => p.Sites)
                //     .UsingEntity<Dictionary<string, object>>(
                //         "Usersite",
                //         r => r.HasOne<User>().WithMany()
                //             .HasForeignKey("UserId")
                //             .OnDelete(DeleteBehavior.ClientSetNull)
                //             .HasConstraintName("UserID"),
                //         l => l.HasOne<Site>().WithMany()
                //             .HasForeignKey("SiteId")
                //             .OnDelete(DeleteBehavior.ClientSetNull)
                //             .HasConstraintName("SiteID"),
                //         j =>
                //         {
                //             j.HasKey("SiteId", "UserId")
                //                 .HasName("PRIMARY")
                //                 .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                //             j.ToTable("usersite");
                //             j.HasIndex(new[] { "UserId" }, "UserID_idx");
                //             j.IndexerProperty<int>("SiteId").HasColumnType("int(11)");
                //             j.IndexerProperty<string>("UserId")
                //                 .HasMaxLength(100)
                //                 .UseCollation("utf8mb4_general_ci")
                //                 .HasCharSet("utf8mb4");
                //         });
            }
            catch (Exception ex)
            {
                throw new Exception($"Error configuring SiteConfiguration: {ex.Message}", ex);
            }
        }
    }
}