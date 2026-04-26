using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueTemplateWorkflowStageConfiguration : EntityTypeConfiguration<IssueTemplateWorkflowStage>
    {
        public override void Configure(EntityTypeBuilder<IssueTemplateWorkflowStage> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issuetemplateworkflowstage");

            builder.Property(e => e.Id)
                .ValueGeneratedNever();

            builder.Property(e => e.WorkflowId);

            builder.Property(e => e.Name)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.Color)
                .HasMaxLength(20);

            builder.Property(e => e.SortOrder)
                .HasDefaultValue(0);

            builder.Property(e => e.IsActive)
                .HasDefaultValue(true);

            builder.Property(e => e.CreatedAt);

            builder.Property(e => e.UpdatedAt);

            builder.HasIndex(e => new { e.WorkflowId, e.SortOrder })
                .HasDatabaseName("IX_issuetemplateworkflowstage_workflow_sortorder");

            builder.HasOne(e => e.Workflow)
                .WithMany(w => w.Stages)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_issuetemplateworkflowstage_workflow");
        }
    }
}
