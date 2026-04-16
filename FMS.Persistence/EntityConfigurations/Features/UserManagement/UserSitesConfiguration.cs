using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Persistence.EntityConfigurations
{
    public class UserSitesConfiguration : EntityTypeConfiguration<UserSites>

    {
        public override void Configure(EntityTypeBuilder<UserSites> builder)
        {

            try
            {
                builder.HasKey(e => new { e.SiteId, e.UserId }).HasName("PRIMARY");

                builder.ToTable("usersite");

                builder.HasIndex(e => e.UserId).HasDatabaseName("UserID_idx");

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteId");

                builder.Property(e => e.UserId)
                    .HasMaxLength(100)
                    .HasColumnName("UserId")
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");

                builder.HasOne(d => d.User)
                    .WithMany(p => p.UserSites)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.NoAction)
                    .HasConstraintName("UserID");

                builder.HasOne(d => d.Site)
                    .WithMany(p => p.UserSites)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.NoAction)
                    .HasConstraintName("SiteID");

                builder.HasQueryFilter(e => e.User == null || e.User.IsDeleted != true);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error configuring UserSitesConfiguration: {ex.Message}", ex);
            }
        }
    }
}
