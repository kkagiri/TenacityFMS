using System;
using System.Collections.Generic;
using System.Diagnostics;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Domain.Entities.Reports;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;


namespace FMS.Persistence.DataAccess;

public partial class GpsdataContext : IdentityDbContext<User, Role, string>
{


    public GpsdataContext(DbContextOptions<GpsdataContext> options)
        : base(options)
    {
    }


    public virtual DbSet<Alertrecord> Alertrecords { get; set; }

    public virtual DbSet<Asset> Assets { get; set; }

    public virtual DbSet<Calibrationdatum> Calibrationdata { get; set; }

    public virtual DbSet<Navigationitem> Navigationitems { get; set; }

    public virtual DbSet<Configuration> Configurations { get; set; }

    public virtual DbSet<Device> Devices { get; set; }

    public virtual DbSet<Devicemanufacturer> Devicemanufacturers { get; set; }

    public virtual DbSet<Devicemodel> Devicemodels { get; set; }

    public virtual DbSet<Devicetype> Devicetypes { get; set; }

    public virtual DbSet<Rolenavigation> Rolenavigations { get; set; }
    public virtual DbSet<Tankstock> Tankstocks { get; set; }

    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Alarm> Alarms { get; set; }
    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<Expectedaverage> Expectedaverages { get; set; }

    public virtual DbSet<UserSites> UserSites { get; set; }
    public virtual DbSet<Expectedaverageclassification> Expectedaverageclassifications { get; set; }

    public virtual DbSet<Fuelrefil> Fuelrefils { get; set; }

    public virtual DbSet<Fuelreportgenerate> Fuelreportgenerates { get; set; }

    public virtual DbSet<Intankdelivery> Intankdeliveries { get; set; }

    public virtual DbSet<Issueassignmenttracker> Issueassignmenttrackers { get; set; }

    public virtual DbSet<Issuecategory> Issuecategories { get; set; }

    public virtual DbSet<Issuepriority> Issuepriorities { get; set; }

    public virtual DbSet<Issuestatus> Issuestatuses { get; set; }

    public virtual DbSet<Issuetracker> Issuetrackers { get; set; }

