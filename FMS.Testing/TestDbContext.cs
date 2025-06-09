using System;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Domain.Entities.Features.FuelRuleSet;
using Microsoft.EntityFrameworkCore;

namespace FMS.Testing {
    /// <summary>
    /// In-memory database context for unit testing
    /// </summary>
    public class TestDbContext : DbContext {
        public TestDbContext (DbContextOptions options) : base (options) { }

        // Add DbSet properties for entities used in tests
        public virtual DbSet<Tag> Tags { get; set; }
        public virtual DbSet<FuelingRuleSet> FuelingRuleSets { get; set; }
        public virtual DbSet<FuelingRule> FuelingRules { get; set; }
        public virtual DbSet<Employee> Employees { get; set; }
        public virtual DbSet<User> Users { get; set; }
        public virtual DbSet<FuelRefill> Fuelrefils { get; set; }
        //Cursor
        public virtual DbSet<Pumptransaction> Pumptransactions { get; set; }
        //Cursor
        public virtual DbSet<Vehicle> Vehicles { get; set; }
        //Cursor
        public virtual DbSet<Ptsdevice> Ptsdevices { get; set; }

        protected override void OnModelCreating (ModelBuilder modelBuilder) {
            base.OnModelCreating (modelBuilder);

            // Configure Tag entity
            modelBuilder.Entity<Tag> (entity => {
                entity.HasKey (e => e.Id);
                entity.Property (e => e.IsEnabled).HasDefaultValue (true);
                entity.HasOne (e => e.FuelRuleSet)
                    .WithMany (r => r.Tags)
                    .HasForeignKey (e => e.FuelRuleSetId);
            });

            // Configure FuelingRuleSet entity
            modelBuilder.Entity<FuelingRuleSet> (entity => {
                entity.HasKey (e => e.Id);
                entity.HasMany (e => e.Rules)
                    .WithOne (e => e.FuelingRuleSet)
                    .HasForeignKey (e => e.FuelingRuleSetId);
            });

            // Configure FuelingRule and inheritance with TPH
            modelBuilder.Entity<FuelingRule> (entity => {
                entity.HasKey (e => e.Id);
                entity.Property (e => e.IsActive).HasDefaultValue (true);
                entity.HasDiscriminator<string> ("Discriminator")
                    .HasValue<DailyMonthlyLimitRule> ("DailyMonthlyLimit")
                    .HasValue<NoOfRefillRule> ("NoOfRefill");
            });

            // Ignore navigation properties not needed for this test
            modelBuilder.Ignore<Site> ();

            // Configure Vehicle entity
            modelBuilder.Entity<Vehicle> (entity => {
                // Primary key for the Vehicle entity
                entity.HasKey (e => e.VehicleId);

                // Ignore navigation properties not needed for tests
                entity.Ignore (e => e.Tags);
                entity.Ignore (e => e.VehicleType);
                entity.Ignore (e => e.WorkingSite);
                entity.Ignore (e => e.EmployeeVehicles);
                entity.Ignore (e => e.Employees);
                entity.Ignore (e => e.ModifiedByNavigation);
                entity.Ignore (e => e.Fuelrefils);
                entity.Ignore (e => e.VehicleManufacturer);
                entity.Ignore (e => e.VehicleModel);
                entity.Ignore (e => e.DefaultEmployee);
                entity.Ignore (e => e.DefaultExptdAvg);
                entity.Ignore (e => e.Device);
                entity.Ignore (e => e.Expectedaverages);
                entity.Ignore (e => e.Issuetrackers);
                entity.Ignore (e => e.Calibrationdata);
                entity.Ignore (e => e.FuelingRules);
                entity.Ignore (e => e.Vehicleconsumptions);
            });

            // Configure Pumptransaction entity
            modelBuilder.Entity<Pumptransaction> (entity => {
                entity.HasKey (e => e.Id);
                // Ignore navigation properties not needed for tests
                entity.Ignore (e => e.Pts);
                entity.Ignore (e => e.Fuelrefils);
            });

            // Configure Ptsdevice entity
            modelBuilder.Entity<Ptsdevice> (entity => {
                // Primary key for the Ptsdevice entity
                entity.HasKey (e => e.Ptsid);

                // Ignore navigation properties not needed for tests
                entity.Ignore (e => e.Pumptransactions);
                entity.Ignore (e => e.SiteNavigation);
                entity.Ignore (e => e.Configuration);
                entity.Ignore (e => e.Intankdeliveries);
                entity.Ignore (e => e.PtsDevicePendingCommands);
                entity.Ignore (e => e.Tanks);
                entity.Ignore (e => e.DeviceConnections);
            });

            // Configure User entity
            modelBuilder.Entity<User> (entity => {
                entity.HasKey (e => e.Id);

                // Configure relationships with Employee
                entity.HasMany (e => e.EmployeeCreatedByNavigations)
                    .WithOne (e => e.CreatedByNavigation)
                    .HasForeignKey (e => e.CreatedBy);

                entity.HasMany (e => e.EmployeeModifiedByNavigations)
                    .WithOne (e => e.ModifiedByNavigation)
                    .HasForeignKey (e => e.ModifiedBy);

                // Ignore other navigation properties not needed for tests
                entity.Ignore (e => e.UserSites);
                entity.Ignore (e => e.Deliveries);
                entity.Ignore (e => e.Fuelrefils);
                entity.Ignore (e => e.IssueassignmenttrackerAssignedFromNavigations);
                entity.Ignore (e => e.IssueassignmenttrackerAssignedToNavigations);
                entity.Ignore (e => e.IssuetrackerAssignToNavigations);
                entity.Ignore (e => e.IssuetrackerOpenbyNavigations);
                entity.Ignore (e => e.Loginactivities);
                entity.Ignore (e => e.Tankstocks);
                entity.Ignore (e => e.UserActivities);
                entity.Ignore (e => e.UserRoles);
                entity.Ignore (e => e.Roles);
                entity.Ignore (e => e.Sites);
                entity.Ignore (e => e.TankTransfers);
                entity.Ignore (e => e.TankVolumeHistories);
                entity.Ignore (e => e.Vehicles);
                entity.Ignore (e => e.MasterTags);
            });

            // Configure Employee entity
            modelBuilder.Entity<Employee> (entity => {
                entity.HasKey (e => e.Id);

                // Don't ignore CreatedByNavigation and ModifiedByNavigation as they're configured above

                // Ignore other navigation properties not needed for tests
                entity.Ignore (e => e.Site);
                entity.Ignore (e => e.Fuelrefils);
                entity.Ignore (e => e.EmployeeVehicles);
                entity.Ignore (e => e.Vehicles);
            });

            // Configure FuelRefill entity
            modelBuilder.Entity<FuelRefill> (entity => {
                entity.HasKey (e => e.Id);
                // Ignore navigation properties
                entity.Ignore (e => e.Driver);
                entity.Ignore (e => e.Site);
                entity.Ignore (e => e.Tank);
                entity.Ignore (e => e.PumpTranscation);
                entity.Ignore (e => e.FuelByNavigation);
                entity.Ignore (e => e.Vehicle);
                entity.Ignore (e => e.TagNavigation);
            });
        }
    }
}