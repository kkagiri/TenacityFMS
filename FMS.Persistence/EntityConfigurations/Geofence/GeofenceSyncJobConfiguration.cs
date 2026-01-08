using FMS.Domain.Entities.Features.Geofence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.Geofence;

/// <summary>
/// Entity configuration for GeofenceSyncJob table
/// </summary>
public class GeofenceSyncJobConfiguration : IEntityTypeConfiguration<GeofenceSyncJob>
{
    public void Configure(EntityTypeBuilder<GeofenceSyncJob> builder)
    {
        builder.ToTable("geofence_sync_jobs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("id");

        builder.Property(e => e.JobId)
            .HasColumnName("job_id")
            .HasMaxLength(36)
            .IsRequired();

        builder.HasIndex(e => e.JobId)
            .IsUnique()
            .HasDatabaseName("ix_geofence_sync_jobs_job_id");

        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(e => e.Status)
            .HasDatabaseName("ix_geofence_sync_jobs_status");

        builder.Property(e => e.ProgressPercent)
            .HasColumnName("progress_percent")
            .HasDefaultValue(0);

        builder.Property(e => e.StatusMessage)
            .HasColumnName("status_message")
            .HasMaxLength(500);

        builder.Property(e => e.GeofencesSynced)
            .HasColumnName("geofences_synced")
            .HasDefaultValue(0);

        builder.Property(e => e.GroupsSynced)
            .HasColumnName("groups_synced")
            .HasDefaultValue(0);

        builder.Property(e => e.TotalGeofences)
            .HasColumnName("total_geofences");

        builder.Property(e => e.TotalGroups)
            .HasColumnName("total_groups");

        builder.Property(e => e.FailedCount)
            .HasColumnName("failed_count")
            .HasDefaultValue(0);

        builder.Property(e => e.ForceFullSync)
            .HasColumnName("force_full_sync")
            .HasDefaultValue(false);

        builder.Property(e => e.ErrorMessage)
            .HasColumnName("error_message")
            .HasColumnType("text");

        builder.Property(e => e.InitiatedBy)
            .HasColumnName("initiated_by")
            .HasMaxLength(100);

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("ix_geofence_sync_jobs_created_at");

        builder.Property(e => e.StartedAt)
            .HasColumnName("started_at");

        builder.Property(e => e.CompletedAt)
            .HasColumnName("completed_at");
    }
}
