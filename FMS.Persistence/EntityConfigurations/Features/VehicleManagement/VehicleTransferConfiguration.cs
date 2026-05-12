using FMS.Domain.Entities.Features.VehicleManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// Entity configuration for VehicleTransfer and related entities
/// </summary>
public class VehicleTransferConfiguration : IEntityTypeConfiguration<VehicleTransfer>
{
    public void Configure(EntityTypeBuilder<VehicleTransfer> builder)
    {
        builder.ToTable("vehicle_transfers");

        builder.HasKey(e => e.TransferId);

        builder.Property(e => e.TransferId)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.VehicleId)
            .IsRequired();

        builder.Property(e => e.DeliveryNoteNumber)
            .HasMaxLength(50);

        builder.Property(e => e.FromSiteId)
            .IsRequired();

        builder.Property(e => e.ToSiteId)
            .IsRequired();

        builder.Property(e => e.TransferDate)
            .IsRequired();

        builder.Property(e => e.DriverId);

        builder.Property(e => e.DriverName)
            .HasMaxLength(200);

        builder.Property(e => e.DriverPhone)
            .HasMaxLength(50);

        builder.Property(e => e.JobNumber)
            .HasMaxLength(50);

        builder.Property(e => e.CurrentReading)
            .HasColumnType("decimal(12,2)");

        builder.Property(e => e.ReadingUnit)
            .HasMaxLength(20)
            .HasDefaultValue("hrs");

        builder.Property(e => e.NextServiceReading)
            .HasColumnType("decimal(12,2)");

        builder.Property(e => e.BatteryNumber)
            .HasMaxLength(100);

        builder.Property(e => e.MakeModel)
            .HasMaxLength(200);

        builder.Property(e => e.FuelInTank)
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.SealNumber)
            .HasMaxLength(50);

        builder.Property(e => e.DepartureTime);

        builder.Property(e => e.ArrivalTime);

        builder.Property(e => e.AntiTheftCheckedDeparture);

        builder.Property(e => e.AntiTheftCheckedArrival);

        builder.Property(e => e.KeysInEnvelopeChecked);

        builder.Property(e => e.Status)
            .HasMaxLength(50)
            .HasDefaultValue("Pending")
            .IsRequired();

        builder.Property(e => e.Remarks)
            .HasMaxLength(2000);

        builder.Property(e => e.ServiceFilterParts);

        builder.Property(e => e.SenderName)
            .HasMaxLength(200);

        builder.Property(e => e.SenderFunction)
            .HasMaxLength(200);

        builder.Property(e => e.ReceiverName)
            .HasMaxLength(200);

        builder.Property(e => e.ReceiverFunction)
            .HasMaxLength(200);

        builder.Property(e => e.ApprovedBy)
            .HasMaxLength(200);

        builder.Property(e => e.WorkshopManagerSign)
            .HasMaxLength(200);

        // ── Notification workflow fields ──

        builder.Property(e => e.ReceiverUserId)
            .HasMaxLength(450);

        builder.Property(e => e.ApproverUserId)
            .HasMaxLength(450);

        builder.Property(e => e.DispatchedAt);

        builder.Property(e => e.ReceivedAt);

        builder.Property(e => e.LastReminderSentAt);

        builder.Property(e => e.ReminderCount)
            .HasDefaultValue(0);

        builder.Property(e => e.DocumentUrl)
            .HasMaxLength(500);

        builder.Property(e => e.DocumentFileName)
            .HasMaxLength(255);

        builder.Property(e => e.EmailSent);

        builder.Property(e => e.EmailSentDate);

        builder.Property(e => e.CreatedBy)
            .HasMaxLength(255);

        builder.Property(e => e.ModifiedBy)
            .HasMaxLength(255);

        builder.Property(e => e.DateCreated);

        builder.Property(e => e.DateModified);

        // GPS Device fields
        builder.Property(e => e.GpsDeviceId)
            .HasMaxLength(100);

        builder.Property(e => e.GpsDeviceCondition)
            .HasMaxLength(50);

        builder.Property(e => e.GpsDeviceWorking)
            .HasDefaultValue(true);

        builder.Property(e => e.GpsDeviceRemarks);

        // Fuel Sensor fields
        builder.Property(e => e.FuelSensorId)
            .HasMaxLength(100);

        builder.Property(e => e.FuelSensorCondition)
            .HasMaxLength(50);

        builder.Property(e => e.FuelSensorWorking)
            .HasDefaultValue(true);

        builder.Property(e => e.FuelSensorRemarks);

        // Vehicle details (denormalized)
        builder.Property(e => e.VehicleManufacturer)
            .HasMaxLength(200);

        builder.Property(e => e.VehicleModelName)
            .HasMaxLength(200);

        // Relationships
        builder.HasOne(e => e.Vehicle)
            .WithMany()
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.FromSite)
            .WithMany()
            .HasForeignKey(e => e.FromSiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ToSite)
            .WithMany()
            .HasForeignKey(e => e.ToSiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Driver)
            .WithMany()
            .HasForeignKey(e => e.DriverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.VehicleId).HasDatabaseName("idx_vehicle_transfers_vehicle_id");
        builder.HasIndex(e => e.FromSiteId).HasDatabaseName("idx_vehicle_transfers_from_site_id");
        builder.HasIndex(e => e.ToSiteId).HasDatabaseName("idx_vehicle_transfers_to_site_id");
        builder.HasIndex(e => e.TransferDate).HasDatabaseName("idx_vehicle_transfers_transfer_date");
        builder.HasIndex(e => e.Status).HasDatabaseName("idx_vehicle_transfers_status");
    }
}

