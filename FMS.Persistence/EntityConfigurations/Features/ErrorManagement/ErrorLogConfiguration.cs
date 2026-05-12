using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Domain.Entities.Features.ErrorManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class ErrorLogConfiguration : IEntityTypeConfiguration<ErrorLog>
{
    public void Configure(EntityTypeBuilder<ErrorLog> builder)
    {
        builder.ToTable("error_logs");

        builder.HasKey(el => el.Id);

        builder.Property(el => el.Id)
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(el => el.CreatedAt)
            .IsRequired();

        builder.Property(el => el.Message)
            .IsRequired();

        builder.Property(el => el.Stack)
            .IsRequired(false);

        builder.Property(el => el.ComponentStack)
            .IsRequired(false);

        builder.Property(el => el.UserAgent)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(el => el.Url)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(el => el.UserId)
            .HasMaxLength(100)

            .IsRequired(false);

        builder.HasIndex(el => el.CreatedAt).HasDatabaseName("IX_ErrorLog_CreatedAt");
        builder.HasIndex(el => el.UserId).HasDatabaseName("IX_ErrorLog_UserId");

        builder.HasOne<User>()
            .WithMany(user => user.ErrorLogs)
            .HasForeignKey(el => el.UserId)
            .IsRequired(false);
    }
}