    public virtual DbSet<Loginactivity> Loginactivities { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<Ptsdevice> Ptsdevices { get; set; }

    public virtual DbSet<Pumptransaction> Pumptransactions { get; set; }


    public virtual DbSet<Site> Sites { get; set; }

    public virtual DbSet<Tag> Tags { get; set; }

    public virtual DbSet<Tank> Tanks { get; set; }

    public virtual DbSet<Tankmeasurement> Tankmeasurements { get; set; }
    public virtual DbSet<UserActivity> UserActivities { get; set; }

    public virtual DbSet<RolePermission> RolePermissions { get; set; }
    public virtual DbSet<ReportItem> ReportItems { get; set; }

    public virtual DbSet<Vehicle> Vehicles { get; set; }

    public virtual DbSet<Vehicleconsumption> Vehicleconsumptions { get; set; }

    public virtual DbSet<Vehiclemanufacturer> Vehiclemanufacturers { get; set; }

    public virtual DbSet<Vehiclemodel> Vehiclemodels { get; set; }

    public virtual DbSet<Vehicletype> Vehicletypes { get; set; }

    //protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    //#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
    //        => optionsBuilder.UseMySql("server=10.0.10.150;port=3306;database=gpsdata;user=root;password=Niwewenamimi1000;connection timeout=10000;command timeout=10000", Microsoft.EntityFrameworkCore.ServerVersion.Parse("5.5.61-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("latin1_swedish_ci")
            .HasCharSet("latin1");
        modelBuilder.Entity<IdentityUserLogin<string>>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey });
        });

        modelBuilder.Entity<IdentityUserRole<string>>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });
        });

        modelBuilder.Entity<IdentityUserToken<string>>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name });
        });

        modelBuilder.Entity<IdentityUserClaim<string>>(entity =>
        {
            entity.HasKey(e => e.Id);
        });


        modelBuilder.Entity<IdentityRoleClaim<string>>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<ReportItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");
            entity.ToTable("reportitem");
            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.DisplayName).HasMaxLength(45);
            entity.Property(e => e.Name).HasMaxLength(45);
            entity.Property(e => e.LayoutData).HasColumnName("LayoutData").HasColumnType("LONGBLOB");

        });
        modelBuilder.Entity<UserActivity>(entity =>
      {
          entity.HasKey(e => e.Id).HasName("PRIMARY");

          entity
              .ToTable("user_activity")
              .HasCharSet("utf8mb4")
              .UseCollation("utf8mb4_general_ci");

          entity.HasIndex(e => e.UserId, "UserId");

          entity.Property(e => e.Id).HasColumnType("int(11)");
          entity.Property(e => e.Action).HasMaxLength(255);
          entity.Property(e => e.ActionName).HasMaxLength(255);
          entity.Property(e => e.Controller).HasMaxLength(255);
          entity.Property(e => e.Parameters).HasColumnType("text");
          entity.Property(e => e.UserId).HasMaxLength(100);

          entity.HasOne(d => d.User).WithMany(p => p.UserActivities)
              .HasForeignKey(d => d.UserId)
              .HasConstraintName("FK_UserActivity_User");
      });
        modelBuilder.Entity<Alarm>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("alarm");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.Name).HasMaxLength(45);
            entity.Property(e => e.Priority).HasMaxLength(45);
        });

        modelBuilder.Entity<Alertrecord>(entity =>
        {
            entity.HasKey(e => e.AlertId).HasName("PRIMARY");

            entity.ToTable("alertrecord");

            entity.Property(e => e.AlertId).HasColumnType("int(11)");
            entity.Property(e => e.Code).HasColumnType("int(11)");
            entity.Property(e => e.ConfigurationId).HasMaxLength(8);
            entity.Property(e => e.DeviceNumber).HasColumnType("int(11)");
            entity.Property(e => e.DeviceType).HasMaxLength(20);
            entity.Property(e => e.PacketId)
                .HasColumnType("int(11)")
                .HasColumnName("PacketID");
            entity.Property(e => e.Ptsid)
                .HasMaxLength(23)
                .HasColumnName("PTSId");
            entity.Property(e => e.State).HasMaxLength(20);
        });

        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.AssetId).HasName("PRIMARY");

            entity.ToTable("asset");

            entity.Property(e => e.AssetId)
                .HasMaxLength(255)
                .HasColumnName("AssetID");
            entity.Property(e => e.AssetName).HasMaxLength(45);
            entity.Property(e => e.IsActive).HasColumnType("tinyint(4)");
            entity.Property(e => e.SiteId)
                .HasMaxLength(255)
                .HasColumnName("SiteID");
        });

        modelBuilder.Entity<Calibrationdatum>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("calibrationdata");

            entity.HasIndex(e => e.VehicleId, "calibrationDataRow_idx");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.CalibrationData).HasColumnType("text");
            entity.Property(e => e.CalibrationDate).HasColumnName("calibrationDate");
            entity.Property(e => e.VehicleId)
                .HasMaxLength(45)
                .HasColumnName("VehicleID");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.Calibrationdata)
                .HasPrincipalKey(p => p.HyoungNo)
                .HasForeignKey(d => d.VehicleId)
                .HasConstraintName("calibrationData_vehicle");
        });

        modelBuilder.Entity<Configuration>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("configuration");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Configuration1).HasColumnName("Configuration");
            entity.Property(e => e.ConfigurationId).HasMaxLength(8);
            entity.Property(e => e.PacketId)
                .HasColumnType("int(11)")
                .HasColumnName("PacketID");
            entity.Property(e => e.Ptsid)
                .HasMaxLength(45)
                .HasColumnName("PTSId");
        });

        modelBuilder.Entity<Device>(entity =>
        {
            entity.HasKey(e => e.DeviceImei).HasName("PRIMARY");

            entity.ToTable("device");

            entity.HasIndex(e => e.DeviceType, "Device_type_idx");

            entity.Property(e => e.DeviceImei)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("DeviceIMEI");
            entity.Property(e => e.DeviceMakerId)
                .HasColumnType("int(11)")
                .HasColumnName("DeviceMakerID");
            entity.Property(e => e.DevicePhoneNumber).HasColumnType("int(11)");
            entity.Property(e => e.DeviceType).HasColumnType("int(11)");

            entity.HasOne(d => d.DeviceTypeNavigation).WithMany(p => p.Devices)
                .HasForeignKey(d => d.DeviceType)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Device_type");
        });
        modelBuilder.Entity<Navigationitem>(entity =>
    {
        entity.HasKey(e => e.Id).HasName("PRIMARY");

        entity.ToTable("navigationitems");

        entity.Property(e => e.Id).HasColumnType("int(11)");
        entity.Property(e => e.Link).HasMaxLength(200);
        entity.Property(e => e.Page).HasMaxLength(100);
        entity.Property(e => e.ParentId).HasColumnType("int(11)");
        entity.Property(e => e.Icon).HasMaxLength(100);
    });

        modelBuilder.Entity<UserSites>(entity =>
          {
              entity.HasKey(e => new { e.SiteId, e.UserId }).HasName("PRIMARY");

              entity.ToTable("usersite");

              entity.HasIndex(e => e.UserId, "UserID_idx");

              entity.Property(e => e.SiteId)
                  .HasColumnType("int(11)")
                  .HasColumnName("SiteId");

              entity.Property(e => e.UserId)
                  .HasMaxLength(100)
                  .UseCollation("utf8mb4_general_ci")
                  .HasCharSet("utf8mb4")
                  .HasColumnName("UserId");

              entity.HasOne(d => d.Site)
                  .WithMany(p => p.UserSites)
                  .HasForeignKey(d => d.SiteId)
                  .OnDelete(DeleteBehavior.ClientSetNull)
                  .HasConstraintName("SiteID");

              entity.HasOne(d => d.User)
                  .WithMany(p => p.UserSites)
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.ClientSetNull)
                  .HasConstraintName("UserID");


          });
        modelBuilder.Entity<Rolenavigation>(entity =>
               {
                   entity.HasKey(e => e.Id).HasName("PRIMARY");

                   entity
                       .ToTable("rolenavigation")
                       .HasCharSet("utf8mb4")
                       .UseCollation("utf8mb4_general_ci");

                   entity.HasIndex(e => e.NavigationItemId, "NavigationItemId");

                   entity.HasIndex(e => e.RoleId, "RoleId");

                   entity.Property(e => e.Id).HasColumnType("int(11)");
                   entity.Property(e => e.NavigationItemId).HasColumnType("int(11)");
                   entity.Property(e => e.RoleId).HasMaxLength(100);

                   entity.HasOne(d => d.NavigationItem).WithMany(p => p.Rolenavigations)
                       .HasForeignKey(d => d.NavigationItemId)
                       .OnDelete(DeleteBehavior.ClientSetNull)
                       .HasConstraintName("rolenavigation_ibfk_1");

                   entity.HasOne(d => d.Role).WithMany(p => p.Rolenavigations)
                       .HasForeignKey(d => d.RoleId)
                       .OnDelete(DeleteBehavior.ClientSetNull)
                       .HasConstraintName("rolenavigation_ibfk_2");
               });
        modelBuilder.Entity<Devicemanufacturer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("devicemanufacturer");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(45);
        });

        modelBuilder.Entity<Devicemodel>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("devicemodel");

            entity.HasIndex(e => e.DevicemanufacturerId, "deviceModel_deviceManufaturer_idx");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.DevicemanufacturerId)
                .HasColumnType("int(11)")
                .HasColumnName("DevicemanufacturerID");
            entity.Property(e => e.Name)
                .HasMaxLength(45)
                .HasColumnName("name");

            entity.HasOne(d => d.Devicemanufacturer).WithMany(p => p.Devicemodels)
                .HasForeignKey(d => d.DevicemanufacturerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("deviceModel_deviceManufaturer");
        });

        modelBuilder.Entity<Devicetype>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("devicetype");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.Name).HasMaxLength(45);
        });



      modelBuilder.Entity<Employee>(entity =>
{
    entity.HasKey(e => e.Id).HasName("PRIMARY");
    entity.HasIndex(e => e.CreatedBy, "Employee_user_idx");
    entity.HasIndex(e => e.ModifiedBy, "Employe_modifyUser_idx");

    entity.ToTable("employee");

    entity.HasIndex(e => e.SiteId, "Employee_site_idx");

    entity.HasIndex(e => e.NationalId, "NationalID_UNIQUE").IsUnique();

    entity.Property(e => e.Id)
        .HasColumnType("int(11)")
        .HasColumnName("id");
    entity.Property(e => e.EmployeeWorkNo)
        .HasMaxLength(45)
        .HasDefaultValueSql("'New'");
    entity.Property(e => e.EmployeephoneNumber)
        .HasMaxLength(45)
        .HasDefaultValueSql("'0700000000'")
        .HasColumnName("employeephoneNumber");
    entity.Property(e => e.Employeestatus)
        .HasMaxLength(45)
        .HasColumnName("employeestatus");
    entity.Property(e => e.FullName)
        .HasMaxLength(45)
        .HasDefaultValueSql("'Employee Name'");
    entity.Property(e => e.NationalId)
        .HasColumnType("bigint(20)")
        .HasColumnName("NationalID");
    entity.Property(e => e.SiteId)
        .HasColumnType("int(11)")
        .HasColumnName("SiteID");
    entity.Property(e => e.IsModified)
      .HasDefaultValueSql("'0'")
      .HasColumnType("tinyint(4)");

    entity.Property(e => e.DateCreated)
     .IsRequired()
    .HasColumnType("datetime");

    entity.Property(e => e.DateModified)
        .HasColumnType("datetime");

    entity.Property(e => e.CreatedBy)
        .HasMaxLength(100)
        .UseCollation("utf8mb4_general_ci")
        .HasCharSet("utf8mb4");

    entity.Property(e => e.ModifiedBy)
       .HasMaxLength(100)
       .UseCollation("utf8mb4_general_ci")
       .HasCharSet("utf8mb4");


    entity.HasOne(d => d.Site).WithMany(p => p.Employees)
        .HasForeignKey(d => d.SiteId)
        .HasConstraintName("Employee_site");
    entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.EmployeeCreatedByNavigations)
        .HasForeignKey(d => d.CreatedBy)
        .HasConstraintName("Employee_Createuser");

    entity.HasOne(d => d.ModifiedByNavigation).WithMany(p => p.EmployeeModifiedByNavigations)
        .HasForeignKey(d => d.ModifiedBy)
        .HasConstraintName("Employe_modifyUser");

});
        modelBuilder.Entity<Tankstock>(entity =>
            {
                entity.HasKey(e => e.EntryId).HasName("PRIMARY");

                entity.ToTable("tankstock");

                entity.HasIndex(e => e.TankId, "TankID_idx");

                entity.HasIndex(e => e.RecordedBy, "TankStock_User_idx");

                entity.HasIndex(e => e.SiteId, "TankStock_site_idx");

                entity.Property(e => e.EntryId)
                    .HasColumnType("int(11)")
                    .HasColumnName("EntryID");
                entity.Property(e => e.EntryType).HasMaxLength(45);
                entity.Property(e => e.ManualDeliveryAmount).HasPrecision(10, 2);
                entity.Property(e => e.ManualEndLevel).HasPrecision(10, 2);
                entity.Property(e => e.ManualStartLevel).HasPrecision(10, 2);
                entity.Property(e => e.RecordedBy)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                entity.Property(e => e.SensorDeliveryAmount).HasPrecision(10, 2);
                entity.Property(e => e.SensorEndLevel).HasPrecision(10, 2);
                entity.Property(e => e.SensorStartLevel).HasPrecision(10, 2);
                entity.Property(e => e.SiteId).HasColumnType("int(11)");
                entity.Property(e => e.TankId)
                    .HasColumnType("int(11)")
                    .HasColumnName("TankID");
                entity.Property(e => e.Product).HasMaxLength(45);
                entity.Property(e => e.DeliveryTemperature).HasPrecision(10, 2);
                entity.Property(e => e.DeliveryDensity).HasPrecision(10, 2);
                entity.Property(e => e.DeliveryMass).HasPrecision(10, 2);

                entity.HasOne(d => d.RecordedByNavigation).WithMany(p => p.Tankstocks)
                    .HasForeignKey(d => d.RecordedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("TankStock_User");

                entity.HasOne(d => d.Site).WithMany(p => p.Tankstocks)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("TankStock_site");

                entity.HasOne(d => d.Tank).WithMany(p => p.Tankstocks)
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("TankStock_TankID");
            });

        modelBuilder.Entity<Expectedaverage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("expectedaverage");

            entity.HasIndex(e => e.ExpectedAverageClassificationId, "Expected_classification_idx");

            entity.HasIndex(e => e.VehicleId, "Expected_vehicle_idx");

            entity.HasIndex(e => e.SiteId, "Site_idx");

            entity.HasIndex(e => new { e.VehicleId, e.SiteId, e.ExpectedAverageClassificationId }, "UniqueRecord").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.ExpectedAverageClassificationId)
                .HasColumnType("int(11)")
                .HasColumnName("ExpectedAverageClassificationID");
            entity.Property(e => e.ExpectedAverageValue).HasPrecision(5, 2);
            entity.Property(e => e.SiteId)
                .HasColumnType("int(11)")
                .HasColumnName("SiteID");
            entity.Property(e => e.VehicleId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleID");

            entity.HasOne(d => d.ExpectedAverageClassification).WithMany(p => p.Expectedaverages)
                .HasForeignKey(d => d.ExpectedAverageClassificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Expected_classification");

            entity.HasOne(d => d.Site).WithMany(p => p.Expectedaverages)
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Expected_site");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.Expectedaverages)
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Expected_vehicle");
        });

        modelBuilder.Entity<Expectedaverageclassification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("expectedaverageclassification");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.IskmperLiter).HasColumnType("tinyint(4)");
            entity.Property(e => e.Name).HasMaxLength(545);
        });

        modelBuilder.Entity<Fuelrefil>(entity =>
       {
           entity.HasKey(e => e.Id).HasName("PRIMARY");

           entity.ToTable("fuelrefil");

           entity.HasIndex(e => e.DriverId, "FuelRefil_Driver_idx");

           entity.HasIndex(e => e.PumpTranscationId, "FuelRefil_PumpTransaction_idx");

           entity.HasIndex(e => e.FuelBy, "FuelRefil_User_idx");

           entity.HasIndex(e => e.SiteId, "FuelRefil_site_idx");

           entity.HasIndex(e => e.VehicleId, "fuelRefil_vehilce_idx");
           entity.HasIndex(e => e.TankId, "FuelRefill_tank_idx");

           entity.Property(e => e.Id)
               .HasColumnType("int(11)")
               .HasColumnName("ID");
               entity.Property(e=>e.IsModified).HasColumnType("tinyint(4)").HasDefaultValue(false);
               entity.Property(e=>e.DateCreated).HasColumnName("DateCreated");

           entity.Property(e => e.Comment).HasMaxLength(500);
           entity.Property(e => e.CurrentMeterReading).HasColumnType("int(11)");
           entity.Property(e => e.DriverId)
               .HasColumnType("int(11)")
               .HasColumnName("DriverID");
           entity.Property(e => e.FuelBy)
               .HasMaxLength(100)
               .UseCollation("utf8mb4_general_ci")
               .HasCharSet("utf8mb4");
           entity.Property(e => e.ManualFuelrefilAmount).HasPrecision(10);
           entity.Property(e => e.PreviousMeterReading).HasColumnType("int(11)");
           entity.Property(e => e.PumpTranscationId)
               .HasColumnType("int(11)")
               .HasColumnName("PumpTranscationID");
           entity.Property(e => e.SiteId)
               .HasColumnType("int(11)")
               .HasColumnName("SiteID");
           entity.Property(e => e.VehicleId)
               .HasColumnType("int(11)")
               .HasColumnName("vehicleID");
           entity.Property(e => e.TankId)
           .HasColumnType("int(11)")
                .HasColumnName("TankID");

                

           entity.HasOne(d => d.Driver).WithMany(p => p.Fuelrefils)
               .HasForeignKey(d => d.DriverId)
               .HasConstraintName("FuelRefil_Driver");

           entity.HasOne(d => d.FuelByNavigation).WithMany(p => p.Fuelrefils)
               .HasForeignKey(d => d.FuelBy)
               .OnDelete(DeleteBehavior.ClientSetNull)
               .HasConstraintName("FuelRefi_Fuelby");

           entity.HasOne(d => d.PumpTranscation).WithMany(p => p.Fuelrefils)
               .HasForeignKey(d => d.PumpTranscationId)
               .HasConstraintName("FuelRefil_PumpTransaction");

           entity.HasOne(d => d.Site).WithMany(p => p.Fuelrefils)
               .HasForeignKey(d => d.SiteId)
               .OnDelete(DeleteBehavior.ClientSetNull)
               .HasConstraintName("fuelRefil_Site");

           entity.HasOne(d => d.Vehicle).WithMany(p => p.Fuelrefils)
               .HasForeignKey(d => d.VehicleId)
               .OnDelete(DeleteBehavior.ClientSetNull)
               .HasConstraintName("fuelRefil_vehicle");

           entity.HasOne(d => d.Tank).WithMany(p => p.Fuelrefils)
               .HasForeignKey(d => d.TankId)
               .OnDelete(DeleteBehavior.ClientSetNull)
               .HasConstraintName("FuelRefill_tank");
           
       });

        modelBuilder.Entity<Fuelreportgenerate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("fuelreportgenerate");

            entity.HasIndex(e => e.ApprovedBy, "fuelregenrate_user_idx");

            entity.HasIndex(e => e.CreatedBy, "fuelregenrate_user_idx1");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)");
            entity.Property(e => e.ApprovedBy).HasMaxLength(100);
            entity.Property(e => e.CreatedBy).HasMaxLength(100);
            entity.Property(e => e.ModfifiedBy).HasMaxLength(100);
        });

        modelBuilder.Entity<Intankdelivery>(entity =>
        {
            entity.HasKey(e => e.DeliveryId).HasName("PRIMARY");

            entity.ToTable("intankdelivery");

            entity.Property(e => e.DeliveryId).HasColumnType("int(11)");
            entity.Property(e => e.AbsoluteProductTcvolume).HasColumnName("AbsoluteProductTCVolume");
            entity.Property(e => e.ConfigurationId).HasMaxLength(8);
            entity.Property(e => e.EndProductTcvolume).HasColumnName("EndProductTCVolume");
            entity.Property(e => e.FuelGradeId).HasColumnType("int(11)");
            entity.Property(e => e.FuelGradeName).HasMaxLength(20);
            entity.Property(e => e.PacketId)
                .HasColumnType("int(11)")
                .HasColumnName("PacketID");
            entity.Property(e => e.Ptsid)
                .HasMaxLength(23)
                .HasColumnName("PTSId");
            entity.Property(e => e.StartProductTcvolume).HasColumnName("StartProductTCVolume");
            entity.Property(e => e.Tank).HasColumnType("int(11)");
        });

        modelBuilder.Entity<Issueassignmenttracker>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("issueassignmenttracker");

            entity.HasIndex(e => e.AssignedTo, "AssigneTo_idx");

            entity.HasIndex(e => e.AssignedFrom, "AssignedFrom_idx");

            entity.HasIndex(e => e.Issue, "Assigned_issue_idx");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.AssignedFrom)
                .HasMaxLength(100)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");
            entity.Property(e => e.AssignedTo)
                .HasMaxLength(100)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");
            entity.Property(e => e.Issue).HasColumnType("int(11)");

            entity.HasOne(d => d.AssignedFromNavigation).WithMany(p => p.IssueassignmenttrackerAssignedFromNavigations)
                .HasForeignKey(d => d.AssignedFrom)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("assigned_user_From");

            entity.HasOne(d => d.AssignedToNavigation).WithMany(p => p.IssueassignmenttrackerAssignedToNavigations)
                .HasForeignKey(d => d.AssignedTo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Assigned_Issue_To");

            entity.HasOne(d => d.IssueNavigation).WithMany(p => p.Issueassignmenttrackers)
                .HasForeignKey(d => d.Issue)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Assigned_issue");
        });

        modelBuilder.Entity<Issuecategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("issuecategory");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.Description).HasMaxLength(945);
            entity.Property(e => e.Name).HasMaxLength(45);
        });

        modelBuilder.Entity<Issuepriority>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("issuepriority");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(45);
        });

        modelBuilder.Entity<Issuestatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("issuestatus", tb => tb.HasComment("		"));

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.Status)
                .HasMaxLength(45)
                .HasColumnName("status");
        });

        modelBuilder.Entity<Issuetracker>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("issuetracker", tb => tb.HasComment("		"));

            entity.HasIndex(e => e.Priority, "Issue_tracker_issuepriorty_idx");

            entity.HasIndex(e => e.AssignTo, "Issue_user_idx");

            entity.HasIndex(e => e.Status, "Issuetracker_status_idx");

            entity.HasIndex(e => e.DeviceType, "Isuse_deviceType_idx");

            entity.HasIndex(e => e.IssueCategoryId, "issetracker_issueID_idx");

            entity.HasIndex(e => e.VehicleId, "issue_vehicle_idx");

            entity.HasIndex(e => e.SiteId, "issuetracker_site_idx");

            entity.HasIndex(e => e.Openby, "openby_idx");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.AssignTo)
                .HasMaxLength(100)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");
            entity.Property(e => e.ClosingDate).HasColumnName("closingDate");
            entity.Property(e => e.DeviceId)
                .HasColumnType("int(11)")
                .HasColumnName("DeviceID");
            entity.Property(e => e.DeviceType).HasColumnType("int(11)");
            entity.Property(e => e.DueDate).HasColumnName("dueDate");
            entity.Property(e => e.IssueCategoryId)
                .HasColumnType("int(11)")
                .HasColumnName("IssueCategoryID");
            entity.Property(e => e.OpenDate).HasColumnName("openDate");
            entity.Property(e => e.Openby)
                .HasMaxLength(100)
                .HasColumnName("openby")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");
            entity.Property(e => e.Priority)
                .HasColumnType("int(11)")
                .HasColumnName("priority");
            entity.Property(e => e.ProblemDescription)
                .HasMaxLength(945)
                .HasColumnName("problemDescription");
            entity.Property(e => e.ProblemTitle)
                .HasMaxLength(45)
                .HasColumnName("problemTitle");
            entity.Property(e => e.RelatedIssue)
                .HasColumnType("int(11)")
                .HasColumnName("relatedIssue");
            entity.Property(e => e.SiteId)
                .HasColumnType("int(11)")
                .HasColumnName("siteID");
            entity.Property(e => e.Status)
                .HasColumnType("int(11)")
                .HasColumnName("status");
            entity.Property(e => e.VehicleId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleID");

            entity.HasOne(d => d.AssignToNavigation).WithMany(p => p.IssuetrackerAssignToNavigations)
                .HasForeignKey(d => d.AssignTo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Issue_user");

            entity.HasOne(d => d.DeviceTypeNavigation).WithMany(p => p.Issuetrackers)
                .HasForeignKey(d => d.DeviceType)
                .HasConstraintName("Isuse_deviceType");

            entity.HasOne(d => d.IssueCategory).WithMany(p => p.Issuetrackers)
                .HasForeignKey(d => d.IssueCategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("issuetrcker_issuecategoryID");

            entity.HasOne(d => d.OpenbyNavigation).WithMany(p => p.IssuetrackerOpenbyNavigations)
                .HasForeignKey(d => d.Openby)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("issue_ser");

            entity.HasOne(d => d.PriorityNavigation).WithMany(p => p.Issuetrackers)
                .HasForeignKey(d => d.Priority)
                .HasConstraintName("Issue_tracker_issuepriorty");

            entity.HasOne(d => d.Site).WithMany(p => p.Issuetrackers)
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("issuetracker_site");

            entity.HasOne(d => d.StatusNavigation).WithMany(p => p.Issuetrackers)
                .HasForeignKey(d => d.Status)
                .HasConstraintName("Issuetracker_status");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.Issuetrackers)
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("issue_vehicle");
        });

        modelBuilder.Entity<Loginactivity>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("loginactivities")
                .HasCharSet("utf8mb4")
                .UseCollation("utf8mb4_general_ci");

            entity.HasIndex(e => e.UserId, "FK_LoginActivities_Users");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.IpAddress).HasMaxLength(100);
            entity.Property(e => e.UserId).HasMaxLength(100);

            entity.HasOne(d => d.User).WithMany(p => p.Loginactivities)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_LoginActivities_Users");
        });

        modelBuilder.Entity<Permission>(entity =>
    {
        entity.HasKey(e => e.Id).HasName("PRIMARY");

        entity
            .ToTable("permissions")
            .HasCharSet("utf8mb4")
            .UseCollation("utf8mb4_general_ci");

        entity.HasIndex(e => e.ParentId, "FK_Permissions_Parent");

        entity.Property(e => e.Id).HasColumnType("int(11)");
        entity.Property(e => e.Name).HasMaxLength(100);
        entity.Property(e => e.ParentId).HasColumnType("int(11)");

        entity.HasOne(e => e.Parent)
           .WithMany(p => p.InverseParent)
           .HasForeignKey(e => e.ParentId)
           .OnDelete(DeleteBehavior.ClientSetNull)
           .HasConstraintName("FK_Permissions_Parent");
    });

        modelBuilder.Entity<Ptsdevice>(entity =>
        {
            entity.HasKey(e => e.Ptsid).HasName("PRIMARY");

            entity.ToTable("ptsdevice");

            entity.HasIndex(e => e.Site, "PTSDevice_site_idx");

            entity.Property(e => e.Ptsid)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("PTSId");
            entity.Property(e => e.AuthenticationType).HasMaxLength(45);
            entity.Property(e => e.Ipaddress)
                .HasMaxLength(100)
                .HasColumnName("IPAddress");
            entity.Property(e => e.Login).HasMaxLength(145);
            entity.Property(e => e.Password).HasMaxLength(1045);
            entity.Property(e => e.PortNumber).HasColumnType("int(11)");
            entity.Property(e => e.ProtocolSecurityType).HasMaxLength(145);
            entity.Property(e => e.Site).HasColumnType("int(11)");

            entity.HasOne(d => d.SiteNavigation).WithMany(p => p.Ptsdevices)
                .HasForeignKey(d => d.Site)
                .HasConstraintName("PTSDevice_site");
        });

        modelBuilder.Entity<Pumptransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("pumptransaction");

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Amount).HasPrecision(10);
            entity.Property(e => e.ConfigurationId).HasMaxLength(45);
            entity.Property(e => e.FuelGradeId).HasColumnType("int(11)");
            entity.Property(e => e.FuelGradeName).HasMaxLength(45);
            entity.Property(e => e.Nozzle).HasColumnType("int(11)");
            entity.Property(e => e.PacketId).HasColumnType("int(11)");
            entity.Property(e => e.Price).HasPrecision(10);
            entity.Property(e => e.PtsId).HasMaxLength(45);
            entity.Property(e => e.Pump).HasColumnType("int(11)");
            entity.Property(e => e.Tag).HasMaxLength(45);
            entity.Property(e => e.Tcvolume)
                .HasPrecision(10)
                .HasColumnName("TCVolume");
            entity.Property(e => e.TotalAmount).HasPrecision(10);
            entity.Property(e => e.TotalVolume).HasPrecision(10);
            entity.Property(e => e.Transaction).HasColumnType("int(11)");
            entity.Property(e => e.UserId).HasColumnType("int(11)");
            entity.Property(e => e.Volume).HasPrecision(10);
        });
        modelBuilder.Entity<UserRole>(entity =>
{
    entity.HasKey(e => new { e.UserId, e.RoleId }).HasName("PRIMARY");

    entity.ToTable("userroles")
        .HasCharSet("utf8mb4")
        .UseCollation("utf8mb4_general_ci");

    entity.Property(e => e.UserId).HasMaxLength(100);
    entity.Property(e => e.RoleId).HasMaxLength(100);

    entity.HasOne(e => e.User)
        .WithMany(u => u.UserRoles)
        .HasForeignKey(e => e.UserId)
        .OnDelete(DeleteBehavior.Cascade)
        .HasConstraintName("FK_UserRoles_Users");

    entity.HasOne(e => e.Role)
        .WithMany(r => r.UserRoles)
        .HasForeignKey(e => e.RoleId)
        .OnDelete(DeleteBehavior.Cascade)
        .HasConstraintName("FK_UserRoles_Roles");
});

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });


            entity.HasOne(rp => rp.Role)
                  .WithMany(r => r.RolePermissions)
                  .HasForeignKey(rp => rp.RoleId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rp => rp.Permission)
                  .WithMany(p => p.RolePermissions)
                  .HasForeignKey(rp => rp.PermissionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("roles")
                .HasCharSet("utf8mb4")
                .UseCollation("utf8mb4_general_ci");

            entity.Property(e => e.Id).HasMaxLength(100);
            entity.Property(e => e.ConcurrencyStamp).HasMaxLength(256);
            entity.Property(e => e.Name).HasMaxLength(256);
            entity.Property(e => e.NormalizedName).HasMaxLength(256);
            entity.Property(e => e.Description).HasMaxLength(256);

            // entity.HasMany(d => d.Permissions).WithMany(p => p.Roles)
            //     .UsingEntity<RolePermission>(
            //         j => j.HasOne(rp => rp.Permission)
            //               .WithMany()
            //               .HasForeignKey(rp => rp.PermissionId)
            //               .HasConstraintName("FK_RolePermissions_Permissions"),
            //         j => j.HasOne(rp => rp.Role)
            //               .WithMany()
            //               .HasForeignKey(rp => rp.RoleId)
            //               .HasConstraintName("FK_RolePermissions_Roles"),
            //         j =>
            //         {
            //             j.HasKey(rp => new { rp.RoleId, rp.PermissionId }).HasName("PRIMARY");
            //             j.ToTable("rolepermissions")
            //              .HasCharSet("utf8mb4")
            //              .UseCollation("utf8mb4_general_ci");
            //             j.HasIndex(rp => rp.PermissionId).HasDatabaseName("FK_RolePermissions_Permissions");
            //             j.Property(rp => rp.RoleId).HasMaxLength(100);
            //             j.Property(rp => rp.PermissionId).HasColumnType("int(11)");
            //         });
        });


        modelBuilder.Entity<Site>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("site", tb => tb.HasComment("			"));

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(45)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("tag");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.DailyFuelLimit).HasPrecision(10, 2);
            entity.Property(e => e.IsEnabled).HasDefaultValueSql("'1'");
            entity.Property(e => e.MonthlyFuelLimit).HasPrecision(10);
            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasMany(d => d.Vehicles).WithMany(p => p.Tags)
                .UsingEntity<Dictionary<string, object>>(
                    "TagVehicle",
                    r => r.HasOne<Vehicle>().WithMany()
                        .HasForeignKey("VehicleId")
                        .HasConstraintName("tag_vehicle_vehicle"),
                    l => l.HasOne<Tag>().WithMany()
                        .HasForeignKey("TagId")
                        .HasConstraintName("tag_vehicle_tag"),
                    j =>
                    {
                        j.HasKey("TagId", "VehicleId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("tag_vehicle");
                        j.HasIndex(new[] { "VehicleId" }, "tag_vehicle_vehicle_idx");
                        j.IndexerProperty<int>("TagId")
                            .HasColumnType("int(11)")
                            .HasColumnName("tag_id");
                        j.IndexerProperty<int>("VehicleId")
                            .HasColumnType("int(11)")
                            .HasColumnName("vehicle_id");
                    });
        });

        modelBuilder.Entity<Tank>(entity =>
           {
               entity.ToTable("tank");

               entity.HasKey(e => e.Id);

               entity.Property(e => e.Id).HasColumnType("int(11)").ValueGeneratedOnAdd().HasColumnName("Id");

               entity.Property(e => e.Name).IsRequired().HasMaxLength(45).HasColumnName("Name");

               entity.Property(e => e.TankVolume).HasPrecision(10, 0).IsRequired().HasColumnName("TankVolume");

               entity.Property(e => e.TankHeight).HasPrecision(10, 0).HasColumnName("TankHeight");

               entity.Property(e => e.PtsId).HasColumnType("int(11)").HasColumnName("ptsID");

               entity.Property(e => e.SiteId).HasColumnType("int(11)").IsRequired().HasColumnName("SiteID");

               entity.Property(e => e.TankLength)
                   .HasPrecision(10, 0)
                   .HasColumnName("TankLength");

               entity.HasIndex(e => e.SiteId)
                   .HasDatabaseName("Tank_site_idx");

               entity.HasIndex(e => e.PtsId)
                   .HasDatabaseName("Tank_PtsID_idx");

               entity.HasOne(d => d.Site)
                   .WithMany(p => p.Tanks)
                   .HasForeignKey(d => d.SiteId)
                   .HasConstraintName("Tank_site")
                   .OnDelete(DeleteBehavior.NoAction);

               entity.HasOne(d => d.PtsDevice)
                   .WithMany(p => p.Tanks)
                   .HasForeignKey(d => d.PtsId)
                   .HasConstraintName("Tank_PtsID")
                   .OnDelete(DeleteBehavior.NoAction);
           });


        modelBuilder.Entity<Tankmeasurement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("tankmeasurement");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.ConfigurationId).HasMaxLength(45);
            entity.Property(e => e.FuelGradeId).HasColumnType("int(11)");
            entity.Property(e => e.PacketId).HasColumnType("int(11)");
            entity.Property(e => e.ProductTcvolume).HasColumnName("ProductTCVolume");
            entity.Property(e => e.Ptsid).HasColumnName("PTSId");
            entity.Property(e => e.Status).HasMaxLength(45);
            entity.Property(e => e.Tank).HasColumnType("int(11)");
            entity.Property(e => e.TankFillingPercentage).HasColumnType("int(11)");
            entity.Property(e => e.WaterHeight).HasColumnName("waterHeight");

            entity.HasMany(d => d.Alarms).WithMany(p => p.TankMeasurements)
                .UsingEntity<Dictionary<string, object>>(
                    "AlarmTankmeasurement",
                    r => r.HasOne<Alarm>().WithMany()
                        .HasForeignKey("AlarmId")
                        .HasConstraintName("alarmmeasurement_alarm"),
                    l => l.HasOne<Tankmeasurement>().WithMany()
                        .HasForeignKey("TankMeasurementId")
                        .HasConstraintName("alarmMeasurement_tankmeasurement"),
                    j =>
                    {
                        j.HasKey("TankMeasurementId", "AlarmId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("alarm_tankmeasurement");
                        j.HasIndex(new[] { "TankMeasurementId" }, "alarmMeasurement_tankmeasurement_idx");
                        j.HasIndex(new[] { "AlarmId" }, "alarmmeasurement_alarm_idx");
                        j.IndexerProperty<int>("TankMeasurementId")
                            .HasColumnType("int(11)")
                            .HasColumnName("tankMeasurementID");
                        j.IndexerProperty<int>("AlarmId")
                            .HasColumnType("int(11)")
                            .HasColumnName("alarmID");
                    });
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");
            entity.HasIndex(e => e.UserName, "UserName_UNIQUE").IsUnique();

            entity
                .ToTable("user")
                .HasCharSet("utf8mb4")
                .UseCollation("utf8mb4_general_ci");

            entity.Property(e => e.Id).HasMaxLength(100);
            entity.Property(e => e.AccessFailedCount).HasColumnType("int(11)");
            entity.Property(e => e.ConcurrencyStamp).HasMaxLength(256);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.PasswordHash).HasMaxLength(256);
            entity.Property(e => e.PhoneNumber).HasMaxLength(256);
            entity.Property(e => e.SecurityStamp).HasMaxLength(256);
            entity.Property(e => e.UserName).HasMaxLength(100);
            entity.Property(e => e.IsDeleted).HasColumnType("tinyint(1)").HasDefaultValue(false);
            // entity.HasMany(d => d.Roles).WithMany(p => p.Users)
            //    .UsingEntity<Dictionary<string, object>>(
            //              "Userrole",
            //     r => r.HasOne<Role>().WithMany()
            //     .HasForeignKey("RoleId")
            //     .HasConstraintName("FK_UserRoles_Roles"),
            //     l => l.HasOne<User>().WithMany()
            //     .HasForeignKey("UserId")
            //     .HasConstraintName("FK_UserRoles_Users"),
            //     j =>
            //     {
            //      j.HasKey("UserId", "RoleId")
            //      .HasName("PRIMARY")
            //      .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
            //      j.ToTable("userroles")
            //       .HasCharSet("utf8mb4")
            //       .UseCollation("utf8mb4_general_ci");
            //      j.HasIndex(new[] { "RoleId" }, "FK_UserRoles_Roles");
            //      j.IndexerProperty<string>("UserId").HasMaxLength(100);
            //      j.IndexerProperty<string>("RoleId").HasMaxLength(100);
            //  });
        });


        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.VehicleId).HasName("PRIMARY");

            entity.ToTable("vehicle");

            entity.HasIndex(e => e.HyoungNo, "HyoungNo_UNIQUE").IsUnique();

            entity.HasIndex(e => e.DeviceId, "Vehicle_Device_idx");

            entity.HasIndex(e => e.DefaultEmployeeId, "Vehicle_employee_idx");

            entity.HasIndex(e => e.DefaultExptdAvgid, "vehicle_expectedAvg_idx");

            entity.HasIndex(e => e.VehicleManufacturerId, "vehicle_manufacturer_idx");

            entity.HasIndex(e => e.VehicleModelId, "vehicle_model_idx");

            entity.HasIndex(e => e.WorkingSiteId, "vehicle_site_idx");

            entity.HasIndex(e => e.VehicleTypeId, "vehicle_vehicleType_idx");

            entity.Property(e => e.VehicleId)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("vehicleID");
            entity.Property(e => e.AverageKmL).HasColumnName("Average_km_l");
            entity.Property(e => e.Capacity).HasMaxLength(45);
            entity.Property(e => e.CurrentPhysicalReading).HasMaxLength(45);
            entity.Property(e => e.DefaultEmployeeId)
                .HasColumnType("int(11)")
                .HasColumnName("DefaultEmployeeID");
            entity.Property(e => e.DefaultExptdAvgid)
                .HasColumnType("int(11)")
                .HasColumnName("DefaultExptdAVGId");
            entity.Property(e => e.DeviceId)
                .HasColumnType("int(11)")
                .HasColumnName("DeviceID");
            entity.Property(e => e.ExcessWorkingHrCost).HasPrecision(10);
            entity.Property(e => e.GpsgategeneratedId)
                .HasColumnType("tinyint(4)")
                .HasColumnName("GPSGATEGeneratedID");
            entity.Property(e => e.HyoungNo).HasMaxLength(45);
            entity.Property(e => e.NumberPlate).HasMaxLength(45);
            entity.Property(e => e.VehicleManufacturerId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleManufacturerID");
            entity.Property(e => e.VehicleModelId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleModelID");
            entity.Property(e => e.VehicleTypeId)
                .HasDefaultValueSql("'1'")
                .HasColumnType("int(11)")
                .HasColumnName("VehicleTypeID");
            entity.Property(e => e.WorkingSiteId)
                .HasColumnType("int(11)")
                .HasColumnName("WorkingSiteID");
            entity.Property(e => e.Yom)
                .HasMaxLength(45)
                .HasColumnName("YOM");

            entity.HasOne(d => d.DefaultEmployee).WithMany(p => p.VehiclesNavigation)
                .HasForeignKey(d => d.DefaultEmployeeId)
                .HasConstraintName("Vehicle_employee");

            entity.HasOne(d => d.DefaultExptdAvg).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.DefaultExptdAvgid)
                .HasConstraintName("vehicle_expectedAvg");

            entity.HasOne(d => d.Device).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.DeviceId)
                .HasConstraintName("Vehicle_Device");

            entity.HasOne(d => d.VehicleManufacturer).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.VehicleManufacturerId)
                .HasConstraintName("vehicle_manufacturer");

            entity.HasOne(d => d.VehicleModel).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.VehicleModelId)
                .HasConstraintName("vehicle_model");

            entity.HasOne(d => d.VehicleType).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.VehicleTypeId)
                .HasConstraintName("vehicle_vehicleType");

            entity.HasOne(d => d.WorkingSite).WithMany(p => p.Vehicles)
                .HasForeignKey(d => d.WorkingSiteId)
                .HasConstraintName("vehicle_site");

            entity.HasMany(d => d.Employees).WithMany(p => p.Vehicles)
                .UsingEntity<Dictionary<string, object>>(
                    "Employeevehicle",
                    r => r.HasOne<Employee>().WithMany()
                        .HasForeignKey("EmployeeId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("EmployeeID"),
                    l => l.HasOne<Vehicle>().WithMany()
                        .HasForeignKey("VehicleId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("VehicleID"),
                    j =>
                    {
                        j.HasKey("VehicleId", "EmployeeId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("employeevehicles");
                        j.HasIndex(new[] { "EmployeeId" }, "EmployeeID_idx");
                        j.IndexerProperty<int>("VehicleId")
                            .HasColumnType("int(11)")
                            .HasColumnName("VehicleID");
                        j.IndexerProperty<int>("EmployeeId")
                            .HasColumnType("int(11)")
                            .HasColumnName("EmployeeID");
                    });
        });

        modelBuilder.Entity<Vehicleconsumption>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("vehicleconsumption");

            entity.HasIndex(e => new { e.VehicleId, e.Date, e.IsNightShift }, "vehicle_date_shift_unique").IsUnique();

            entity.HasIndex(e => e.EmployeeId, "vehicleconsumption_employee_idx");

            entity.HasIndex(e => e.SiteId, "vehicleconsumption_site_idx");

            entity.HasIndex(e => e.ModifiedBy, "vehicleconsumption_user_idx");

            entity.HasIndex(e => e.ReportId, "vehilceconsumption_fuelreport_idx");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.AvgSpeed).HasPrecision(10, 2);
            entity.Property(e => e.Comments).HasMaxLength(100);
            entity.Property(e => e.EmployeeId)
                .HasDefaultValueSql("'0'")
                .HasColumnType("int(11)")
                .HasColumnName("EmployeeID");
            entity.Property(e => e.EngHours).HasPrecision(10);
            entity.Property(e => e.ExcessWorkingHrsCost).HasPrecision(10);
            entity.Property(e => e.ExpectedConsumption).HasPrecision(10);
            entity.Property(e => e.FlowMeterEffiency).HasPrecision(10);
            entity.Property(e => e.FlowMeterEngineHrs).HasPrecision(10);
            entity.Property(e => e.FlowMeterFuelLost).HasPrecision(10);
            entity.Property(e => e.FlowMeterFuelUsed).HasPrecision(10);
            entity.Property(e => e.FuelEfficiency).HasPrecision(10, 2);
            entity.Property(e => e.FuelLost).HasPrecision(10);
            entity.Property(e => e.IsKmperhr)
                .HasDefaultValueSql("b'0'")
                .HasColumnType("bit(1)");
            entity.Property(e => e.IsModified).HasColumnType("tinyint(4)");
            entity.Property(e => e.IsNightShift)
                .HasDefaultValueSql("b'0'")
                .HasColumnType("bit(1)");
            entity.Property(e => e.MaxSpeed).HasPrecision(10, 2);
            entity.Property(e => e.ModifiedBy).HasColumnType("int(11)");
            entity.Property(e => e.ReportId).HasColumnType("int(11)");
            entity.Property(e => e.SiteId)
                .HasColumnType("int(11)")
                .HasColumnName("SiteID");
            entity.Property(e => e.TotalDistance).HasPrecision(10);
            entity.Property(e => e.TotalFuel).HasPrecision(10);
            entity.Property(e => e.VehicleId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleID");

            entity.HasOne(d => d.Employee).WithMany(p => p.Vehicleconsumptions)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("vehicleconsumption_employee");

            entity.HasOne(d => d.Site).WithMany(p => p.Vehicleconsumptions)
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("vehicleconsumption_site");

            entity.HasOne(d => d.Vehicle).WithMany(p => p.Vehicleconsumptions)
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("vehicleconsumption_vehicle");
        });

        modelBuilder.Entity<Vehiclemanufacturer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("vehiclemanufacturer");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.Name).HasMaxLength(45);
        });

        modelBuilder.Entity<Vehiclemodel>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("vehiclemodel");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.ManufacturerId)
                .HasColumnType("int(11)")
                .HasColumnName("ManufacturerID");
            entity.Property(e => e.Name).HasMaxLength(45);
        });

        modelBuilder.Entity<Vehicletype>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("vehicletype", tb => tb.HasComment("			"));

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(11)")
                .HasColumnName("ID");
            entity.Property(e => e.Abbvr).HasMaxLength(45);
            entity.Property(e => e.Name).HasMaxLength(45);
            entity.Property(e => e.Nothinghere).HasMaxLength(45);
        });

        OnModelCreatingPartial(modelBuilder);

        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted ?? false);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