/// <summary>
/// Entity configuration for VehicleTransferCheckupItem
/// </summary>
public class VehicleTransferCheckupItemConfiguration : IEntityTypeConfiguration<VehicleTransferCheckupItem>
{
    public void Configure(EntityTypeBuilder<VehicleTransferCheckupItem> builder)
    {
        builder.ToTable("vehicle_transfer_checkup_items");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.TransferId)
            .IsRequired();

        builder.Property(e => e.SerialNo);

        builder.Property(e => e.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.CheckType)
            .HasMaxLength(50);

        builder.Property(e => e.IsGood);

        builder.Property(e => e.IsFair);

        builder.Property(e => e.IsDamaged);

        builder.Property(e => e.IsWorn);

        builder.Property(e => e.WornPercentage)
            .HasColumnType("decimal(5,2)");

        builder.Property(e => e.Remarks)
            .HasMaxLength(500);

        // Relationship
        builder.HasOne(e => e.Transfer)
            .WithMany(t => t.CheckupItems)
            .HasForeignKey(e => e.TransferId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index
        builder.HasIndex(e => e.TransferId).HasDatabaseName("idx_transfer_checkup_items_transfer_id");
    }
}

/// <summary>
/// Entity configuration for VehicleTransferTyreDetail
/// </summary>
public class VehicleTransferTyreDetailConfiguration : IEntityTypeConfiguration<VehicleTransferTyreDetail>
{
    public void Configure(EntityTypeBuilder<VehicleTransferTyreDetail> builder)
    {
        builder.ToTable("vehicle_transfer_tyre_details");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.TransferId)
            .IsRequired();

        builder.Property(e => e.Position)
            .HasMaxLength(50);

        builder.Property(e => e.Brand)
            .HasMaxLength(100);

        builder.Property(e => e.Size)
            .HasMaxLength(50);

        builder.Property(e => e.Condition)
            .HasColumnType("decimal(5,2)");

        builder.Property(e => e.Remarks)
            .HasMaxLength(200);

        // Relationship
        builder.HasOne(e => e.Transfer)
            .WithMany(t => t.TyreDetails)
            .HasForeignKey(e => e.TransferId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index
        builder.HasIndex(e => e.TransferId).HasDatabaseName("idx_transfer_tyre_details_transfer_id");
    }
}

/// <summary>
/// Entity configuration for VehicleTransferBatteryDetail
/// </summary>
public class VehicleTransferBatteryDetailConfiguration : IEntityTypeConfiguration<VehicleTransferBatteryDetail>
{
    public void Configure(EntityTypeBuilder<VehicleTransferBatteryDetail> builder)
    {
        builder.ToTable("vehicle_transfer_battery_details");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.TransferId)
            .IsRequired();

        builder.Property(e => e.BatteryNumber)
            .HasMaxLength(100);

        builder.Property(e => e.Condition)
            .HasMaxLength(50);

        builder.Property(e => e.Voltage)
            .HasColumnType("decimal(5,2)");

        builder.Property(e => e.Remarks)
            .HasMaxLength(200);

        // Relationship
        builder.HasOne(e => e.Transfer)
            .WithMany(t => t.BatteryDetails)
            .HasForeignKey(e => e.TransferId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index
        builder.HasIndex(e => e.TransferId).HasDatabaseName("idx_transfer_battery_details_transfer_id");
    }
}


