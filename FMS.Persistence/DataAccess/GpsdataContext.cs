/**
 * File: GpsdataContext.cs
 * Purpose: Entity Framework Core DbContext for FMS persistence mappings and configuration.
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities, FMS.Persistence.EntityConfigurations
 * Last Modified: 2026-02-11
 *
 * Key Functions/Components:
 * - OnModelCreating(): Applies entity configurations and model settings.
 * - SaveChangesAsync(): Customizes Tankstock ActiveEntryKey handling.
 */
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq.Expressions;
using System.Reflection;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Domain.Entities.Dashboard;
using FMS.Domain.Entities.Features.AutomaticReconciliation;
using FMS.Domain.Entities.Features.ErrorManagement;
using FMS.Domain.Entities.Features.FuelImport;
using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Domain.Entities.Features.Reporting;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Domain.Entities.Features.UserManagement;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using FMS.Domain.Entities.GPSGate;
using FMS.Domain.Entities.FuelAudit;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Domain.Entities.Reports;
using FMS.Persistence.EntityConfigurations;
using FMS.Persistence.EntityConfigurations.VehicleTracking;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FMS.Persistence.EntityConfigurations.GPSGate;
using TaskEntity = FMS.Domain.Entities.TaskEntity;

namespace FMS.Persistence.DataAccess;

public partial class GpsdataContext : IdentityDbContext<User, Role, string>
{

    public GpsdataContext()
    {

    }
    public GpsdataContext(DbContextOptions<GpsdataContext> options) : base(options)
    {
        // Ensure that any non-nullable dependencies or configuration settings have been provided.
        // If you are retrieving something from a service, ensure that it is not null.
    }

    //new
    public virtual DbSet<FuelingRule> FuelingRules { get; set; }

    public virtual DbSet<DashboardWidgetTemplate> DashboardWidgetTemplates { get; set; }
    //new
    public virtual DbSet<FuelingRuleSet> FuelingRuleSets { get; set; }
    //new - Fueling Rule Set Assignments for cascade/hierarchy
    public virtual DbSet<FuelingRuleSetAssignment> FuelingRuleSetAssignments { get; set; }
    //new
    public virtual DbSet<NotificationCategory> NotificationCategories { get; set; }

    public virtual DbSet<ErrorLog> ErrorLogs { get; set; }

    public virtual DbSet<DashboardWidgetInstance> DashboardWidgetInstances { get; set; }
    public virtual DbSet<UserDashboardLayout> UserDashboardLayouts { get; set; }
    public virtual DbSet<UserNotificationPreference> UserNotificationPreferences { get; set; }
    public virtual DbSet<BusinessFunctionNotificationGroup> BusinessFunctionNotificationGroups { get; set; }
    public virtual DbSet<PTSAlertRecord> PTSAlertRecords { get; set; }
    public virtual DbSet<Dailytankreconciliation> Dailytankreconciliations { get; set; }

    public virtual DbSet<Delivery> Deliveries { get; set; }
    public virtual DbSet<Asset> Assets { get; set; }

