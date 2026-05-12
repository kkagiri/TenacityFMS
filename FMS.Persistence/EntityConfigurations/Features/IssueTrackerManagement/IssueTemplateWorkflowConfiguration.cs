using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueTemplateWorkflowConfiguration : EntityTypeConfiguration<IssueTemplateWorkflow>
    {
        public override void Configure(EntityTypeBuilder<IssueTemplateWorkflow> builder)
        {
            builder.HasKey(e => e.Id);

            builder.ToTable("issuetemplateworkflow");

            builder.Property(e => e.Id)
                .ValueGeneratedNever();

            builder.Property(e => e.IssueTemplateId);

            builder.Property(e => e.Name)
                .HasMaxLength(150)
                .IsRequired();

            builder.Property(e => e.IsActive)
                .HasDefaultValue(true);

            builder.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L);

            builder.Property(e => e.CreatedAt);

            builder.Property(e => e.UpdatedAt);

            builder.HasIndex(e => e.IssueTemplateId)
                .IsUnique()
                .HasDatabaseName("UQ_issuetemplateworkflow_templateid");

            builder.HasOne(e => e.IssueTemplate)
                .WithOne(t => t.Workflow)
                .HasForeignKey<IssueTemplateWorkflow>(e => e.IssueTemplateId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_issuetemplateworkflow_issuetemplate");
        }
    }
}
