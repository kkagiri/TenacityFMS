using FMS.Domain.Entities.Features.LocationValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// EF Core configuration for LocationValidationLog entity
/// </summary>
public class LocationValidationLogConfiguration : EntityTypeConfiguration<LocationValidationLog>
{
    public override void Configure(EntityTypeBuilder<LocationValidationLog> builder)
    {
        builder.ToTable("location_validation_log");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.ValidationTime)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(e => e.PtsId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.TankId)
            .IsRequired();

        builder.Property(e => e.VehicleId);

        builder.Property(e => e.TankType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // Tank location
        builder.Property(e => e.TankLatitude)
            .HasColumnType("decimal(10, 8)");

        builder.Property(e => e.TankLongitude)
            .HasColumnType("decimal(11, 8)");

        builder.Property(e => e.TankLocationSource)
            .HasMaxLength(50);

        // Vehicle location
        builder.Property(e => e.VehicleLatitude)
            .HasColumnType("decimal(10, 8)");

        builder.Property(e => e.VehicleLongitude)
            .HasColumnType("decimal(11, 8)");

        builder.Property(e => e.VehicleGPSAccuracy)
            .HasColumnType("decimal(10, 2)");

        builder.Property(e => e.VehicleDistanceMeters)
            .HasColumnType("decimal(10, 2)");

        builder.Property(e => e.VehicleProximityRequired)
            .HasDefaultValue(false);

        builder.Property(e => e.VehicleProximityValid);

        // Mobile location
        builder.Property(e => e.MobileLatitude)
            .HasColumnType("decimal(10, 8)");

        builder.Property(e => e.MobileLongitude)
            .HasColumnType("decimal(11, 8)");

        builder.Property(e => e.MobileAccuracy)
            .HasColumnType("decimal(10, 2)");

        builder.Property(e => e.MobileDistanceMeters)
            .HasColumnType("decimal(10, 2)");

        builder.Property(e => e.MobileProximityRequired)
            .HasDefaultValue(false);

        builder.Property(e => e.MobileProximityValid);

        // GPS accuracy validation
        builder.Property(e => e.MinimumGPSAccuracyRequired);

        builder.Property(e => e.GPSAccuracyValid);

        // Validation result
        builder.Property(e => e.IsValid)
            .IsRequired();

        builder.Property(e => e.ValidationResult)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.FailureReason)
            .HasMaxLength(500);

        // Settings used
        builder.Property(e => e.VehicleRadiusUsed);

        builder.Property(e => e.MobileRadiusUsed);

        builder.Property(e => e.GracePeriodMetersUsed);

        builder.Property(e => e.WasBypassedDueToGPSFailure)
            .HasDefaultValue(false);

        // Context
        builder.Property(e => e.UserId)
            .HasMaxLength(100);

        builder.Property(e => e.TransactionId);

        // Indexes
        builder.HasIndex(e => e.PtsId)
            .HasDatabaseName("IX_LocationValidationLog_PtsId");

        builder.HasIndex(e => e.TankId)
            .HasDatabaseName("IX_LocationValidationLog_TankId");

        builder.HasIndex(e => e.VehicleId)
            .HasDatabaseName("IX_LocationValidationLog_VehicleId");

        builder.HasIndex(e => e.ValidationTime)
            .HasDatabaseName("IX_LocationValidationLog_ValidationTime");

        builder.HasIndex(e => e.IsValid)
            .HasDatabaseName("IX_LocationValidationLog_IsValid");
    }
}

