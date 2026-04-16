/*
 * File: IssueTemplateConfiguration.cs
 * Purpose: EF Core mapping configuration for Issue Template entity
 * Dependencies: Entity Framework Core, Issuetemplate domain entity
 * Last Modified: 2026-02-03
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueTemplateConfiguration : EntityTypeConfiguration<Issuetemplate>
    {
        public override void Configure(EntityTypeBuilder<Issuetemplate> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("issuetemplate");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");

                builder.Property(e => e.DeviceTypeId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DeviceTypeID");

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.TitleTemplate)
                    .HasMaxLength(255);

                builder.Property(e => e.DescriptionTemplate)
                    .HasMaxLength(945);

                builder.Property(e => e.DefaultPriorityId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DefaultPriorityID");

                builder.Property(e => e.DefaultStatusId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DefaultStatusID");

                builder.Property(e => e.IsActive)
                    .HasColumnType("tinyint(1)")
                    .HasDefaultValue(true);

                builder.Property(e => e.CanAutoCreate)
                    .HasColumnType("tinyint(1)")
                    .HasDefaultValue(false);

                builder.Property(e => e.OfflineThresholdMinutes)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(30);

                builder.Property(e => e.DefaultAssignee)
                    .HasMaxLength(1000);

                builder.Property(e => e.CooldownMinutes)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(null);

                builder.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.HasIndex(e => new { e.DeviceTypeId, e.Name }).IsUnique();

                builder.HasOne(e => e.DeviceType)
                    .WithMany(d => d.Issuetemplates)
                    .HasForeignKey(e => e.DeviceTypeId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_issuetemplate_devicetype");

                builder.HasOne(e => e.DefaultPriority)
                    .WithMany()
                    .HasForeignKey(e => e.DefaultPriorityId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_issuetemplate_issuepriority");

                builder.HasOne(e => e.DefaultStatus)
                    .WithMany()
                    .HasForeignKey(e => e.DefaultStatusId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_issuetemplate_issuestatus");

                builder.HasOne(e => e.AutoCloseConfig)
                    .WithOne(c => c.IssueTemplate)
                    .HasForeignKey<Issueautocloseconfig>(c => c.IssueTemplateId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_issueautocloseconfig_issuetemplate");

                // Many-to-Many: IssueTemplate <-> IssueCategory
                builder.HasMany(e => e.Categories)
                    .WithMany(c => c.IssueTemplates)
                    .UsingEntity<Dictionary<string, object>>(
                        "issuetemplate_categories",
                        j => j.HasOne<Issuecategory>()
                            .WithMany()
                            .HasForeignKey("IssueCategoryID")
                            .OnDelete(DeleteBehavior.Cascade)
                            .HasConstraintName("FK_templatecat_category"),
                        j => j.HasOne<Issuetemplate>()
                            .WithMany()
                            .HasForeignKey("IssueTemplateID")
                            .OnDelete(DeleteBehavior.Cascade)
                            .HasConstraintName("FK_templatecat_template"),
                        j =>
                        {
                            j.HasKey("IssueTemplateID", "IssueCategoryID");
                            j.ToTable("issuetemplate_categories");
                            j.Property<DateTime>("CreatedAt")
                                .HasColumnType("datetime")
                                .HasDefaultValueSql("CURRENT_TIMESTAMP");
                        });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring IssueTemplateConfiguration: {ex.Message}");
                throw new Exception($"Error configuring IssueTemplateConfiguration: {ex.Message}", ex);
            }
        }
    }
}
