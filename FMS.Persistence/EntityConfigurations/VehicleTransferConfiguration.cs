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
            .HasColumnName("transfer_id")
            .ValueGeneratedOnAdd();

        builder.Property(e => e.VehicleId)
            .HasColumnName("vehicle_id")
            .IsRequired();

        builder.Property(e => e.DeliveryNoteNumber)
            .HasColumnName("delivery_note_number")
            .HasMaxLength(50);

        builder.Property(e => e.FromSiteId)
            .HasColumnName("from_site_id")
            .IsRequired();

        builder.Property(e => e.ToSiteId)
            .HasColumnName("to_site_id")
            .IsRequired();

        builder.Property(e => e.TransferDate)
            .HasColumnName("transfer_date")
            .IsRequired();

        builder.Property(e => e.DriverId)
            .HasColumnName("driver_id");

        builder.Property(e => e.DriverName)
            .HasColumnName("driver_name")
            .HasMaxLength(200);

        builder.Property(e => e.DriverPhone)
            .HasColumnName("driver_phone")
            .HasMaxLength(50);

        builder.Property(e => e.JobNumber)
            .HasColumnName("job_number")
            .HasMaxLength(50);

        builder.Property(e => e.CurrentReading)
            .HasColumnName("current_reading")
            .HasColumnType("decimal(12,2)");

        builder.Property(e => e.ReadingUnit)
            .HasColumnName("reading_unit")
            .HasMaxLength(20)
            .HasDefaultValue("hrs");

        builder.Property(e => e.NextServiceReading)
            .HasColumnName("next_service_reading")
            .HasColumnType("decimal(12,2)");

        builder.Property(e => e.BatteryNumber)
            .HasColumnName("battery_number")
            .HasMaxLength(100);

        builder.Property(e => e.MakeModel)
            .HasColumnName("make_model")
            .HasMaxLength(200);

        builder.Property(e => e.FuelInTank)
            .HasColumnName("fuel_in_tank")
            .HasColumnType("decimal(10,2)");

        builder.Property(e => e.SealNumber)
            .HasColumnName("seal_number")
            .HasMaxLength(50);

        builder.Property(e => e.DepartureTime)
            .HasColumnName("departure_time");

        builder.Property(e => e.ArrivalTime)
            .HasColumnName("arrival_time");

        builder.Property(e => e.AntiTheftCheckedDeparture)
            .HasColumnName("anti_theft_checked_departure");

        builder.Property(e => e.AntiTheftCheckedArrival)
            .HasColumnName("anti_theft_checked_arrival");

        builder.Property(e => e.KeysInEnvelopeChecked)
            .HasColumnName("keys_in_envelope_checked");

        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasMaxLength(50)
            .HasDefaultValue("Pending")
            .IsRequired();

        builder.Property(e => e.Remarks)
            .HasColumnName("remarks")
            .HasMaxLength(2000);

        builder.Property(e => e.ServiceFilterParts)
            .HasColumnName("service_filter_parts")
            .HasColumnType("text");

        builder.Property(e => e.SenderName)
            .HasColumnName("sender_name")
            .HasMaxLength(200);

        builder.Property(e => e.SenderFunction)
            .HasColumnName("sender_function")
            .HasMaxLength(200);

        builder.Property(e => e.ReceiverName)
            .HasColumnName("receiver_name")
            .HasMaxLength(200);

        builder.Property(e => e.ReceiverFunction)
            .HasColumnName("receiver_function")
            .HasMaxLength(200);

        builder.Property(e => e.ApprovedBy)
            .HasColumnName("approved_by")
            .HasMaxLength(200);

        builder.Property(e => e.WorkshopManagerSign)
            .HasColumnName("workshop_manager_sign")
            .HasMaxLength(200);

        // ── Notification workflow fields ──

        builder.Property(e => e.ReceiverUserId)
            .HasColumnName("receiver_user_id")
            .HasMaxLength(450);

        builder.Property(e => e.ApproverUserId)
            .HasColumnName("approver_user_id")
            .HasMaxLength(450);

        builder.Property(e => e.DispatchedAt)
            .HasColumnName("dispatched_at");

        builder.Property(e => e.ReceivedAt)
            .HasColumnName("received_at");

        builder.Property(e => e.LastReminderSentAt)
            .HasColumnName("last_reminder_sent_at");

        builder.Property(e => e.ReminderCount)
            .HasColumnName("reminder_count")
            .HasDefaultValue(0);

        builder.Property(e => e.DocumentUrl)
            .HasColumnName("document_url")
            .HasMaxLength(500);

        builder.Property(e => e.DocumentFileName)
            .HasColumnName("document_file_name")
            .HasMaxLength(255);

        builder.Property(e => e.EmailSent)
            .HasColumnName("email_sent");

        builder.Property(e => e.EmailSentDate)
            .HasColumnName("email_sent_date");

        builder.Property(e => e.CreatedBy)
            .HasColumnName("created_by")
            .HasMaxLength(255);

        builder.Property(e => e.ModifiedBy)
            .HasColumnName("modified_by")
            .HasMaxLength(255);

        builder.Property(e => e.DateCreated)
            .HasColumnName("date_created");

        builder.Property(e => e.DateModified)
            .HasColumnName("date_modified");

        // GPS Device fields
        builder.Property(e => e.GpsDeviceId)
            .HasColumnName("GpsDeviceId")
            .HasMaxLength(100);

        builder.Property(e => e.GpsDeviceCondition)
            .HasColumnName("GpsDeviceCondition")
            .HasMaxLength(50);

        builder.Property(e => e.GpsDeviceWorking)
            .HasColumnName("GpsDeviceWorking")
            .HasDefaultValue(true);

        builder.Property(e => e.GpsDeviceRemarks)
            .HasColumnName("GpsDeviceRemarks")
            .HasColumnType("TEXT");

        // Fuel Sensor fields
        builder.Property(e => e.FuelSensorId)
            .HasColumnName("FuelSensorId")
            .HasMaxLength(100);

        builder.Property(e => e.FuelSensorCondition)
            .HasColumnName("FuelSensorCondition")
            .HasMaxLength(50);

        builder.Property(e => e.FuelSensorWorking)
            .HasColumnName("FuelSensorWorking")
            .HasDefaultValue(true);

        builder.Property(e => e.FuelSensorRemarks)
            .HasColumnName("FuelSensorRemarks")
            .HasColumnType("TEXT");

        // Vehicle details (denormalized)
        builder.Property(e => e.VehicleManufacturer)
            .HasColumnName("VehicleManufacturer")
            .HasMaxLength(200);

        builder.Property(e => e.VehicleModelName)
            .HasColumnName("VehicleModelName")
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
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(e => e.TransferId)
            .HasColumnName("transfer_id")
            .IsRequired();

        builder.Property(e => e.SerialNo)
            .HasColumnName("serial_no");

        builder.Property(e => e.Description)
            .HasColumnName("description")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.CheckType)
            .HasColumnName("check_type")
            .HasMaxLength(50);

        builder.Property(e => e.IsGood)
            .HasColumnName("is_good");

        builder.Property(e => e.IsFair)
            .HasColumnName("is_fair");

        builder.Property(e => e.IsDamaged)
            .HasColumnName("is_damaged");

        builder.Property(e => e.IsWorn)
            .HasColumnName("is_worn");

        builder.Property(e => e.WornPercentage)
            .HasColumnName("worn_percentage")
            .HasColumnType("decimal(5,2)");

        builder.Property(e => e.Remarks)
            .HasColumnName("remarks")
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
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(e => e.TransferId)
            .HasColumnName("transfer_id")
            .IsRequired();

        builder.Property(e => e.Position)
            .HasColumnName("position")
            .HasMaxLength(50);

        builder.Property(e => e.Brand)
            .HasColumnName("brand")
            .HasMaxLength(100);

        builder.Property(e => e.Size)
            .HasColumnName("size")
            .HasMaxLength(50);

        builder.Property(e => e.Condition)
            .HasColumnName("condition")
            .HasColumnType("decimal(5,2)");

        builder.Property(e => e.Remarks)
            .HasColumnName("remarks")
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
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(e => e.TransferId)
            .HasColumnName("transfer_id")
            .IsRequired();

        builder.Property(e => e.BatteryNumber)
            .HasColumnName("battery_number")
            .HasMaxLength(100);

        builder.Property(e => e.Condition)
            .HasColumnName("condition")
            .HasMaxLength(50);

        builder.Property(e => e.Voltage)
            .HasColumnName("voltage")
            .HasColumnType("decimal(5,2)");

        builder.Property(e => e.Remarks)
            .HasColumnName("remarks")
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