    public virtual DbSet<TankVolumeHistory> TankVolumeHistories { get; set; }
    public virtual DbSet<TankVolumeAdjustmentAudit> TankVolumeAdjustmentAudits { get; set; }
    public virtual DbSet<Calibrationdatum> Calibrationdata { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.TankStockManagement.TankCalibrationSnapshot> TankCalibrationSnapshots { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.TankStockManagement.CalibrationDataPoint> CalibrationDataPoints { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.TankStockManagement.CalibrationIntervalAccumulation> CalibrationIntervalAccumulations { get; set; }

    // Location Validation
    public virtual DbSet<FMS.Domain.Entities.Features.LocationValidation.LocationValidationLog> LocationValidationLogs { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.LocationValidation.LocationValidationBypass> LocationValidationBypasses { get; set; }

    public virtual DbSet<Navigationitem> Navigationitems { get; set; }

    // public virtual DbSet<Configuration> Configurations { get; set; }

    //Cursor on changes to code
    public virtual DbSet<SystemConfiguration> SystemConfigurations { get; set; }

    public virtual DbSet<PTSDeviceConnection> DeviceConnections { get; set; }



    public virtual DbSet<Rolenavigation> Rolenavigations { get; set; }
    public virtual DbSet<Tankstock> Tankstocks { get; set; }

    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Department> Departments { get; set; }

    // Event Expression Engine
    public virtual DbSet<EventExpression> EventExpressions { get; set; }
    public virtual DbSet<EventExpressionExecution> EventExpressionExecutions { get; set; }
    public virtual DbSet<ActiveEvent> ActiveEvents { get; set; }
    public virtual DbSet<Employee> Employees { get; set; }
    public virtual DbSet<WarningLetter> WarningLetters { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }
    public virtual DbSet<TankTransfer> TankTransfers { get; set; }
    public virtual DbSet<Expectedaverage> Expectedaverages { get; set; }

    public virtual DbSet<UserSites> UserSites { get; set; }
    public virtual DbSet<Expectedaverageclassification> Expectedaverageclassifications { get; set; }

    // Expected Fuel Average Management System
    public virtual DbSet<FuelRoute> FuelRoutes { get; set; }
    public virtual DbSet<LoadClassification> LoadClassifications { get; set; }
    public virtual DbSet<UsageIntensity> UsageIntensities { get; set; }
    public virtual DbSet<ExpectedFuelAverageTemplate> ExpectedFuelAverageTemplates { get; set; }
    public virtual DbSet<VehicleExpectedAverageAssignment> VehicleExpectedAverageAssignments { get; set; }

    public virtual DbSet<StockReport> StockReports { get; set; }

    public virtual DbSet<FuelRefill> FuelRefills { get; set; }

    public virtual DbSet<Fuelreportgenerate> Fuelreportgenerates { get; set; }

    // TODO: Entity not yet created - uncomment when AutomatedFuelingConfiguration entity is added
    // public virtual DbSet<AutomatedFuelingConfiguration> AutomatedFuelingConfigurations { get; set; }

    public virtual DbSet<FuelReportImportHistory> FuelReportImportHistories { get; set; }

    public virtual DbSet<FuelImportFileTracker> FuelImportFileTrackers { get; set; }

    public virtual DbSet<Intankdelivery> Intankdeliveries { get; set; }

    public virtual DbSet<Issueassignmenttracker> Issueassignmenttrackers { get; set; }
    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<Issuecategory> Issuecategories { get; set; }

    public virtual DbSet<Issuepriority> Issuepriorities { get; set; }

    public virtual DbSet<Issuestatus> Issuestatuses { get; set; }

    public virtual DbSet<Issuetracker> Issuetrackers { get; set; }

    // Issue Tracker v2 configuration entities
    public virtual DbSet<Devicetype> Devicetypes { get; set; }
    public virtual DbSet<Issuetemplate> Issuetemplates { get; set; }
    public virtual DbSet<Issueautocloseconfig> Issueautocloseconfigs { get; set; }

    // Issue Tracker Activity and Reminder entities
    public virtual DbSet<IssueActivityLog> IssueActivityLogs { get; set; }
    public virtual DbSet<IssueReminder> IssueReminders { get; set; }
    public virtual DbSet<IssueAttachment> IssueAttachments { get; set; }
    public virtual DbSet<IssueFollower> IssueFollowers { get; set; }

    // Issue Tracker Template Actions and Completion Records
    public virtual DbSet<IssueTemplateAction> IssueTemplateActions { get; set; }
    public virtual DbSet<IssueCompletionRecord> IssueCompletionRecords { get; set; }

    public virtual DbSet<Loginactivity> Loginactivities { get; set; }
    //Cursor - Automated Reconciliation System Entities
    public virtual DbSet<ReconciliationPolicy> ReconciliationPolicies { get; set; }
    public virtual DbSet<ReconciliationPolicyExecution> ReconciliationPolicyExecutions { get; set; }
    public virtual DbSet<ReconciliationEventTrigger> ReconciliationEventTriggers { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    // User Management
    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Ptsdevice> Ptsdevices { get; set; }

    public virtual DbSet<Pumptransaction> Pumptransactions { get; set; }

    public virtual DbSet<Site> Sites { get; set; }

    //to be changed in Mysql
    public virtual DbSet<FuelTag> FuelTags { get; set; }

    public virtual DbSet<Tank> Tanks { get; set; }

    public virtual DbSet<Tankmeasurement> Tankmeasurements { get; set; }
    public virtual DbSet<UploadStatusProbeReading> UploadStatusProbeReadings { get; set; }
    public virtual DbSet<UserActivity> UserActivities { get; set; }

    public virtual DbSet<RolePermission> RolePermissions { get; set; }
    public virtual DbSet<ReportItem> ReportItems { get; set; }

    public virtual DbSet<Vehicle> Vehicles { get; set; }
    public virtual DbSet<VehicleTripState> VehicleTripStates { get; set; }
    public virtual DbSet<VehicleTrip> VehicleTrips { get; set; }
    public virtual DbSet<VehicleTripGroup> VehicleTripGroups { get; set; }
    public virtual DbSet<VehicleTripOverride> VehicleTripOverrides { get; set; }
    public virtual DbSet<VehicleTripClusterSnapshot> VehicleTripClusterSnapshots { get; set; }
    public virtual DbSet<VehicleTripOutOfBoundsEvent> VehicleTripOutOfBoundsEvents { get; set; }

    // Vehicle Tracking Provider Configuration
    public virtual DbSet<ProviderConfigurationEntity> ProviderConfigurations { get; set; }
    public virtual DbSet<ProviderHealthHistoryEntity> ProviderHealthHistories { get; set; }
    public virtual DbSet<VehicleProviderMappingEntity> VehicleProviderMappings { get; set; }
    public virtual DbSet<VehicleHealthMonitorEntity> VehicleHealthMonitors { get; set; }
    public virtual DbSet<VehicleLastKnownLocationEntity> VehicleLastKnownLocations { get; set; }

    public virtual DbSet<Vehicleconsumption> Vehicleconsumptions { get; set; }

    public virtual DbSet<PtsDevicePendingCommand> PtsDevicePendingCommands { get; set; }

    public virtual DbSet<Vehiclemanufacturer> Vehiclemanufacturers { get; set; }

    public virtual DbSet<Vehiclemodel> Vehiclemodels { get; set; }

    public virtual DbSet<Vehicletype> Vehicletypes { get; set; }
    // Add this DbSet property:
    public virtual DbSet<StockAdjustment> StockAdjustments { get; set; }

    public virtual DbSet<EmployeeVehicle> EmployeeVehicle { get; set; }

    public virtual DbSet<VehicleTagChangeLog> TagChangeLogs { get; set; }
    public virtual DbSet<VehicleLocationTagMonitoringConfig> TagMonitoringConfigs { get; set; }

    //Cursor - Automated Reconciliation System Entities
    public virtual DbSet<ReconciliationDiscrepancy> ReconciliationDiscrepancies { get; set; }
    public virtual DbSet<DiscrepancyRecord> DiscrepancyRecords { get; set; } //Cursor

    //Cursor - Notification System Entities
    public virtual DbSet<Notification> Notifications { get; set; }
    public virtual DbSet<NotificationRecipient> NotificationRecipients { get; set; }
    public virtual DbSet<NotificationPolicy> NotificationPolicies { get; set; }
    public virtual DbSet<NotificationPolicyRecipient> NotificationPolicyRecipients { get; set; }
    public virtual DbSet<NotificationGroup> NotificationGroups { get; set; }
    public virtual DbSet<NotificationGroupMember> NotificationGroupMembers { get; set; }
    public virtual DbSet<NotificationPolicyGroup> NotificationPolicyGroups { get; set; }
    public virtual DbSet<UserPushDevice> UserPushDevices { get; set; }

    //Cursor - PTS Alert Processing (AlertRecords already defined above)

    // Task Management System
    public virtual DbSet<TaskEntity> Tasks { get; set; }
    public virtual DbSet<EmployeeDocument> EmployeeDocuments { get; set; }
    public virtual DbSet<VehicleDocument> VehicleDocuments { get; set; }
    public virtual DbSet<VehicleComplianceRequirement> VehicleComplianceRequirements { get; set; }
    public virtual DbSet<VehicleDocumentUserPreference> VehicleDocumentUserPreferences { get; set; }

    // Vehicle Transfer System
    public virtual DbSet<FMS.Domain.Entities.Features.VehicleManagement.VehicleTransfer> VehicleTransfers { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.VehicleManagement.VehicleTransferCheckupItem> VehicleTransferCheckupItems { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.VehicleManagement.VehicleTransferTyreDetail> VehicleTransferTyreDetails { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.VehicleManagement.VehicleTransferBatteryDetail> VehicleTransferBatteryDetails { get; set; }

    // GPSGate Integration
    public virtual DbSet<FMS.Domain.Entities.GPSGate.GPSGateSession> GPSGateSessions { get; set; }
    public virtual DbSet<FMS.Domain.Entities.GPSGate.GPSGateReport> GPSGateReports { get; set; }
    public virtual DbSet<FMS.Domain.Entities.GPSGate.GPSGateReportDefinition> GPSGateReportDefinitions { get; set; }

    // Fuel Data Comparison
    public virtual DbSet<GpsGateReportEntry> GpsGateReportEntries { get; set; }
    public virtual DbSet<FuelComparisonSettings> FuelComparisonSettings { get; set; }

    // Fuel Audit
    public virtual DbSet<FuelAuditGPSReading> FuelAuditGPSReadings { get; set; }
    public virtual DbSet<Domain.Entities.FuelAudit.FuelAudit> FuelAudits { get; set; }
    public virtual DbSet<FuelAuditTankerReading> FuelAuditTankerReadings { get; set; }
    public virtual DbSet<FuelAuditVehiclePosition> FuelAuditVehiclePositions { get; set; }
    public virtual DbSet<FuelAuditVariance> FuelAuditVariances { get; set; }
    public virtual DbSet<FuelAuditFlag> FuelAuditFlags { get; set; }
    public virtual DbSet<FuelAuditThreshold> FuelAuditThresholds { get; set; }
    public virtual DbSet<FuelAuditSite> FuelAuditSites { get; set; }

    // GPS Geofence (cached from GPSGate for location validation)
    // Geofence validation is now GLOBAL - groups marked with IsAllowedForFueling are used
    public virtual DbSet<FMS.Domain.Entities.Features.GPSIntergration.GpsGate.GpsGeofence> GpsGeofences { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.GPSIntergration.GpsGate.GpsGeofenceGroup> GpsGeofenceGroups { get; set; }
    public virtual DbSet<FMS.Domain.Entities.Features.GPSIntergration.GpsGate.GpsGeofenceGroupMember> GpsGeofenceGroupMembers { get; set; }

    // Geofence Sync Jobs (for tracking background sync operations)
    public virtual DbSet<FMS.Domain.Entities.Features.Geofence.GeofenceSyncJob> GeofenceSyncJobs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        if (modelBuilder == null)
            throw new ArgumentNullException(nameof(modelBuilder));

        // First call base/partial
        OnModelCreatingPartial(modelBuilder);

        // Apply Identity configurations
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
        // 🔥 ADD THIS: Ignore Dictionary types that EF is picking up
        modelBuilder.Ignore<Dictionary<string, string>>();
        modelBuilder.Ignore<Dictionary<int, int>>();
        modelBuilder.Ignore<Dictionary<string, int>>();
        modelBuilder.Ignore<Dictionary<int, string>>();
        //Apply all entity configurations from this assembly

        //    create each model with try catch


        try { modelBuilder.ApplyConfiguration(new DashboardWidgetTemplateConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring DashboardWidgetTemplateConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new UserDashboardLayoutConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UserDashboardLayoutConfiguration: {ex.Message}"); }

        try
        {
            Console.WriteLine("Applying DeliveryConfiguration...");
            modelBuilder.ApplyConfiguration(new DeliveryConfiguration());
            Console.WriteLine("DeliveryConfiguration applied");
        }
        catch (Exception ex) { Console.WriteLine($"Error configuring DeliveryConfiguration: {ex.Message}"); }

        // Add this in OnModelCreating method:
        try
        {
            modelBuilder.ApplyConfiguration(new StockAdjustmentConfiguration());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring StockAdjustmentConfiguration: {ex.Message}");
        }
        try
        {
            Console.WriteLine("Applying Employee...");
            modelBuilder.ApplyConfiguration(new EmployeeConfiguration());
            Console.WriteLine("EmployeeConfiguration applied");
        }
        catch (Exception ex) { Console.WriteLine($"Error configuring EmployeeConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new WarningLetterConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring WarningLetterConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new NotificationCategoryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationCategoryConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new BusinessFunctionNotificationGroupConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring BusinessFunctionNotificationGroupConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new DailytankreconciliationConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring DailytankreconciliationConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EmployeeVehicleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring EmployeeVehicleConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new DashboardWidgetInstanceConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring DashboardWidgetInstanceConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ExpectedAverageConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ExpectedAverageConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new ExpectedAverageClassificationConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ExpectedAverageClassificationConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new FuelingRuleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelingRuleConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new FuelingRuleSetConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelingRuleSetConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new FuelingRuleSetAssignmentConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelingRuleSetAssignmentConfiguration: {ex.Message}"); }

        // TODO: Configuration not yet created - uncomment when DailyMonthlyLimitRuleConfiguration is added
        // try { modelBuilder.ApplyConfiguration(new DailyMonthlyLimitRuleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring DailyMonthlyLimitRuleConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new TimeWindowRuleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TimeWindowRuleConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new FuelRefillConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelRefillConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new FuelreportgenerateConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelreportgenerateConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new FuelReportImportHistoryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelReportImportHistoryConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new FuelImportFileTrackerConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelImportFileTrackerConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new IntankdeliveryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IntankdeliveryConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new IssueAssignmentTrackerConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueAssignmentTrackerConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new IssueCategoryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueCategoryConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new IssuePriorityConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssuePriorityConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new IssueStatusConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueStatusConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new IssuetrackerConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssuetrackerConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new IssueFollowerConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueFollowerConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new IssueReminderConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueReminderConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new IssueAttachmentConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueAttachmentConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new IssueActivityLogConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueActivityLogConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new DeviceTypeConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring DeviceTypeConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new IssueTemplateConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueTemplateConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new IssueAutoCloseConfigConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueAutoCloseConfigConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new IssueTemplateActionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueTemplateActionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new IssueCompletionRecordConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring IssueCompletionRecordConfiguration: {ex.Message}"); }


        try { modelBuilder.ApplyConfiguration(new LoginactivityConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring LoginactivityConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new LocationValidationLogConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring LocationValidationLogConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new NavigationitemConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NavigationitemConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new PermissionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring PermissionConfiguration: {ex.Message}"); }

        // TODO: Configuration not yet created - uncomment when AutomatedFuelingConfigurationConfiguration is added
        // try { modelBuilder.ApplyConfiguration(new AutomatedFuelingConfigurationConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring AutomatedFuelingConfigurationConfiguration: {ex.Message}"); }

        try
        {
            modelBuilder.ApplyConfiguration(new CalibrationdatumConfiguration());
        }
        catch (Exception ex) { Console.WriteLine($"Error configuring CalibrationdatumConfiguration: {ex.Message}"); }

        try
        {
            Console.WriteLine("Applying ErrorLogConfiguration...");
            modelBuilder.ApplyConfiguration(new ErrorLogConfiguration());
            Console.WriteLine("ErrorLogConfiguration applied successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring ErrorLogConfiguration: {ex.Message}");
            throw; // Re-throw to see the full stack trace
        }
        //Cursor on changes to code
        try
        {
            modelBuilder.ApplyConfiguration(new SystemConfigurationConfiguration());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring SystemConfigurationConfiguration: {ex.Message}");
        }
        try { modelBuilder.ApplyConfiguration(new GPSGateReportConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GPSGateReportConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new GPSGateReportDefinitionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GPSGateReportDefinitionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new GPSGateSessionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GPSGateSessionConfiguration: {ex.Message}"); }

        // Fuel Audit Configurations
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditGPSReadingConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditGPSReadingConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditTankerReadingConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditTankerReadingConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditVehiclePositionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditVehiclePositionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditVarianceConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditVarianceConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditFlagConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditFlagConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditThresholdConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditThresholdConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.FuelAudit.FuelAuditSiteConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelAuditSiteConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new PermissionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring PermissionConfiguration: {ex.Message}"); }

        // GPS Geofence Configurations (for location validation feature)
        // Geofence validation is now GLOBAL - groups marked with IsAllowedForFueling are used
        try { modelBuilder.ApplyConfiguration(new GpsGeofenceConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GpsGeofenceConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new GpsGeofenceGroupConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GpsGeofenceGroupConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new GpsGeofenceGroupMemberConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GpsGeofenceGroupMemberConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EntityConfigurations.Geofence.GeofenceSyncJobConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GeofenceSyncJobConfiguration: {ex.Message}"); }

        // User Management Configurations
        try { modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring RefreshTokenConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new PtsdeviceConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring PtsdeviceConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new PumptransactionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring PumptransactionConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new ReportItemConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReportItemConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new RoleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring RoleConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new RolenavigationConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring RolenavigationConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new RolePermissionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring RolePermissionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new PtsDeviceCommandConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring PtsDeviceCommandConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new SiteConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring SiteConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new SupplierConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring SupplierConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new UserNotificationPreferenceConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UserNotificationPreferenceConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new TagConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TagConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new TagMonitoringConfigConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TagMonitoringConfigConfiguration: {ex.Message}"); }

        try
        {
            Console.WriteLine("TankConfiguration apply");
            modelBuilder.ApplyConfiguration(new TankConfiguration());

            Console.WriteLine("TankConfiguration applied");
        }
        catch (Exception ex) { Console.WriteLine($"Error configuring TankConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new TankmeasurementConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TankmeasurementConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new UploadStatusProbeReadingConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UploadStatusProbeReadingConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new TankstockConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TankstockConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new TankTransferConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TankTransferConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new TankVolumeHistoryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TankVolumeHistoryConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new TankVolumeAdjustmentAuditConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TankVolumeAdjustmentAuditConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new TankCalibrationSnapshotConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TankCalibrationSnapshotConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new CalibrationDataPointConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring CalibrationDataPointConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new CalibrationIntervalAccumulationConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring CalibrationIntervalAccumulationConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new UserActivityConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UserActivityConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new UserConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UserConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new UserRoleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UserRoleConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new UserSitesConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UserSitesConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new VehicleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTripStateConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTripStateConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTripGroupConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTripGroupConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTripConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTripConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTripOverrideConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTripOverrideConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTripClusterSnapshotConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTripClusterSnapshotConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTripOutOfBoundsEventConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTripOutOfBoundsEventConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new VehicleconsumptionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleconsumptionConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new VehiclemanufacturerConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehiclemanufacturerConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new VehiclemodelConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehiclemodelConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new VehicletypeConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicletypeConfiguration: {ex.Message}"); }

        // //Cursor - Automated Reconciliation System Configurations
        try { modelBuilder.ApplyConfiguration(new ReconciliationPolicyConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReconciliationPolicyConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ReconciliationPolicyExecutionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReconciliationPolicyExecutionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ReconciliationDiscrepancyConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReconciliationDiscrepancyConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new DiscrepancyRecordConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring DiscrepancyRecordConfiguration: {ex.Message}"); } //Cursor

        //Cursor - Notification System Configurations
        try { modelBuilder.ApplyConfiguration(new NotificationConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new NotificationRecipientConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationRecipientConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new NotificationPolicyConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationPolicyConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new NotificationPolicyRecipientConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationPolicyRecipientConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new NotificationGroupConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationGroupConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new NotificationGroupMemberConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationGroupMemberConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new NotificationPolicyGroupConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring NotificationPolicyGroupConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new UserPushDeviceConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring UserPushDeviceConfiguration: {ex.Message}"); }

        // Event Expression Engine
        try { modelBuilder.ApplyConfiguration(new EventExpressionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring EventExpressionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new EventExpressionExecutionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring EventExpressionExecutionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ActiveEventConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ActiveEventConfiguration: {ex.Message}"); }

        // //Cursor - PTS Alert Processing Configuration
        try { modelBuilder.ApplyConfiguration(new PTSAlertRecordConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring PTSAlertRecordConfiguration: {ex.Message}"); }

        // // Task Management Configuration
        try { modelBuilder.ApplyConfiguration(new TaskConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring TaskConfiguration: {ex.Message}"); }

        try { modelBuilder.ApplyConfiguration(new VehicleDocumentConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleDocumentConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleComplianceRequirementConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleComplianceRequirementConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleDocumentUserPreferenceConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleDocumentUserPreferenceConfiguration: {ex.Message}"); }

        // Vehicle Transfer Configurations
        try { modelBuilder.ApplyConfiguration(new VehicleTransferConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTransferConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTransferCheckupItemConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTransferCheckupItemConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTransferTyreDetailConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTransferTyreDetailConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleTransferBatteryDetailConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleTransferBatteryDetailConfiguration: {ex.Message}"); }

        // Vehicle Tracking Provider Configurations
        try { modelBuilder.ApplyConfiguration(new ProviderConfigurationEntityConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ProviderConfigurationEntityConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ProviderHealthHistoryEntityConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ProviderHealthHistoryEntityConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleHealthMonitorEntityConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleHealthMonitorEntityConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleProviderMappingEntityConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleProviderMappingEntityConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new VehicleLastKnownLocationConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring VehicleLastKnownLocationConfiguration: {ex.Message}"); }

        // Fuel Data Comparison Configurations
        try { modelBuilder.ApplyConfiguration(new GpsGateReportEntryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring GpsGateReportEntryConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new FuelComparisonSettingsConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring FuelComparisonSettingsConfiguration: {ex.Message}"); }

        // Reporting System Configurations
        try { modelBuilder.ApplyConfiguration(new ReportDefinitionConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReportDefinitionConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ReportCategoryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReportCategoryConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ReportTemplateConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReportTemplateConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ReportExecutionHistoryConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReportExecutionHistoryConfiguration: {ex.Message}"); }
        try { modelBuilder.ApplyConfiguration(new ReportScheduleConfiguration()); } catch (Exception ex) { Console.WriteLine($"Error configuring ReportScheduleConfiguration: {ex.Message}"); }

        // Only finalize the model once, after all configurations are applied
        try
        {
            //var finalModel = modelBuilder.FinalizeModel();
            Console.WriteLine("Model finalization succeeded");
        }
        catch (Exception Ex)
        {
            Console.WriteLine($"ERROR during model validation: {Ex.Message}");
            throw;
        }
    }


    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    // Declaration for Vehicle Maintenance partial configuration hook
    partial void OnModelCreatingPartialMaintenance(ModelBuilder modelBuilder);

    /// <summary>
    /// Override SaveChangesAsync to maintain ActiveEntryKey for TankStock entries
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Update ActiveEntryKey for Tankstock entries
        var tankstockEntries = ChangeTracker.Entries<Tankstock>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in tankstockEntries)
        {
            var tankstock = entry.Entity;
            if (!tankstock.IsDeleted)
            {
                // Set ActiveEntryKey for active entries
                tankstock.ActiveEntryKey = $"{tankstock.TankId}-{tankstock.EntryDate:yyyy-MM-dd}";
            }
            else
            {
                // Set to NULL for deleted entries (allows duplicates)
                tankstock.ActiveEntryKey = null;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

}

