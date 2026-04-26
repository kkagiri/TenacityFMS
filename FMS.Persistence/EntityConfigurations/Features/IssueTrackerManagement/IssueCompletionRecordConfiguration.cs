/*
 * File: IssueCompletionRecordConfiguration.cs
 * Purpose: EF Core mapping configuration for IssueCompletionRecord entity
 * Dependencies: Entity Framework Core, IssueCompletionRecord domain entity
 * Last Modified: 2026-02-21
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueCompletionRecordConfiguration : EntityTypeConfiguration<IssueCompletionRecord>
    {
        public override void Configure(EntityTypeBuilder<IssueCompletionRecord> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issuecompletionrecord");

            builder.Property(e => e.Id)
                .ValueGeneratedNever();

            builder.Property(e => e.IssueId);

            builder.Property(e => e.TemplateActionId);

            builder.Property(e => e.ActionName)
                .HasMaxLength(150)
                .IsRequired();

            builder.Property(e => e.RootCause)
                .HasMaxLength(1000);

            builder.Property(e => e.Notes)
                .HasMaxLength(2000);

            // Device change fields
            builder.Property(e => e.OldDeviceType)
                .HasMaxLength(100);

            builder.Property(e => e.OldDeviceImei)
                .HasMaxLength(50);

            builder.Property(e => e.NewDeviceType)
                .HasMaxLength(100);

            builder.Property(e => e.NewDeviceImei)
                .HasMaxLength(50);

            builder.Property(e => e.DevicePhoneNumber)
                .HasMaxLength(50);

            builder.Property(e => e.SourceVehicleId);

            // Camera fields
            builder.Property(e => e.CameraImei)
                .HasMaxLength(50);

            builder.Property(e => e.CameraPosition)
                .HasMaxLength(20);

            builder.Property(e => e.CameraSimNumber)
                .HasMaxLength(50);

            // Sensor replacement fields
            builder.Property(e => e.OldSensorType)
                .HasMaxLength(100);

            builder.Property(e => e.NewSensorType)
                .HasMaxLength(100);

            builder.Property(e => e.SensorReason)
                .HasMaxLength(100);

            // Sensor calibration fields
            builder.Property(e => e.CalibrationResult)
                .HasMaxLength(100);

            builder.Property(e => e.AdditionalNotes)
                .HasMaxLength(2000);

            builder.Property(e => e.CompletedByUserId)
                .HasMaxLength(128)
                .IsRequired();

            builder.Property(e => e.CompletedByUserName)
                .HasMaxLength(256);

            builder.Property(e => e.CompletedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Indexes
            builder.HasIndex(e => e.IssueId)
                .HasDatabaseName("IX_issuecompletionrecord_issueid");

            builder.HasIndex(e => e.TemplateActionId)
                .HasDatabaseName("IX_issuecompletionrecord_actionid");

            // FK to Issuetracker
            builder.HasOne(e => e.Issue)
                .WithMany(i => i.CompletionRecords)
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_issuecompletionrecord_issuetracker");

            // FK to IssueTemplateAction (nullable for "Other")
            builder.HasOne(e => e.TemplateAction)
                .WithMany(a => a.CompletionRecords)
                .HasForeignKey(e => e.TemplateActionId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_issuecompletionrecord_templateaction");

            // FK to Vehicle (source vehicle — nullable)
            builder.HasOne(e => e.SourceVehicle)
                .WithMany()
                .HasForeignKey(e => e.SourceVehicleId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_issuecompletionrecord_vehicle");
        }
    }
}

