using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueAutoCloseConfigConfiguration : EntityTypeConfiguration<Issueautocloseconfig>
    {
        public override void Configure(EntityTypeBuilder<Issueautocloseconfig> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("issueautocloseconfig");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever();

                builder.Property(e => e.IssueTemplateId);

                builder.Property(e => e.IsEnabled)
                    .HasDefaultValue(false);

                builder.Property(e => e.CheckerType)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.CheckIntervalSeconds);

                builder.Property(e => e.CheckerConfigJson);

                builder.Property(e => e.AutoCloseWhenSatisfied)
                    .HasDefaultValue(false);

                builder.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.HasIndex(e => e.IssueTemplateId).IsUnique();

                builder.HasOne(e => e.IssueTemplate)
                    .WithOne(t => t.AutoCloseConfig)
                    .HasForeignKey<Issueautocloseconfig>(e => e.IssueTemplateId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_issueautocloseconfig_issuetemplate");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring IssueAutoCloseConfigConfiguration: {ex.Message}");
                throw new Exception($"Error configuring IssueAutoCloseConfigConfiguration: {ex.Message}", ex);
            }
        }
    }
}

