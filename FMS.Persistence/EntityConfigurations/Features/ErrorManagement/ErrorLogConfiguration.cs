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
            .HasColumnName("Id")
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(el => el.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(el => el.Message)
            .HasColumnName("message")
            .HasColumnType("TEXT")
            .IsRequired();

        builder.Property(el => el.Stack)
            .HasColumnName("stack")
            .HasColumnType("TEXT")
            .IsRequired(false);

        builder.Property(el => el.ComponentStack)
            .HasColumnName("component_stack")
            .HasColumnType("TEXT")
            .IsRequired(false);

        builder.Property(el => el.UserAgent)
            .HasColumnName("UserAgent")
            .HasColumnType("VARCHAR(500)")
            .IsRequired(false);

        builder.Property(el => el.Url)
            .HasColumnName("url")
            .HasColumnType("VARCHAR(1000)")
            .IsRequired(false);

        builder.Property(el => el.UserId)
            .HasColumnName("user_id")
            .HasColumnType("VARCHAR(100)")

            .IsRequired(false);

        builder.HasIndex(el => el.CreatedAt).HasDatabaseName("IX_ErrorLog_CreatedAt");
        builder.HasIndex(el => el.UserId).HasDatabaseName("IX_ErrorLog_UserId");

        builder.HasOne<User>()
            .WithMany(user => user.ErrorLogs)
            .HasForeignKey(el => el.UserId)
            .IsRequired(false);
    }
}