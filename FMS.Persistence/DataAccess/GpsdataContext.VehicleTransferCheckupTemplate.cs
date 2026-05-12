/**
 * File: GpsdataContext.VehicleTransferCheckupTemplate.cs
 * Purpose: Partial DbContext extension for vehicle transfer checkup template persistence.
 * Dependencies: EF Core, VehicleTransferCheckupTemplate model/configuration
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - VehicleTransferCheckupTemplates DbSet
 * - OnModelCreatingPartial implementation to register template configuration
 */
using FMS.Persistence.EntityConfigurations;
using FMS.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.DataAccess;

public partial class GpsdataContext
{
    public virtual DbSet<VehicleTransferCheckupTemplate> VehicleTransferCheckupTemplates { get; set; }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new VehicleTransferCheckupTemplateConfiguration());
    }
}
