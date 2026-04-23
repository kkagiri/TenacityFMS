/*
 * File: IssueTemplateActionConfiguration.cs
 * Purpose: EF Core mapping configuration for IssueTemplateAction entity
 * Dependencies: Entity Framework Core, IssueTemplateAction domain entity
 * Last Modified: 2026-02-21
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueTemplateActionConfiguration : EntityTypeConfiguration<IssueTemplateAction>
    {
        public override void Configure(EntityTypeBuilder<IssueTemplateAction> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issuetemplateaction");

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

            builder.Property(e => e.ActionType)
                .HasMaxLength(50)
                .HasDefaultValue("General")
                .IsRequired();

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.RequiresDeviceDetails)
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(false);

            builder.Property(e => e.RequiresSourceVehicle)
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(false);

            builder.Property(e => e.RequiresCameraDetails)
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(false);

            builder.Property(e => e.StageId)
                .HasColumnType("int(11)")
                .HasColumnName("StageID");

            builder.Property(e => e.PositionX)
                .HasColumnType("double");

            builder.Property(e => e.PositionY)
                .HasColumnType("double");

            builder.Property(e => e.SortOrder)
                .HasColumnType("int(11)")
                .HasDefaultValue(0);

            builder.Property(e => e.IsActive)
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(true);

            builder.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Index for fast lookup by template
            builder.HasIndex(e => e.IssueTemplateId)
                .HasDatabaseName("IX_issuetemplateaction_templateid");

            // Unique: one action name per template
            builder.HasIndex(e => new { e.IssueTemplateId, e.Name })
                .IsUnique()
                .HasDatabaseName("UQ_issuetemplateaction_template_name");

            // FK to Issuetemplate
            builder.HasOne(e => e.IssueTemplate)
                .WithMany(t => t.TemplateActions)
                .HasForeignKey(e => e.IssueTemplateId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_issuetemplateaction_issuetemplate");

            builder.HasOne(e => e.Stage)
                .WithMany(s => s.Actions)
                .HasForeignKey(e => e.StageId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_issuetemplateaction_workflowstage");
        }
    }
}
