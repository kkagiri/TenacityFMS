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
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");

            builder.Property(e => e.WorkflowId)
                .HasColumnType("int(11)")
                .HasColumnName("WorkflowID");

            builder.Property(e => e.Name)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.Color)
                .HasMaxLength(20);

            builder.Property(e => e.SortOrder)
                .HasColumnType("int(11)")
                .HasDefaultValue(0);

            builder.Property(e => e.IsActive)
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(true);

            builder.Property(e => e.CreatedAt)
                .HasColumnType("datetime");

            builder.Property(e => e.UpdatedAt)
                .HasColumnType("datetime");

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