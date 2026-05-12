using FMS.Domain.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class UserDashboardLayoutConfiguration : EntityTypeConfiguration<UserDashboardLayout>
    {
        public override void Configure(EntityTypeBuilder<UserDashboardLayout> builder)
        {
            builder.ToTable("user_dashboard_layout");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).HasMaxLength(36).IsRequired();

            builder.Property(x => x.UserId).HasMaxLength(100).IsRequired();
            builder.Property(x => x.LayoutName).HasMaxLength(100).IsRequired();
            builder.Property(x => x.LayoutJson).IsRequired();
            builder.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
            builder.Property(x => x.UpdatedBy).HasMaxLength(100);

            // Indexes
            builder.HasIndex(x => x.UserId).HasDatabaseName("IX_UserDashboardLayout_User");
            builder.HasIndex(x => new { x.UserId, x.IsActive }).HasDatabaseName("IX_UserDashboardLayout_UserActive");

            // Foreign Keys
            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_UserDashboardLayout_User");

            builder.HasQueryFilter(x => x.User.IsDeleted != true);
        }
    }
}

