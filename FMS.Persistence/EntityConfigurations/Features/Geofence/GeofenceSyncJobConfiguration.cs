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

        builder.Property(e => e.Id);

        builder.Property(e => e.JobId)
            .HasMaxLength(36)
            .IsRequired();

        builder.HasIndex(e => e.JobId)
            .IsUnique()
            .HasDatabaseName("ix_geofence_sync_jobs_job_id");

        builder.Property(e => e.Status)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(e => e.Status)
            .HasDatabaseName("ix_geofence_sync_jobs_status");

        builder.Property(e => e.ProgressPercent)
            .HasDefaultValue(0);

        builder.Property(e => e.StatusMessage)
            .HasMaxLength(500);

        builder.Property(e => e.GeofencesSynced)
            .HasDefaultValue(0);

        builder.Property(e => e.GroupsSynced)
            .HasDefaultValue(0);

        builder.Property(e => e.TotalGeofences);

        builder.Property(e => e.TotalGroups);

        builder.Property(e => e.FailedCount)
            .HasDefaultValue(0);

        builder.Property(e => e.ForceFullSync)
            .HasDefaultValue(false);

        builder.Property(e => e.ErrorMessage);

        builder.Property(e => e.InitiatedBy)
            .HasMaxLength(100);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("ix_geofence_sync_jobs_created_at");

        builder.Property(e => e.StartedAt);

        builder.Property(e => e.CompletedAt);
    }
}

