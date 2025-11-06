using FMS.Domain.Entities.Features.VehicleManagement;
using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.DataAccess;

/// <summary>
/// Partial class for Vehicle Maintenance entities
/// </summary>
public partial class GpsdataContext
{
    // Vehicle Maintenance Module
    public virtual DbSet<VehicleMaintenance> VehicleMaintenances { get; set; }
    public virtual DbSet<MaintenanceSchedule> MaintenanceSchedules { get; set; }
    public virtual DbSet<MaintenanceIssue> MaintenanceIssues { get; set; }

    partial void OnModelCreatingPartialMaintenance(ModelBuilder modelBuilder)
    {
        // Apply maintenance entity configurations
        modelBuilder.ApplyConfiguration(new FMS.Persistence.EntityConfigurations.VehicleMaintenanceConfiguration());
        modelBuilder.ApplyConfiguration(new FMS.Persistence.EntityConfigurations.MaintenanceScheduleConfiguration());
        modelBuilder.ApplyConfiguration(new FMS.Persistence.EntityConfigurations.MaintenanceIssueConfiguration());
    }
}
