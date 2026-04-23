using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueTemplateWorkflowConfiguration : EntityTypeConfiguration<IssueTemplateWorkflow>
    {
        public override void Configure(EntityTypeBuilder<IssueTemplateWorkflow> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issuetemplateworkflow");

            builder.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");

            builder.Property(e => e.IssueTemplateId)
                .HasColumnType("int(11)")
                .HasColumnName("IssueTemplateID");

            builder.Property(e => e.Name)
                .HasMaxLength(150)
                .IsRequired();

            builder.Property(e => e.IsActive)
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(true);

            builder.Property(e => e.RowVersion)
                .HasColumnType("bigint")
                .IsConcurrencyToken()
                .HasDefaultValue(1L);

            builder.Property(e => e.CreatedAt)
                .HasColumnType("datetime");

            builder.Property(e => e.UpdatedAt)
                .HasColumnType("datetime");

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