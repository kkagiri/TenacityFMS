using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "assets",
                columns: table => new
                {
                    asset_id = table.Column<string>(type: "text", nullable: false),
                    site_id = table.Column<string>(type: "text", nullable: true),
                    asset_name = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<short>(type: "smallint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_assets", x => x.asset_id);
                });

            migrationBuilder.CreateTable(
                name: "calibrationdatapoints",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    height_before = table.Column<decimal>(type: "numeric(12,3)", nullable: false),
                    height_after = table.Column<decimal>(type: "numeric(12,3)", nullable: false),
                    volume_change = table.Column<decimal>(type: "numeric(18,3)", nullable: false),
                    height_interval = table.Column<int>(type: "integer", nullable: false),
                    volume_per_mm = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    source_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    source_event_id = table.Column<int>(type: "integer", nullable: false),
                    recorded_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_processed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_calibrationdatapoints", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "calibrationintervalaccumulations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    interval_start_mm = table.Column<int>(type: "integer", nullable: false),
                    interval_end_mm = table.Column<int>(type: "integer", nullable: false),
                    observation_count = table.Column<int>(type: "integer", nullable: false),
                    mean_volume_per_mm = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    std_dev_volume_per_mm = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    last_updated_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    seeded_from_snapshot_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_calibrationintervalaccumulations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "dashboard_widget_template",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    widget_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    data_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    configuration_json = table.Column<string>(type: "text", nullable: false),
                    required_role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    required_permissions = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_dashboard_widget_template", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "departments",
                columns: table => new
                {
                    department_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_departments", x => x.department_id);
                });

            migrationBuilder.CreateTable(
                name: "devicetype",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(945)", maxLength: 945, nullable: true),
                    is_monitored = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    monitoring_endpoint = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_devicetype", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "employee_position",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_employee_position", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "expectedaverageclassification",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(545)", maxLength: 545, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    iskmper_liter = table.Column<short>(type: "smallint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_expectedaverageclassification", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "fuel_audit_thresholds",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    threshold_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    threshold_value = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    auto_apply = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    vehicle_type_filter = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_audit_thresholds", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "fuelaudits",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    audit_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Draft"),
                    description = table.Column<string>(type: "text", nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    system_opening_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    tanker_opening_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    gps_fleet_opening_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    pickup_fleet_opening_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    external_fuel_in = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    external_fuel_out = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    total_dispensed = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    gps_fleet_consumption = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    pickup_fleet_consumption = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    system_closing_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    tanker_closing_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    gps_fleet_closing_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    pickup_fleet_closing_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    expected_closing_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    system_variance = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    system_variance_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    vehicles_with_exact_data = table.Column<int>(type: "integer", nullable: true),
                    vehicles_with_estimated_data = table.Column<int>(type: "integer", nullable: true),
                    vehicles_with_no_data = table.Column<int>(type: "integer", nullable: true),
                    data_confidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    tanker_count = table.Column<int>(type: "integer", nullable: true),
                    gps_vehicle_count = table.Column<int>(type: "integer", nullable: true),
                    pickup_vehicle_count = table.Column<int>(type: "integer", nullable: true),
                    flag_count = table.Column<int>(type: "integer", nullable: false),
                    unresolved_flag_count = table.Column<int>(type: "integer", nullable: false),
                    wizard_step = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    calculated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    calculated_by = table.Column<long>(type: "bigint", nullable: true),
                    finalized_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    finalized_by = table.Column<long>(type: "bigint", nullable: true),
                    finalization_notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuelaudits", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "fuelingruleset",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuelingruleset", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "fuelreportgenerate",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    modfified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuelreportgenerate", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "geofence_sync_jobs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    job_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    progress_percent = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    status_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    geofences_synced = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    groups_synced = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    total_geofences = table.Column<int>(type: "integer", nullable: false),
                    total_groups = table.Column<int>(type: "integer", nullable: false),
                    failed_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    force_full_sync = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    initiated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_geofence_sync_jobs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "gps_geofence",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    external_geofence_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    geofence_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    geometry_json = table.Column<string>(type: "text", nullable: true),
                    center_latitude = table.Column<decimal>(type: "numeric(10,8)", nullable: true),
                    center_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    radius_meters = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    classification = table.Column<int>(type: "integer", nullable: false, defaultValue: 0, comment: "Operational classification: 0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    last_synced_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_gps_geofence", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "gps_geofence_group",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    external_group_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    colour = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    is_pinned = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_allowed_for_fueling = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false, comment: "When true, fueling is permitted within geofences of this group (global policy)"),
                    last_synced_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_gps_geofence_group", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "gpsgate_report_definitions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    report_id = table.Column<int>(type: "integer", nullable: false),
                    report_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_gpsgate_report_definitions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "gpsgate_reports",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    report_id = table.Column<int>(type: "integer", nullable: false),
                    report_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    handle_id = table.Column<int>(type: "integer", nullable: false),
                    job_id = table.Column<string>(type: "text", nullable: true),
                    session_id = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    report_data = table.Column<string>(type: "text", nullable: true),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    requested_by_user_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_gpsgate_reports", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "gpsgate_sessions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    session_id = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    application_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_used = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_gpsgate_sessions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issue_follower",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    issue_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    user_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    followed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    notify_by_email = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_by_push = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issue_follower", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issuecategory",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    description = table.Column<string>(type: "character varying(945)", maxLength: 945, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuecategory", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issuepriority",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuepriority", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issuestatus",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuestatus", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "load_classifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    min_weight_tonnes = table.Column<decimal>(type: "numeric", nullable: true),
                    max_weight_tonnes = table.Column<decimal>(type: "numeric", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_load_classifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "location_validation_log",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    validation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    pts_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    tank_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tank_latitude = table.Column<decimal>(type: "numeric(10,8)", nullable: true),
                    tank_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    tank_location_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    vehicle_latitude = table.Column<decimal>(type: "numeric(10,8)", nullable: true),
                    vehicle_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    vehicle_gps_accuracy = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    vehicle_distance_meters = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    vehicle_proximity_required = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    vehicle_proximity_valid = table.Column<bool>(type: "boolean", nullable: true),
                    mobile_latitude = table.Column<decimal>(type: "numeric(10,8)", nullable: true),
                    mobile_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    mobile_accuracy = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    mobile_distance_meters = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    mobile_proximity_required = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    mobile_proximity_valid = table.Column<bool>(type: "boolean", nullable: true),
                    minimum_gps_accuracy_required = table.Column<int>(type: "integer", nullable: true),
                    gps_accuracy_valid = table.Column<bool>(type: "boolean", nullable: true),
                    is_valid = table.Column<bool>(type: "boolean", nullable: false),
                    validation_result = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    failure_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    vehicle_radius_used = table.Column<int>(type: "integer", nullable: true),
                    mobile_radius_used = table.Column<int>(type: "integer", nullable: true),
                    grace_period_meters_used = table.Column<int>(type: "integer", nullable: true),
                    was_bypassed_due_to_gps_failure = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    transaction_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_location_validation_log", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "navigationitems",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    page = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    link = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    parent_id = table.Column<int>(type: "integer", nullable: true),
                    icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_navigationitems", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    parent_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_Permissions_Parent",
                        column: x => x.parent_id,
                        principalTable: "permissions",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "provider_configurations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "1.0.0"),
                    settings = table.Column<string>(type: "text", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 999),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_configurations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "PTSAlertRecord",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pts_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    device_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    device_number = table.Column<int>(type: "integer", nullable: false),
                    alert_code = table.Column<int>(type: "integer", nullable: false),
                    state = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    configuration_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    alarm_id = table.Column<int>(type: "integer", nullable: true),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pts_alert_record", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "report_categories",
                columns: table => new
                {
                    ReportCategoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CategoryName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, defaultValue: "fa-light fa-folder"),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_report_categories", x => x.ReportCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "report_definitions",
                columns: table => new
                {
                    ReportDefinitionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReportId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReportName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReportType = table.Column<int>(type: "integer", nullable: false),
                    Icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, defaultValue: "fa-light fa-file-chart-column"),
                    DataSourceEndpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RequiredPermission = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsBuiltIn = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Configuration = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_report_definitions", x => x.ReportDefinitionId);
                });

            migrationBuilder.CreateTable(
                name: "report_schedules",
                columns: table => new
                {
                    ReportScheduleId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ScheduleName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReportSourceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Filters = table.Column<string>(type: "TEXT", nullable: true),
                    OutputFormat = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pdf"),
                    Frequency = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "once"),
                    RepeatCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    ExecutedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Recipients = table.Column<string>(type: "TEXT", nullable: true),
                    ScheduleConfig = table.Column<string>(type: "TEXT", nullable: true),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextExecutionAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "active"),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_report_schedules", x => x.ReportScheduleId);
                });

            migrationBuilder.CreateTable(
                name: "reportitems",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "DevExtreme Reports"),
                    icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "fa-light fa-file-chart-column"),
                    report_type = table.Column<int>(type: "integer", nullable: false, defaultValue: 4),
                    layout_data = table.Column<byte[]>(type: "bytea", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reportitems", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "role_claims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<string>(type: "text", nullable: true),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_role_claims", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    concurrency_stamp = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "supplier",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    contacts = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_supplier", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "SystemConfigurations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    configuration_key = table.Column<string>(type: "character varying(191)", maxLength: 191, nullable: false),
                    configuration_value = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    data_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_editable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    validation_pattern = table.Column<string>(type: "character varying(191)", maxLength: 191, nullable: true),
                    min_value = table.Column<double>(type: "double precision", nullable: true),
                    max_value = table.Column<double>(type: "double precision", nullable: true),
                    default_value = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_system_configurations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tankcalibrationsnapshots",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    tank_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    pts_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    probe_number = table.Column<int>(type: "integer", nullable: false),
                    chart_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    source = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    total_records = table.Column<int>(type: "integer", nullable: false),
                    recorded_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    recorded_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    records_json = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tankcalibrationsnapshots", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tenant",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tenant", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "usage_intensities",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    typical_hours_per_day = table.Column<decimal>(type: "numeric", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usage_intensities", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_claims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "text", nullable: true),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_claims", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_logins",
                columns: table => new
                {
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    provider_key = table.Column<string>(type: "text", nullable: false),
                    provider_display_name = table.Column<string>(type: "text", nullable: true),
                    user_id = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_logins", x => new { x.login_provider, x.provider_key });
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "text", nullable: false),
                    role_id = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roles", x => new { x.user_id, x.role_id });
                });

            migrationBuilder.CreateTable(
                name: "user_tokens",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "text", nullable: false),
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_tokens", x => new { x.user_id, x.login_provider, x.name });
                });

            migrationBuilder.CreateTable(
                name: "vehicle_health_monitor",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    checked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_online = table.Column<bool>(type: "boolean", nullable: false),
                    last_online_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_offline_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    offline_duration = table.Column<TimeSpan>(type: "interval", nullable: true),
                    offline_reason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    permanent_location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    working_site_id = table.Column<int>(type: "integer", nullable: true),
                    last_known_latitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    last_known_longitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    last_known_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    issue_tracking_id = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_health_monitor", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vehiclemanufacturer",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehiclemanufacturer", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vehicletype",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    abbvr = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    nothinghere = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicletype", x => x.id);
                },
                comment: "			");

            migrationBuilder.CreateTable(
                name: "fuel_audit_flags",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    audit_id = table.Column<long>(type: "bigint", nullable: false),
                    flag_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Open"),
                    category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "System"),
                    reference_id = table.Column<long>(type: "bigint", nullable: true),
                    reference_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    reference_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    actual_value = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    expected_value = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    threshold_value = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    value_unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    resolution_notes = table.Column<string>(type: "text", nullable: true),
                    resolution_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    resolved_by = table.Column<long>(type: "bigint", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_recurring_pattern = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    pattern_count = table.Column<int>(type: "integer", nullable: true),
                    related_flag_ids = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_audit_flags", x => x.id);
                    table.ForeignKey(
                        name: "fk_fuel_audit_flags_fuel_audits_audit_id",
                        column: x => x.audit_id,
                        principalTable: "fuelaudits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuel_audit_sites",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    audit_id = table.Column<long>(type: "bigint", nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    site_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_audit_sites", x => x.id);
                    table.ForeignKey(
                        name: "fk_fuel_audit_sites_fuel_audits_audit_id",
                        column: x => x.audit_id,
                        principalTable: "fuelaudits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuel_audit_tanker_readings",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    audit_id = table.Column<long>(type: "bigint", nullable: false),
                    tank_id = table.Column<long>(type: "bigint", nullable: false),
                    tank_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    tank_capacity = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    opening_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    opening_reading_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    opening_method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    opening_notes = table.Column<string>(type: "text", nullable: true),
                    closing_stock = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    closing_reading_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    closing_method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    closing_notes = table.Column<string>(type: "text", nullable: true),
                    fuel_received = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    fuel_dispensed = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    fuel_transferred_out = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    fuel_transferred_in = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    expected_closing = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    variance = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    variance_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    has_variance_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    data_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_auto_populated = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    has_data_quality_issue = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    data_quality_notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_audit_tanker_readings", x => x.id);
                    table.ForeignKey(
                        name: "fk_fuel_audit_tanker_readings_fuel_audits_audit_id",
                        column: x => x.audit_id,
                        principalTable: "fuelaudits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuel_audit_variances",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    audit_id = table.Column<long>(type: "bigint", nullable: false),
                    category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    reference_id = table.Column<long>(type: "bigint", nullable: true),
                    reference_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    expected_value = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    actual_value = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    variance_amount = table.Column<decimal>(type: "numeric(15,2)", nullable: true),
                    variance_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    variance_direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    threshold_absolute = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    threshold_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    exceeds_threshold = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    possible_cause = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    data_confidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    confidence_factors = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_audit_variances", x => x.id);
                    table.ForeignKey(
                        name: "fk_fuel_audit_variances_fuel_audits_audit_id",
                        column: x => x.audit_id,
                        principalTable: "fuelaudits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "gps_geofence_group_member",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    group_id = table.Column<int>(type: "integer", nullable: false),
                    geofence_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_gps_geofence_group_member", x => x.id);
                    table.ForeignKey(
                        name: "fk_gps_geofence_group_member_gps_geofence_geofence_id",
                        column: x => x.geofence_id,
                        principalTable: "gps_geofence",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_gps_geofence_group_member_gps_geofence_group_group_id",
                        column: x => x.group_id,
                        principalTable: "gps_geofence_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "issuetemplate",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    device_type_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    title_template = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    description_template = table.Column<string>(type: "character varying(945)", maxLength: 945, nullable: true),
                    default_priority_id = table.Column<int>(type: "integer", nullable: true),
                    default_status_id = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    can_auto_create = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    offline_threshold_minutes = table.Column<int>(type: "integer", nullable: true, defaultValue: 30),
                    default_assignee = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    cooldown_minutes = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuetemplate", x => x.id);
                    table.ForeignKey(
                        name: "FK_issuetemplate_devicetype",
                        column: x => x.device_type_id,
                        principalTable: "devicetype",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_issuetemplate_issuepriority",
                        column: x => x.default_priority_id,
                        principalTable: "issuepriority",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_issuetemplate_issuestatus",
                        column: x => x.default_status_id,
                        principalTable: "issuestatus",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "provider_health_history",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    provider_config_id = table.Column<int>(type: "integer", nullable: false),
                    provider_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Unknown"),
                    message = table.Column<string>(type: "text", nullable: true),
                    response_time_ms = table.Column<int>(type: "integer", nullable: true),
                    success_rate = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    error_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    additional_metrics = table.Column<string>(type: "json", nullable: true),
                    checked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_health_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_health_history_provider_configurations_provider_co",
                        column: x => x.provider_config_id,
                        principalTable: "provider_configurations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "report_execution_history",
                columns: table => new
                {
                    ReportExecutionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReportDefinitionId = table.Column<int>(type: "integer", nullable: false),
                    ExecutedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Filters = table.Column<string>(type: "TEXT", nullable: true),
                    ExportFormat = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RecordCount = table.Column<int>(type: "integer", nullable: true),
                    ExecutionTimeMs = table.Column<int>(type: "integer", nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_report_execution_history", x => x.ReportExecutionId);
                    table.ForeignKey(
                        name: "fk_report_execution_history_report_definitions_report_definitio",
                        column: x => x.ReportDefinitionId,
                        principalTable: "report_definitions",
                        principalColumn: "ReportDefinitionId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "report_templates",
                columns: table => new
                {
                    ReportTemplateId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TemplateId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    ReportDefinitionId = table.Column<int>(type: "integer", nullable: false),
                    TemplateName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Configuration = table.Column<string>(type: "TEXT", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsShared = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_report_templates", x => x.ReportTemplateId);
                    table.ForeignKey(
                        name: "fk_report_templates_report_definitions_report_definition_id",
                        column: x => x.ReportDefinitionId,
                        principalTable: "report_definitions",
                        principalColumn: "ReportDefinitionId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "rolenavigation",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    navigation_item_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_rolenavigation", x => x.id);
                    table.ForeignKey(
                        name: "FK_RoleNavigations_NavigationItems",
                        column: x => x.navigation_item_id,
                        principalTable: "navigationitems",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoleNavigations_Roles",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "rolepermissions",
                columns: table => new
                {
                    role_id = table.Column<string>(type: "character varying(100)", nullable: false),
                    permission_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_rolepermissions", x => new { x.role_id, x.permission_id });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions",
                        column: x => x.permission_id,
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehiclemodel",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    manufacturer_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehiclemodel", x => x.id);
                    table.ForeignKey(
                        name: "vehiclemodel_manufacturer",
                        column: x => x.manufacturer_id,
                        principalTable: "vehiclemanufacturer",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "issueautocloseconfig",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    issue_template_id = table.Column<int>(type: "integer", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    checker_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    check_interval_seconds = table.Column<int>(type: "integer", nullable: true),
                    checker_config_json = table.Column<string>(type: "text", nullable: true),
                    auto_close_when_satisfied = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issueautocloseconfig", x => x.id);
                    table.ForeignKey(
                        name: "FK_issueautocloseconfig_issuetemplate",
                        column: x => x.issue_template_id,
                        principalTable: "issuetemplate",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "issuetemplate_categories",
                columns: table => new
                {
                    issue_template_id = table.Column<int>(type: "integer", nullable: false),
                    issue_category_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuetemplate_categories", x => new { x.issue_template_id, x.issue_category_id });
                    table.ForeignKey(
                        name: "FK_templatecat_category",
                        column: x => x.issue_category_id,
                        principalTable: "issuecategory",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_templatecat_template",
                        column: x => x.issue_template_id,
                        principalTable: "issuetemplate",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "issuetemplateworkflow",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    issue_template_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuetemplateworkflow", x => x.id);
                    table.ForeignKey(
                        name: "FK_issuetemplateworkflow_issuetemplate",
                        column: x => x.issue_template_id,
                        principalTable: "issuetemplate",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_transfer_checkup_templates",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    serial_no = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    check_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    vehicle_type_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_model_id = table.Column<int>(type: "integer", nullable: true),
                    has_gps = table.Column<bool>(type: "boolean", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_transfer_checkup_templates", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicle_transfer_checkup_templates_vehiclemodels_vehicle_mo",
                        column: x => x.vehicle_model_id,
                        principalTable: "vehiclemodel",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_transfer_checkup_templates_vehicletypes_vehicle_typ",
                        column: x => x.vehicle_type_id,
                        principalTable: "vehicletype",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "issuetemplateworkflowstage",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    workflow_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuetemplateworkflowstage", x => x.id);
                    table.ForeignKey(
                        name: "FK_issuetemplateworkflowstage_workflow",
                        column: x => x.workflow_id,
                        principalTable: "issuetemplateworkflow",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "issuetemplateaction",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    issue_template_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    action_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "General"),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    requires_device_details = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    requires_source_vehicle = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    requires_camera_details = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    stage_id = table.Column<int>(type: "integer", nullable: true),
                    position_x = table.Column<double>(type: "double precision", nullable: true),
                    position_y = table.Column<double>(type: "double precision", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuetemplateaction", x => x.id);
                    table.ForeignKey(
                        name: "FK_issuetemplateaction_issuetemplate",
                        column: x => x.issue_template_id,
                        principalTable: "issuetemplate",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_issuetemplateaction_workflowstage",
                        column: x => x.stage_id,
                        principalTable: "issuetemplateworkflowstage",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "active_events",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    state = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    trigger_source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    severity = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    device_id = table.Column<int>(type: "integer", nullable: true),
                    pts_device_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    event_expression_id = table.Column<int>(type: "integer", nullable: true),
                    triggered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    acknowledged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    acknowledged_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    resolved_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    triggered_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    threshold_value = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    actual_value = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    escalation_level = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_escalated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    auto_resolve_minutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    resolution_notes = table.Column<string>(type: "text", nullable: true),
                    event_data = table.Column<string>(type: "json", nullable: true),
                    suppress_notifications = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_active_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "BusinessFunctionNotificationGroups",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    trigger_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    group_id = table.Column<int>(type: "integer", nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    allowed_delivery_methods = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    minimum_severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_business_function_notification_groups", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "calibrationdata",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    calibration_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    calibration_data = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_calibrationdata", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "configuration",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    configuration_id = table.Column<string>(type: "text", nullable: true),
                    configuration1 = table.Column<string>(type: "text", nullable: false),
                    ptsid = table.Column<string>(type: "character varying(100)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_configuration", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "dailytankreconciliation",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    reconciliation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    opening_level = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    closing_level = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    total_refills = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    total_deliveries = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    total_transfers_in = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    total_transfers_out = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_dailytankreconciliation", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "dashboard_widget_instance",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    template_id = table.Column<int>(type: "integer", nullable: true),
                    custom_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    widget_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    data_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    position_x = table.Column<int>(type: "integer", nullable: false),
                    position_y = table.Column<int>(type: "integer", nullable: false),
                    width = table.Column<int>(type: "integer", nullable: false),
                    height = table.Column<int>(type: "integer", nullable: false),
                    configuration_json = table.Column<string>(type: "text", nullable: false),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_custom_widget = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_shared = table.Column<bool>(type: "boolean", nullable: false),
                    shared_from_user_id = table.Column<string>(type: "text", nullable: true),
                    shared_from_widget_id = table.Column<int>(type: "integer", nullable: true),
                    can_edit = table.Column<bool>(type: "boolean", nullable: false),
                    can_delete = table.Column<bool>(type: "boolean", nullable: false),
                    shared_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_dashboard_widget_instance", x => x.id);
                    table.ForeignKey(
                        name: "FK_DashboardWidgetInstance_Template",
                        column: x => x.template_id,
                        principalTable: "dashboard_widget_template",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "delivery",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delivery_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    manual_delivery_amount = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: false),
                    sensor_delivery_amount = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    delivery_temperature = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    delivery_density = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    delivery_mass = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    stock_before_delivery = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Stock level before delivery"),
                    stock_after_delivery = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Stock level after delivery"),
                    price_per_liter = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Price per liter for inventory costing"),
                    lponumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, comment: "LPO/Invoice number"),
                    product = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, comment: "Product type (e.g., Diesel, Petrol)"),
                    recorded_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    supplier_id = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_delivery", x => x.id);
                    table.ForeignKey(
                        name: "Delivery_Supplier",
                        column: x => x.supplier_id,
                        principalTable: "supplier",
                        principalColumn: "id");
                },
                comment: "		");

            migrationBuilder.CreateTable(
                name: "device_connections",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ip_address = table.Column<string>(type: "text", nullable: false),
                    connected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    disconnected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_activity_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    connection_type = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    ptsdevice_id = table.Column<string>(type: "character varying(100)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_device_connections", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "DiscrepancyRecords",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    policy_id = table.Column<int>(type: "integer", nullable: false),
                    execution_id = table.Column<int>(type: "integer", nullable: false),
                    detected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    variance_liters = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    variance_percentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    is_resolved = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_discrepancy_records", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "employee",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    full_name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false, defaultValueSql: "'Employee Name'"),
                    employee_work_no = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    employeephone_number = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true, defaultValueSql: "'0700000000'"),
                    employeestatus = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_modified = table.Column<short>(type: "smallint", nullable: true, defaultValueSql: "'0'"),
                    position = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_employee", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "employee_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "CHAR(36)", nullable: false),
                    employee_id = table.Column<int>(type: "integer", nullable: false),
                    document_type = table.Column<int>(type: "integer", nullable: false),
                    document_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    issue_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    alert_lead_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    issuing_authority = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    document_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    document_file_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_employee_documents", x => x.id);
                    table.ForeignKey(
                        name: "fk_employee_documents_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "employeevehicle",
                columns: table => new
                {
                    employee_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_employeevehicle", x => new { x.vehicle_id, x.employee_id });
                    table.ForeignKey(
                        name: "EmployeeID",
                        column: x => x.employee_id,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "error_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "CHAR(36)", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    stack = table.Column<string>(type: "text", nullable: true),
                    component_stack = table.Column<string>(type: "text", nullable: true),
                    user_agent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_error_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "event_expression_executions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    event_expression_id = table.Column<int>(type: "integer", nullable: false),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    executed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    was_triggered = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    suppressed_reason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    event_data = table.Column<string>(type: "json", nullable: true),
                    notification_id = table.Column<int>(type: "integer", nullable: true),
                    issue_tracker_id = table.Column<int>(type: "integer", nullable: true),
                    success = table.Column<bool>(type: "boolean", nullable: false),
                    error_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    execution_time_ms = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    scope_key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "global")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_event_expression_executions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "event_expressions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    device_id = table.Column<int>(type: "integer", nullable: true),
                    minimum_severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    conditions = table.Column<string>(type: "json", nullable: true),
                    notification_policy_id = table.Column<int>(type: "integer", nullable: false),
                    create_issue_tracker = table.Column<bool>(type: "boolean", nullable: false),
                    issue_category = table.Column<int>(type: "integer", nullable: true),
                    issue_priority = table.Column<int>(type: "integer", nullable: true),
                    assign_issue_to = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    cooldown_minutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    max_notifications_per_day = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    max_notifications_per_hour = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    enable_escalation = table.Column<bool>(type: "boolean", nullable: false),
                    escalation_rules = table.Column<string>(type: "json", nullable: true),
                    message_template = table.Column<string>(type: "text", nullable: true),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    create_active_event = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    trigger_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_triggered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_event_expressions", x => x.id);
                    table.ForeignKey(
                        name: "FK_EventExpressions_IssueCategory",
                        column: x => x.issue_category,
                        principalTable: "issuecategory",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_EventExpressions_IssuePriority",
                        column: x => x.issue_priority,
                        principalTable: "issuepriority",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "expected_fuel_average_templates",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    vehicle_type_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_manufacturer_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_model_id = table.Column<int>(type: "integer", nullable: true),
                    year_of_manufacture = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_route_id = table.Column<int>(type: "integer", nullable: true),
                    load_classification_id = table.Column<int>(type: "integer", nullable: true),
                    usage_intensity_id = table.Column<int>(type: "integer", nullable: true),
                    is_km_per_liter = table.Column<bool>(type: "boolean", nullable: false),
                    expected_value = table.Column<decimal>(type: "numeric", nullable: false),
                    min_threshold = table.Column<decimal>(type: "numeric", nullable: true),
                    max_threshold = table.Column<decimal>(type: "numeric", nullable: true),
                    tolerance_percent = table.Column<decimal>(type: "numeric", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    effective_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    effective_to = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_expected_fuel_average_templates", x => x.id);
                    table.ForeignKey(
                        name: "fk_expected_fuel_average_templates_load_classifications_load_c",
                        column: x => x.load_classification_id,
                        principalTable: "load_classifications",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_expected_fuel_average_templates_usage_intensities_usage_int",
                        column: x => x.usage_intensity_id,
                        principalTable: "usage_intensities",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_expected_fuel_average_templates_vehiclemanufacturers_vehicl",
                        column: x => x.vehicle_manufacturer_id,
                        principalTable: "vehiclemanufacturer",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_expected_fuel_average_templates_vehiclemodels_vehicle_model",
                        column: x => x.vehicle_model_id,
                        principalTable: "vehiclemodel",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_expected_fuel_average_templates_vehicletypes_vehicle_type_id",
                        column: x => x.vehicle_type_id,
                        principalTable: "vehicletype",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "expectedaverage",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    expected_average_classification_id = table.Column<int>(type: "integer", nullable: false),
                    expected_average_value = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_expectedaverage", x => x.id);
                    table.ForeignKey(
                        name: "Expected_classification",
                        column: x => x.expected_average_classification_id,
                        principalTable: "expectedaverageclassification",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "fuel_audit_gps_readings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    audit_id = table.Column<long>(type: "bigint", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    reading_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    reading_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    fuel_level = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fuel_level_unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Liters"),
                    reading_timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actual_data_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    data_quality = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Exact"),
                    data_quality_reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    days_from_requested_date = table.Column<int>(type: "integer", nullable: true),
                    was_online = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    latitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true),
                    longitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true),
                    ignition_status = table.Column<bool>(type: "boolean", nullable: true),
                    gps_device_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    track_info_id = table.Column<int>(type: "integer", nullable: true),
                    raw_data = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_audit_gps_readings", x => x.id);
                    table.ForeignKey(
                        name: "fk_gps_reading_audit",
                        column: x => x.audit_id,
                        principalTable: "fuelaudits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "fuel_audit_vehicle_positions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    audit_id = table.Column<long>(type: "bigint", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    number_plate = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    vehicle_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "GPS"),
                    tank_capacity = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    opening_stock = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    opening_reading_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    opening_data_quality = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    opening_data_source = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    opening_gps_reading_id = table.Column<long>(type: "bigint", nullable: true),
                    closing_stock = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    closing_reading_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    closing_data_quality = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    closing_data_source = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    closing_gps_reading_id = table.Column<long>(type: "bigint", nullable: true),
                    fuel_refueled = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    refuel_count = table.Column<int>(type: "integer", nullable: true),
                    fuel_consumed = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    gps_measured_consumption = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    distance_traveled = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fuel_efficiency = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    expected_closing = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    variance = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    variance_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    has_variance_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    variance_flag_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_manually_edited = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    days_since_last_refuel_start = table.Column<int>(type: "integer", nullable: true),
                    days_since_last_refuel_end = table.Column<int>(type: "integer", nullable: true),
                    estimation_confidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    estimation_notes = table.Column<string>(type: "text", nullable: true),
                    dispensing_record_fuel = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    gps_refuel_detected = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    refuel_mismatch = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    has_refuel_mismatch_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    gps_refill_events_json = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_audit_vehicle_positions", x => x.id);
                    table.ForeignKey(
                        name: "fk_fuel_audit_vehicle_positions_fuel_audits_audit_id",
                        column: x => x.audit_id,
                        principalTable: "fuelaudits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuel_routes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    from_location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    to_location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    distance_km = table.Column<decimal>(type: "numeric", nullable: true),
                    elevation_change = table.Column<int>(type: "integer", nullable: true),
                    route_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuel_routes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "fueling_rule_set_assignments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    fueling_rule_set_id = table.Column<int>(type: "integer", nullable: false),
                    target_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_type_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    tag_id = table.Column<int>(type: "integer", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fueling_rule_set_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_Assignment_FuelingRuleSet",
                        column: x => x.fueling_rule_set_id,
                        principalTable: "fuelingruleset",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Assignment_VehicleType",
                        column: x => x.vehicle_type_id,
                        principalTable: "vehicletype",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuelingrule",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    rule_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    discriminator = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    fueling_rule_set_id = table.Column<int>(type: "integer", nullable: false),
                    daily_limit_liter = table.Column<int>(type: "integer", nullable: true),
                    monthly_limit_liter = table.Column<int>(type: "integer", nullable: true),
                    fueling_limit_per_transaction = table.Column<int>(type: "integer", nullable: true),
                    max_refills_per_day = table.Column<int>(type: "integer", nullable: true),
                    max_refills_per_week = table.Column<int>(type: "integer", nullable: true),
                    max_refills_per_month = table.Column<int>(type: "integer", nullable: true),
                    start_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    end_time = table.Column<TimeSpan>(type: "interval", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuelingrule", x => x.id);
                    table.ForeignKey(
                        name: "FK_FuelingRule_FuelingRuleSet",
                        column: x => x.fueling_rule_set_id,
                        principalTable: "fuelingruleset",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fuelrefil",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    manual_fuelrefill_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    previous_meter_reading = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    current_meter_reading = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    fuel_by = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    pump_transcation_id = table.Column<int>(type: "integer", nullable: true),
                    driver_id = table.Column<int>(type: "integer", nullable: true),
                    tag_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    modified_by = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    is_modified = table.Column<short>(type: "smallint", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    is_correction = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    corrects_record_id = table.Column<int>(type: "integer", nullable: true),
                    correction_reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fuelrefil", x => x.id);
                    table.ForeignKey(
                        name: "fuelrefil_corrects_record",
                        column: x => x.corrects_record_id,
                        principalTable: "fuelrefil",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fuelrefill_driver",
                        column: x => x.driver_id,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "gpsgate_report_entries",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    report_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    dispense_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    start_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    duration = table.Column<TimeSpan>(type: "interval", nullable: true),
                    fuel_before = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fuel_after = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    refill_volume = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    original_volume = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    modified_volume = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    modification_reason = table.Column<string>(type: "text", nullable: true),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deletion_reason = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_gpsgate_report_entries", x => x.id);
                    table.ForeignKey(
                        name: "fk_gpsgate_report_entries_gpsgate_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "gpsgate_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "intankdelivery",
                columns: table => new
                {
                    delivery_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank = table.Column<int>(type: "integer", nullable: false),
                    fuel_grade_id = table.Column<int>(type: "integer", nullable: false),
                    fuel_grade_name = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    start_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    start_product_height = table.Column<float>(type: "real", nullable: true),
                    start_water_height = table.Column<float>(type: "real", nullable: true),
                    start_temperature = table.Column<float>(type: "real", nullable: true),
                    start_product_volume = table.Column<float>(type: "real", nullable: true),
                    start_product_tcvolume = table.Column<float>(type: "real", nullable: true),
                    start_product_density = table.Column<float>(type: "real", nullable: true),
                    start_product_mass = table.Column<float>(type: "real", nullable: true),
                    end_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    end_product_height = table.Column<float>(type: "real", nullable: true),
                    end_water_height = table.Column<float>(type: "real", nullable: true),
                    end_temperature = table.Column<float>(type: "real", nullable: true),
                    end_product_volume = table.Column<float>(type: "real", nullable: true),
                    end_product_tcvolume = table.Column<float>(type: "real", nullable: true),
                    end_product_density = table.Column<float>(type: "real", nullable: true),
                    end_product_mass = table.Column<float>(type: "real", nullable: true),
                    absolute_product_height = table.Column<float>(type: "real", nullable: true),
                    absolute_water_height = table.Column<float>(type: "real", nullable: true),
                    absolute_temperature = table.Column<float>(type: "real", nullable: true),
                    absolute_product_volume = table.Column<float>(type: "real", nullable: true),
                    absolute_product_tcvolume = table.Column<float>(type: "real", nullable: true),
                    absolute_product_density = table.Column<float>(type: "real", nullable: true),
                    absolute_product_mass = table.Column<float>(type: "real", nullable: true),
                    pumps_dispensed_volume = table.Column<float>(type: "real", nullable: true),
                    configuration_id = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ptsid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    packet_id = table.Column<int>(type: "integer", nullable: false),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true, defaultValue: "Detected"),
                    matched_delivery_id = table.Column<int>(type: "integer", nullable: true),
                    is_processed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    detected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_intankdelivery", x => x.delivery_id);
                    table.ForeignKey(
                        name: "fk_itd_matchedDeliveryId",
                        column: x => x.matched_delivery_id,
                        principalTable: "delivery",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "issue_attachments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    issue_id = table.Column<int>(type: "integer", nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    stored_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    file_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    attachment_category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "General"),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    uploaded_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issue_attachments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issue_reminder",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    issue_id = table.Column<int>(type: "integer", nullable: false),
                    reminder_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Daily"),
                    days_before = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    reminder_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    recipient_user_ids = table.Column<string>(type: "text", nullable: true),
                    notify_assignee = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_opener = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    custom_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    last_sent_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_reminder_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issue_reminder", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issueactivitylogs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    issue_id = table.Column<int>(type: "integer", nullable: false),
                    activity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    field_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    old_value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    new_value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    performed_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    performed_by_user_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    activity_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issueactivitylogs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issueassignmenttracker",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    assigned_from = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    assigned_to = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    assigned_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    issue = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issueassignmenttracker", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "issuecompletionrecord",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    issue_id = table.Column<int>(type: "integer", nullable: false),
                    template_action_id = table.Column<int>(type: "integer", nullable: true),
                    action_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    root_cause = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    old_device_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    old_device_imei = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    new_device_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    new_device_imei = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    device_phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    source_vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    camera_imei = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    camera_position = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    camera_sim_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    old_sensor_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    new_sensor_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    sensor_reason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    calibration_result = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    additional_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    completed_by_user_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    completed_by_user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuecompletionrecord", x => x.id);
                    table.ForeignKey(
                        name: "FK_issuecompletionrecord_templateaction",
                        column: x => x.template_action_id,
                        principalTable: "issuetemplateaction",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "issuetracker",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    issue_category_id = table.Column<int>(type: "integer", nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    openby = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    related_issue = table.Column<int>(type: "integer", nullable: true),
                    problem_description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    problem_title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<int>(type: "integer", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: true),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    open_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    closing_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modfield = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    assign_to = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    active_alarm_id = table.Column<int>(type: "integer", nullable: true),
                    issue_template_id = table.Column<int>(type: "integer", nullable: true),
                    device_type_id = table.Column<int>(type: "integer", nullable: true),
                    can_auto_close = table.Column<bool>(type: "boolean", nullable: false),
                    auto_close_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_auto_created = table.Column<bool>(type: "boolean", nullable: false),
                    related_entity_id = table.Column<int>(type: "integer", nullable: true),
                    related_entity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    assigned_to = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    reported_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    completion_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    closing_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_issuetracker", x => x.id);
                    table.ForeignKey(
                        name: "Issue_tracker_issuepriorty",
                        column: x => x.priority,
                        principalTable: "issuepriority",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "Issuetracker_status",
                        column: x => x.status,
                        principalTable: "issuestatus",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "issuetracker_devicetype_v2",
                        column: x => x.device_type_id,
                        principalTable: "devicetype",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "issuetracker_template",
                        column: x => x.issue_template_id,
                        principalTable: "issuetemplate",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "issuetrcker_issuecategoryID",
                        column: x => x.issue_category_id,
                        principalTable: "issuecategory",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "location_validation_bypasses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    bypass_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    user_id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    enabled_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    enabled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    cancelled_by = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_location_validation_bypasses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "loginactivities",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ip_address = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_successful = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_loginactivities", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "maintenance_issues",
                columns: table => new
                {
                    issue_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    maintenance_id = table.Column<int>(type: "integer", nullable: false),
                    issue_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    responsible_person = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    reported_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_reported = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_resolved = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resolution_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    additional_cost = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_maintenance_issues", x => x.issue_id);
                });

            migrationBuilder.CreateTable(
                name: "maintenance_schedules",
                columns: table => new
                {
                    schedule_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    maintenance_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    interval_kilometers = table.Column<decimal>(type: "numeric", nullable: true),
                    interval_days = table.Column<int>(type: "integer", nullable: true),
                    warning_threshold_km = table.Column<decimal>(type: "numeric", nullable: true),
                    warning_threshold_days = table.Column<int>(type: "integer", nullable: true),
                    estimated_cost = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    vehicle_type_id = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    apply_to_all_vehicles = table.Column<bool>(type: "boolean", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    default_priority = table.Column<int>(type: "integer", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by_navigation_id = table.Column<string>(type: "character varying(100)", nullable: true),
                    modified_by_navigation_id = table.Column<string>(type: "character varying(100)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_maintenance_schedules", x => x.schedule_id);
                    table.ForeignKey(
                        name: "fk_maintenance_schedules_vehicletypes_vehicle_type_id",
                        column: x => x.vehicle_type_id,
                        principalTable: "vehicletype",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "notification",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    notification_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    notification_category_id = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    data = table.Column<string>(type: "json", nullable: true),
                    link = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    link_label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    trigger_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    triggered_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    scheduled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    send_attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    error_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    pts_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    issue_tracker_id = table.Column<int>(type: "integer", nullable: true),
                    active_alarm_id = table.Column<int>(type: "integer", nullable: true),
                    notification_policy_id = table.Column<int>(type: "integer", nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    archived_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification", x => x.id);
                    table.ForeignKey(
                        name: "FK_Notification_IssueTracker",
                        column: x => x.issue_tracker_id,
                        principalTable: "issuetracker",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "notification_group",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    allowed_delivery_methods = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_group", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "notification_group_member",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    group_id = table.Column<int>(type: "integer", nullable: false),
                    member_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    member_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_group_member", x => x.id);
                    table.ForeignKey(
                        name: "FK_NotificationGroupMember_Group",
                        column: x => x.group_id,
                        principalTable: "notification_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_policy",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notification_category_id = table.Column<int>(type: "integer", nullable: false),
                    notification_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    max_notifications_per_hour = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    max_notifications_per_day = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    cooldown_minutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    enable_email = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    enable_sms = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    enable_system = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    enable_sound = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sound_file = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    escalation_rules = table.Column<string>(type: "json", nullable: true),
                    trigger_conditions = table.Column<string>(type: "json", nullable: true),
                    recipient_rules = table.Column<string>(type: "json", nullable: true),
                    schedule_configuration = table.Column<string>(type: "json", nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    pts_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    title_template = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    message_template = table.Column<string>(type: "text", nullable: true),
                    email_template = table.Column<string>(type: "text", nullable: true),
                    sms_template = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    require_acknowledgment = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    acknowledgment_timeout_minutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    create_issue_tracker = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    issue_category = table.Column<int>(type: "integer", nullable: true),
                    issue_priority = table.Column<int>(type: "integer", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notification_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_notification_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_policy", x => x.id);
                    table.ForeignKey(
                        name: "FK_NotificationPolicy_IssueCategory",
                        column: x => x.issue_category,
                        principalTable: "issuecategory",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NotificationPolicy_IssuePriority",
                        column: x => x.issue_priority,
                        principalTable: "issuepriority",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "notification_policy_group",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    policy_id = table.Column<int>(type: "integer", nullable: false),
                    group_id = table.Column<int>(type: "integer", nullable: false),
                    allowed_delivery_methods = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_policy_group", x => x.id);
                    table.ForeignKey(
                        name: "FK_NotificationPolicyGroup_Group",
                        column: x => x.group_id,
                        principalTable: "notification_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotificationPolicyGroup_Policy",
                        column: x => x.policy_id,
                        principalTable: "notification_policy",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_policy_recipient",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    notification_policy_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    delivery_methods = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "System"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    priority_override = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_policy_recipient", x => x.id);
                    table.ForeignKey(
                        name: "FK_NotificationPolicyRecipient_NotificationPolicy",
                        column: x => x.notification_policy_id,
                        principalTable: "notification_policy",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_recipient",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    notification_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    delivery_method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    recipient_address = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    delivery_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    delivered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    delivery_attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    delivery_error = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_acknowledged = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    acknowledged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    priority_override = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    delivery_metadata = table.Column<string>(type: "json", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_recipient", x => x.id);
                    table.ForeignKey(
                        name: "FK_NotificationRecipient_Notification",
                        column: x => x.notification_id,
                        principalTable: "notification",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notificationcategories",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    default_priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    display_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    icon_class = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    default_require_acknowledgment = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    default_delivery_methods = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "System"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notificationcategories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ptsdevice",
                columns: table => new
                {
                    ptsid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    pts_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ipaddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    port_number = table.Column<int>(type: "integer", nullable: true),
                    login = table.Column<string>(type: "character varying(145)", maxLength: 145, nullable: true),
                    password = table.Column<string>(type: "character varying(1045)", maxLength: 1045, nullable: true),
                    protocol_security_type = table.Column<string>(type: "character varying(145)", maxLength: 145, nullable: true),
                    authentication_type = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    site = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<short>(type: "smallint", nullable: false),
                    is_authenticated = table.Column<short>(type: "smallint", nullable: false),
                    web_socket_capable = table.Column<short>(type: "smallint", nullable: false),
                    allowed_for_direct_commands = table.Column<short>(type: "smallint", nullable: false),
                    last_activity = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    connection_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    auto_assign_user_master_tag = table.Column<short>(type: "smallint", nullable: true, defaultValue: (short)0),
                    enable_location_validation = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    require_vehicle_proximity = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    require_mobile_app_proximity = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    vehicle_proximity_radius = table.Column<int>(type: "integer", nullable: true, defaultValue: 100),
                    mobile_app_proximity_radius = table.Column<int>(type: "integer", nullable: true, defaultValue: 50),
                    bypass_on_gps_failure = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)1),
                    minimum_gps_accuracy = table.Column<int>(type: "integer", nullable: true, defaultValue: 20),
                    proximity_grace_period_meters = table.Column<int>(type: "integer", nullable: true, defaultValue: 10)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ptsdevice", x => x.ptsid);
                });

            migrationBuilder.CreateTable(
                name: "ptsdevice_pendingcommands",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    command_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    pts_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    command_data_json = table.Column<string>(type: "text", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    delivered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    response_json = table.Column<string>(type: "text", nullable: true),
                    response_code = table.Column<int>(type: "integer", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    expiry_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ptsdevice_ptsid = table.Column<string>(type: "character varying(100)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ptsdevice_pendingcommands", x => x.id);
                    table.ForeignKey(
                        name: "FK_device_commands_ptsdevice",
                        column: x => x.pts_device_id,
                        principalTable: "ptsdevice",
                        principalColumn: "ptsid",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_ptsdevice_pendingcommands_ptsdevice_ptsdevice_ptsid",
                        column: x => x.ptsdevice_ptsid,
                        principalTable: "ptsdevice",
                        principalColumn: "ptsid");
                });

            migrationBuilder.CreateTable(
                name: "pumptransaction",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pts_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    packet_id = table.Column<int>(type: "integer", nullable: false),
                    date_time_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    pump = table.Column<int>(type: "integer", nullable: true),
                    nozzle = table.Column<int>(type: "integer", nullable: true),
                    fuel_grade_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_grade_name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    transaction = table.Column<int>(type: "integer", nullable: true),
                    volume = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: true),
                    tcvolume = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: true),
                    price = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: true),
                    amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    total_volume = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: true),
                    total_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    tag = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    user_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    configuration_id = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    destination_tank_id = table.Column<int>(type: "integer", nullable: true),
                    employee_id = table.Column<int>(type: "integer", nullable: true),
                    is_transfer_mode = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false, comment: "True for tank-to-tank transfers, false for vehicle fueling"),
                    odometer = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true, comment: "Vehicle odometer reading at time of fueling"),
                    fuel_level_before = table.Column<decimal>(type: "numeric(12,3)", precision: 12, scale: 3, nullable: true, comment: "Vehicle fuel level before fueling (GPS sensor, liters)"),
                    fuel_level_after = table.Column<decimal>(type: "numeric(12,3)", precision: 12, scale: 3, nullable: true, comment: "Vehicle fuel level after fueling (GPS sensor, liters)"),
                    mobile_latitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true, comment: "Mobile app GPS latitude at time of fueling authorization"),
                    mobile_longitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true, comment: "Mobile app GPS longitude at time of fueling authorization"),
                    mobile_accuracy = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Mobile app GPS accuracy in meters at time of fueling"),
                    has_been_processed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false, comment: "Indicates whether this transaction has been processed by business logic")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pumptransaction", x => x.id);
                    table.ForeignKey(
                        name: "FK_pumptransaction",
                        column: x => x.pts_id,
                        principalTable: "ptsdevice",
                        principalColumn: "ptsid");
                    table.ForeignKey(
                        name: "FK_pumptransaction_employee",
                        column: x => x.employee_id,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "reconciliation_event_triggers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    policy_id = table.Column<int>(type: "integer", nullable: false),
                    trigger_reason = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    triggered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_processed = table.Column<bool>(type: "boolean", nullable: false),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    metadata_json = table.Column<string>(type: "text", nullable: false),
                    triggered_by = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reconciliation_event_triggers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reconciliationdiscrepancy",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    policy_execution_id = table.Column<int>(type: "integer", nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    detected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    current_stock = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    expected_stock = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    absolute_variance = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    percentage_variance = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    discrepancy_type = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    severity = table.Column<int>(type: "integer", nullable: false),
                    is_resolved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resolution_method = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    analysis_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    trend_analysis = table.Column<string>(type: "text", nullable: true),
                    business_impact_score = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reconciliationdiscrepancy", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reconciliationpolicy",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    execution_type = table.Column<int>(type: "integer", nullable: false),
                    schedule_frequency_hours = table.Column<int>(type: "integer", nullable: true),
                    schedule_configuration = table.Column<string>(type: "text", nullable: true),
                    discrepancy_threshold = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    discrepancy_percentage_threshold = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    tank_scope_configuration = table.Column<string>(type: "text", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 100),
                    max_tanks_per_execution = table.Column<int>(type: "integer", nullable: true),
                    notification_configuration = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    modified_by = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    modified_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_executed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_execution = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reconciliationpolicy", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reconciliationpolicyexecution",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    policy_id = table.Column<int>(type: "integer", nullable: false),
                    execution_start_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    executed_by = table.Column<string>(type: "text", nullable: false),
                    execution_end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    tanks_evaluated = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    discrepancies_detected = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    tanks_reconciled = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    reconciliation_failures = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    total_volume_variance = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    average_percentage_variance = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    execution_duration_ms = table.Column<long>(type: "bigint", nullable: true),
                    error_message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    execution_results = table.Column<string>(type: "text", nullable: true),
                    execution_log = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reconciliationpolicyexecution", x => x.id);
                    table.ForeignKey(
                        name: "FK_ReconciliationPolicyExecution_Policy",
                        column: x => x.policy_id,
                        principalTable: "reconciliationpolicy",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "refreshtokens",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    user_id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_revoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    revocation_reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_by_ip = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    last_used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_used_by_ip = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    replaced_by_token_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_refreshtokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_refreshtokens_refreshtokens_replaced_by_token_id",
                        column: x => x.replaced_by_token_id,
                        principalTable: "refreshtokens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "role_user",
                columns: table => new
                {
                    roles_id = table.Column<string>(type: "character varying(100)", nullable: false),
                    users_id = table.Column<string>(type: "character varying(100)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_role_user", x => new { x.roles_id, x.users_id });
                    table.ForeignKey(
                        name: "fk_role_user_role_roles_id",
                        column: x => x.roles_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "site",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true, comment: "Indicates whether the site is active for fuel reporting"),
                    site_administrator_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    gps_gate_tag_id = table.Column<int>(type: "integer", nullable: true, comment: "The GPSGate tag ID for monitoring vehicles at this site"),
                    gps_gate_tag_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, comment: "The GPSGate tag name for display purposes"),
                    auto_update_gps_gate_tag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true, comment: "Whether to automatically update GPSGate tags when vehicles are transferred"),
                    gps_geofence_id = table.Column<int>(type: "integer", nullable: true, comment: "Selected local GPS geofence ID from gps_geofence"),
                    gps_geofence_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true, comment: "Selected GPS geofence display name snapshot"),
                    gps_geofence_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true, comment: "Selected GPS geofence type snapshot: Circle, Polygon, Route"),
                    gps_geofence_center_latitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true, comment: "Selected GPS geofence center latitude snapshot"),
                    gps_geofence_center_longitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true, comment: "Selected GPS geofence center longitude snapshot"),
                    classification = table.Column<int>(type: "integer", nullable: false, defaultValue: 0, comment: "Operational classification: 0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_site", x => x.id);
                    table.ForeignKey(
                        name: "FK_Site_GpsGeofence",
                        column: x => x.gps_geofence_id,
                        principalTable: "gps_geofence",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                },
                comment: "			");

            migrationBuilder.CreateTable(
                name: "site_user",
                columns: table => new
                {
                    sites_id = table.Column<int>(type: "integer", nullable: false),
                    users_id = table.Column<string>(type: "character varying(100)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_site_user", x => new { x.sites_id, x.users_id });
                    table.ForeignKey(
                        name: "fk_site_user_site_sites_id",
                        column: x => x.sites_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stock_adjustments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    adjustment_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    previous_volume = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    new_volume = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    volume_change = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    adjustment_type = table.Column<int>(type: "integer", nullable: false, comment: "0=Increase, 1=Decrease, 2=Correction"),
                    reason_code = table.Column<int>(type: "integer", nullable: false),
                    reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    approved_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    approved_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1, comment: "0=Pending, 1=Approved, 2=Rejected"),
                    tank_volume_history_id = table.Column<int>(type: "integer", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    is_correction = table.Column<bool>(type: "boolean", nullable: false),
                    corrects_record_id = table.Column<int>(type: "integer", nullable: true),
                    correction_reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_stock_adjustments", x => x.id);
                    table.ForeignKey(
                        name: "fk_stock_adjustments_site",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_stock_adjustments_stock_adjustments_corrects_record_id",
                        column: x => x.corrects_record_id,
                        principalTable: "stock_adjustments",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "stock_reports",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    report_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    generated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    generated_by = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    file_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    file_size = table.Column<long>(type: "bigint", nullable: true),
                    parameters = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    error_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    generated_by_navigation_id = table.Column<string>(type: "character varying(100)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_stock_reports", x => x.id);
                    table.ForeignKey(
                        name: "fk_stock_reports_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "tag",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: true, defaultValueSql: "'1'"),
                    fuel_rule_set_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    is_master = table.Column<short>(type: "smallint", nullable: true, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tag", x => x.id);
                    table.UniqueConstraint("ak_fuel_tags_name", x => x.name);
                    table.ForeignKey(
                        name: "FuelRuleSetId_FK",
                        column: x => x.fuel_rule_set_id,
                        principalTable: "fuelingruleset",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    first_name = table.Column<string>(type: "text", nullable: true),
                    last_name = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValueSql: "'0'"),
                    master_rfid_tag = table.Column<int>(type: "integer", nullable: true),
                    department_id = table.Column<int>(type: "integer", nullable: true),
                    bypass_location_validation = table.Column<bool>(type: "boolean", nullable: false),
                    require_password_change_on_first_login = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    user_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    normalized_user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    password_hash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    security_stamp = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    concurrency_stamp = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    phone_number = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    phone_number_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    two_factor_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    lockout_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    lockout_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    access_failed_count = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user", x => x.id);
                    table.ForeignKey(
                        name: "FK_TagID_TAGID",
                        column: x => x.master_rfid_tag,
                        principalTable: "tag",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_user_departments_department_id",
                        column: x => x.department_id,
                        principalTable: "departments",
                        principalColumn: "department_id");
                });

            migrationBuilder.CreateTable(
                name: "user_activity",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    action = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    controller = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    action_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    parameters = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_activity", x => x.id);
                    table.ForeignKey(
                        name: "user_activity_user_fk",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_dashboard_layout",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", maxLength: 36, nullable: false),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    layout_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    layout_json = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_dashboard_layout", x => x.id);
                    table.ForeignKey(
                        name: "FK_UserDashboardLayout_User",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_notification_preference",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    notification_category_id = table.Column<int>(type: "integer", nullable: false),
                    delivery_methods = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "System"),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    quiet_hours_start = table.Column<TimeSpan>(type: "interval", nullable: true),
                    quiet_hours_end = table.Column<TimeSpan>(type: "interval", nullable: true),
                    max_notifications_per_hour = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    max_notifications_per_day = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    require_acknowledgment = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_notification_preference", x => x.id);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_Category",
                        column: x => x.notification_category_id,
                        principalTable: "notificationcategories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_CreatedBy",
                        column: x => x.created_by,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_UpdatedBy",
                        column: x => x.updated_by,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_User",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_push_devices",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    device_token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    device_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    app_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_push_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    failed_attempts = table.Column<int>(type: "integer", nullable: false),
                    last_error = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_push_devices", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_push_devices_user_user_id",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "userroles",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    role_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_userroles", x => new { x.user_id, x.role_id });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "usersite",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usersite", x => new { x.site_id, x.user_id });
                    table.ForeignKey(
                        name: "SiteID",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "UserID",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "vehicle",
                columns: table => new
                {
                    vehicle_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_code = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    vehicle_type_id = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "'1'"),
                    vehicle_model_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_manufacturer_id = table.Column<int>(type: "integer", nullable: true),
                    yom = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    device_id = table.Column<int>(type: "integer", nullable: true),
                    default_employee_id = table.Column<int>(type: "integer", nullable: true),
                    working_site_id = table.Column<int>(type: "integer", nullable: true),
                    excess_working_hr_cost = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    number_plate = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    average_km_l = table.Column<bool>(type: "boolean", nullable: false),
                    fuel_tank_capacity = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    is_full_tank_policy = table.Column<bool>(type: "boolean", nullable: true),
                    has_gps_installed = table.Column<short>(type: "smallint", nullable: true),
                    passenger = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    current_physical_reading = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    is_company_vehicle = table.Column<short>(type: "smallint", nullable: true),
                    is_active = table.Column<short>(type: "smallint", nullable: true),
                    vehicle_status_value = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    movement_profile = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    gpsgategenerated_id = table.Column<short>(type: "smallint", nullable: true),
                    default_exptd_avgid = table.Column<int>(type: "integer", nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle", x => x.vehicle_id);
                    table.ForeignKey(
                        name: "Vehicle_employee",
                        column: x => x.default_employee_id,
                        principalTable: "employee",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicle_expectedAvg",
                        column: x => x.default_exptd_avgid,
                        principalTable: "expectedaverage",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "vehicle_manufacturer",
                        column: x => x.vehicle_manufacturer_id,
                        principalTable: "vehiclemanufacturer",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicle_model",
                        column: x => x.vehicle_model_id,
                        principalTable: "vehiclemodel",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicle_site",
                        column: x => x.working_site_id,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicle_user1",
                        column: x => x.created_by,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicle_vehicleType",
                        column: x => x.vehicle_type_id,
                        principalTable: "vehicletype",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehilce_user",
                        column: x => x.modified_by,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "tag_change_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    username = table.Column<string>(type: "text", nullable: false),
                    old_tag = table.Column<string>(type: "text", nullable: false),
                    new_tag = table.Column<string>(type: "text", nullable: false),
                    location = table.Column<string>(type: "text", nullable: false),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tag_change_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_tag_change_logs_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tag_monitoring_config",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    tag_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValueSql: "'1'"),
                    ignored_locations = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    monitored = table.Column<bool>(type: "boolean", nullable: false, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tag_monitoring_config", x => x.id);
                    table.ForeignKey(
                        name: "FK_TagMonitoringConfig_Vehicle",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id");
                });

            migrationBuilder.CreateTable(
                name: "tank",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    tank_volume = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: false),
                    tank_height = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    pts_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    probe_number = table.Column<int>(type: "integer", nullable: true),
                    pts_tank_id = table.Column<int>(type: "integer", nullable: true),
                    use_pts_probe_readings = table.Column<bool>(type: "boolean", nullable: false),
                    probe_physical_stock_update_source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    calibration_chart_source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    product_volume_source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    use_book_keeping = table.Column<short>(type: "smallint", nullable: true, defaultValueSql: "'0'"),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    discrepancy_threshold = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    tank_length = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    current_stock = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    last_stock_update = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    physical_stock_value = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    last_physical_stock_update = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    physical_stock_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    fuel_grade_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_grade_name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    has_automatic_book_keeping = table.Column<short>(type: "smallint", nullable: true),
                    priority = table.Column<string>(type: "text", nullable: true),
                    tank_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Stationary"),
                    latitude = table.Column<decimal>(type: "numeric(10,8)", precision: 10, scale: 8, nullable: true),
                    longitude = table.Column<decimal>(type: "numeric(11,8)", precision: 11, scale: 8, nullable: true),
                    linked_vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    location_validation_radius = table.Column<int>(type: "integer", nullable: true, defaultValue: 100)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tank", x => x.id);
                    table.ForeignKey(
                        name: "FK_Tank_LinkedVehicle",
                        column: x => x.linked_vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "Tank_ptsdevice",
                        column: x => x.pts_id,
                        principalTable: "ptsdevice",
                        principalColumn: "ptsid",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "Tank_site",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "vehicle_expected_average_assignments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    expected_fuel_average_template_id = table.Column<int>(type: "integer", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    override_expected_value = table.Column<decimal>(type: "numeric", nullable: true),
                    override_tolerance_percent = table.Column<decimal>(type: "numeric", nullable: true),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_expected_average_assignments", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicle_expected_average_assignments_expected_fuel_average_",
                        column: x => x.expected_fuel_average_template_id,
                        principalTable: "expected_fuel_average_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_vehicle_expected_average_assignments_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_last_known_location",
                columns: table => new
                {
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    latitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    longitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    altitude = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    speed = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    heading = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    is_gps_valid = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    device_activity_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    external_device_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    cached_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "GPSGate")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_last_known_location", x => x.vehicle_id);
                    table.ForeignKey(
                        name: "fk_vehicle_last_known_location_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_maintenances",
                columns: table => new
                {
                    maintenance_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    maintenance_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    scheduled_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    odometer_at_schedule = table.Column<decimal>(type: "numeric", nullable: true),
                    odometer_at_completion = table.Column<decimal>(type: "numeric", nullable: true),
                    next_due_odometer = table.Column<decimal>(type: "numeric", nullable: true),
                    next_due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cost = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    service_provider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    issue_note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    is_overdue = table.Column<bool>(type: "boolean", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    responsible_person = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    maintenance_schedule_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_maintenances", x => x.maintenance_id);
                    table.ForeignKey(
                        name: "fk_vehicle_maintenances_maintenance_schedules_maintenance_sche",
                        column: x => x.maintenance_schedule_id,
                        principalTable: "maintenance_schedules",
                        principalColumn: "schedule_id");
                    table.ForeignKey(
                        name: "fk_vehicle_maintenances_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_provider_mappings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    provider_config_id = table.Column<int>(type: "integer", nullable: false),
                    external_device_id = table.Column<string>(type: "character varying(191)", maxLength: 191, nullable: true),
                    device_imei = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    device_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    device_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    has_fuel_sensor = table.Column<bool>(type: "boolean", nullable: true),
                    fuel_sensor_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    fuel_sensor_verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    metadata = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_provider_mappings", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicle_provider_mappings_provider_configurations_provider_",
                        column: x => x.provider_config_id,
                        principalTable: "provider_configurations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_vehicle_provider_mappings_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_transfers",
                columns: table => new
                {
                    transfer_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    delivery_note_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    from_site_id = table.Column<int>(type: "integer", nullable: false),
                    to_site_id = table.Column<int>(type: "integer", nullable: false),
                    transfer_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    driver_id = table.Column<int>(type: "integer", nullable: true),
                    driver_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    driver_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    job_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    current_reading = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    reading_unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true, defaultValue: "hrs"),
                    next_service_reading = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    battery_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    make_model = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    fuel_in_tank = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    seal_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    departure_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    arrival_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    anti_theft_checked_departure = table.Column<bool>(type: "boolean", nullable: false),
                    anti_theft_checked_arrival = table.Column<bool>(type: "boolean", nullable: false),
                    keys_in_envelope_checked = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    remarks = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    service_filter_parts = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    sender_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    sender_function = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    receiver_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    receiver_function = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    approved_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    workshop_manager_sign = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    receiver_user_id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    approver_user_id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    dispatched_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    received_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_reminder_sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reminder_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    document_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    document_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    email_sent = table.Column<bool>(type: "boolean", nullable: false),
                    email_sent_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    gps_device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    gps_device_condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    gps_device_working = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    gps_device_remarks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    fuel_sensor_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    fuel_sensor_condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    fuel_sensor_working = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    fuel_sensor_remarks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    vehicle_manufacturer = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    vehicle_model_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_transfers", x => x.transfer_id);
                    table.ForeignKey(
                        name: "fk_vehicle_transfers_employees_driver_id",
                        column: x => x.driver_id,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_transfers_sites_from_site_id",
                        column: x => x.from_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_transfers_sites_to_site_id",
                        column: x => x.to_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_transfers_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip_cluster_snapshot",
                columns: table => new
                {
                    vehicle_trip_cluster_snapshot_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    trip_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    cluster_index = table.Column<int>(type: "integer", nullable: false),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    classification = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Unknown"),
                    matched_site_id = table.Column<int>(type: "integer", nullable: true),
                    matched_site_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    centroid_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    centroid_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    visit_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    average_dwell_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    snapshot_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "RealtimeDetector"),
                    metadata_json = table.Column<string>(type: "text", nullable: true),
                    captured_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_trip_cluster_snapshot", x => x.vehicle_trip_cluster_snapshot_id);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_cluster_snapshot_site_matched_site_id",
                        column: x => x.matched_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_cluster_snapshot_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip_group",
                columns: table => new
                {
                    vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    trip_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    start_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    origin_site_id = table.Column<int>(type: "integer", nullable: true),
                    destination_site_id = table.Column<int>(type: "integer", nullable: true),
                    trip_count = table.Column<int>(type: "integer", nullable: false),
                    total_distance_km = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    total_duration_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    movement_profile = table.Column<int>(type: "integer", nullable: false),
                    detection_mode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    total_fuel_consumed = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    grouping_type = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    confidence_score = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 1.00m),
                    confidence_band = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "High"),
                    anomaly_flags = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    reconciliation_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    project_plan_id = table.Column<int>(type: "integer", nullable: true),
                    work_shift_id = table.Column<int>(type: "integer", nullable: true),
                    planned_haul_route_id = table.Column<int>(type: "integer", nullable: true),
                    planned_origin_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planned_destination_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planning_match_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_out_of_bounds = table.Column<bool>(type: "boolean", nullable: true),
                    is_productive_movement = table.Column<bool>(type: "boolean", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_trip_group", x => x.vehicle_trip_group_id);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_group_site_destination_site_id",
                        column: x => x.destination_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_group_site_origin_site_id",
                        column: x => x.origin_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_group_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicleconsumption",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    max_speed = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    avg_speed = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    expected_consumption = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    total_distance = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    employee_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    comments = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    fuel_lost = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    fuel_efficiency = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    total_fuel = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    flow_meter_fuel_used = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    flow_meter_fuel_lost = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    flow_meter_effiency = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    eng_hours = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    flow_meter_engine_hrs = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    excess_working_hrs_cost = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    is_night_shift = table.Column<decimal>(type: "numeric(20,0)", nullable: false, defaultValue: 0m),
                    is_kmper_liter = table.Column<decimal>(type: "numeric(20,0)", nullable: false, defaultValue: 0m),
                    modified_by = table.Column<int>(type: "integer", nullable: true),
                    modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_modified = table.Column<short>(type: "smallint", nullable: true),
                    report_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicleconsumption", x => x.id);
                    table.ForeignKey(
                        name: "vehicleconsumption_site",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicleconsumption_vehicle",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id");
                });

            migrationBuilder.CreateTable(
                name: "warning_letter",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    letter_type = table.Column<int>(type: "integer", nullable: false),
                    employee_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    letter_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    period_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    violation_summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    expected_value = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    actual_value = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    excess_value = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    fuel_price = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    excess_cost = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    issued_by_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    issued_by_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    issued_by_title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    hide_warning_count_in_subject = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    pdf_file_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    email_sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    email_recipient = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    signature_request_recipient_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    signature_request_recipient = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    signature_request_cc_user_ids = table.Column<string>(type: "text", nullable: true),
                    signature_request_cc_recipients = table.Column<string>(type: "text", nullable: true),
                    signature_requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    signature_requested_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    approve_letter_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    approve_letter_stored_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    approve_letter_file_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    approve_letter_content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    approve_letter_file_size = table.Column<long>(type: "bigint", nullable: true),
                    approve_letter_uploaded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approve_letter_uploaded_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    signed_copy_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    signed_copy_stored_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    signed_copy_file_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    signed_copy_content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    signed_copy_file_size = table.Column<long>(type: "bigint", nullable: true),
                    signed_copy_uploaded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    signed_copy_uploaded_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    employee_acknowledged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_warning_letter", x => x.id);
                    table.ForeignKey(
                        name: "fk_warning_letter_employee_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_warning_letter_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_warning_letter_user_created_by",
                        column: x => x.created_by,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_warning_letter_user_issued_by_user_id",
                        column: x => x.issued_by_user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_warning_letter_user_modified_by",
                        column: x => x.modified_by,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_warning_letter_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tankmeasurement",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fuel_grade_id = table.Column<int>(type: "integer", nullable: false),
                    ptsid = table.Column<string>(type: "text", nullable: false),
                    product_height = table.Column<double>(type: "double precision", nullable: true),
                    water_height = table.Column<double>(type: "double precision", nullable: true),
                    temperature = table.Column<double>(type: "double precision", nullable: true),
                    product_volume = table.Column<double>(type: "double precision", nullable: true),
                    water_volume = table.Column<double>(type: "double precision", nullable: true),
                    product_tcvolume = table.Column<double>(type: "double precision", nullable: true),
                    product_density = table.Column<double>(type: "double precision", nullable: true),
                    product_mass = table.Column<double>(type: "double precision", nullable: true),
                    tank_filling_percentage = table.Column<int>(type: "integer", nullable: true),
                    configuration_id = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    packet_id = table.Column<int>(type: "integer", nullable: false),
                    product_ullage = table.Column<double>(type: "double precision", nullable: true),
                    status = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    tank = table.Column<int>(type: "integer", nullable: false),
                    fuel_grade_name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tankmeasurement", x => x.id);
                    table.ForeignKey(
                        name: "fk_tankmeasurement_tank_tank_id",
                        column: x => x.tank_id,
                        principalTable: "tank",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "tankstock",
                columns: table => new
                {
                    entry_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    entry_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    manual_opening_level = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    manual_closing_level = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    opening_meter = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Physical meter reading at the time of opening stock"),
                    closing_meter = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Physical meter reading at the time of closing stock"),
                    manual_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    manual_calculated_usage = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    sensor_opening_level = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    expected_closing_level = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    discrepancy = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    sensor_closing_level = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    recorded_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: false),
                    sensor_calculated_usage = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    entry_type = table.Column<int>(type: "integer", nullable: false),
                    sensor_discrepancy = table.Column<decimal>(type: "numeric(10)", precision: 10, nullable: true),
                    delivery_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Total delivery amount for this tank on this day"),
                    delivery_id = table.Column<int>(type: "integer", nullable: true, comment: "Reference to Delivery record if delivery occurred"),
                    transfer_in_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Total fuel transferred INTO this tank from other tanks on this day"),
                    transfer_out_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true, comment: "Total fuel transferred OUT of this tank to other tanks on this day"),
                    transfer_record_id = table.Column<int>(type: "integer", nullable: true, comment: "Reference to TankTransfer record if transfer occurred"),
                    import_batch_id = table.Column<string>(type: "text", nullable: true),
                    imported_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    import_source = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    active_entry_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true, comment: "Unique key for active entries: {TankId}-{Date}. NULL for deleted entries.")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tankstock", x => x.entry_id);
                    table.ForeignKey(
                        name: "TankID",
                        column: x => x.tank_id,
                        principalTable: "tank",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "TankStock_User",
                        column: x => x.recorded_by,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "TankStock_site",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "tanktransfer",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    source_tank_id = table.Column<int>(type: "integer", nullable: true),
                    destination_tank_id = table.Column<int>(type: "integer", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(10,0)", precision: 10, scale: 0, nullable: true),
                    transfer_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    recorded_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    is_correction = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    corrects_record_id = table.Column<int>(type: "integer", nullable: true),
                    correction_reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tanktransfer", x => x.id);
                    table.ForeignKey(
                        name: "FK_TankTransfer_CorrectsRecord",
                        column: x => x.corrects_record_id,
                        principalTable: "tanktransfer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TankTransfer_DeletedBy",
                        column: x => x.deleted_by,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "dest",
                        column: x => x.destination_tank_id,
                        principalTable: "tank",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "recordedby",
                        column: x => x.recorded_by,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "source",
                        column: x => x.source_tank_id,
                        principalTable: "tank",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "tankvolumehistory",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    volume_change = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    new_volume = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    change_reason = table.Column<int>(type: "integer", nullable: false),
                    recorded_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    reference_id = table.Column<int>(type: "integer", nullable: true),
                    reference_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValueSql: "'0'"),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tankvolumehistory", x => x.id);
                    table.ForeignKey(
                        name: "FK_TankVolumeHistory_Tank",
                        column: x => x.tank_id,
                        principalTable: "tank",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_TankVolumeHistory_User",
                        column: x => x.recorded_by,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_tankvolumehistory_user_DeletedBy",
                        column: x => x.deleted_by,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "uploadstatusprobereading",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    device_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    probe_number = table.Column<int>(type: "integer", nullable: false),
                    product_height = table.Column<double>(type: "double precision", nullable: true),
                    water_height = table.Column<double>(type: "double precision", nullable: true),
                    temperature = table.Column<double>(type: "double precision", nullable: true),
                    product_volume = table.Column<double>(type: "double precision", nullable: true),
                    water_volume = table.Column<double>(type: "double precision", nullable: true),
                    product_tcvolume = table.Column<double>(type: "double precision", nullable: true),
                    product_density = table.Column<double>(type: "double precision", nullable: true),
                    product_mass = table.Column<double>(type: "double precision", nullable: true),
                    tank_filling_percentage = table.Column<int>(type: "integer", nullable: true),
                    product_ullage = table.Column<double>(type: "double precision", nullable: true),
                    tank_id = table.Column<int>(type: "integer", nullable: true),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_grade_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_grade_name = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_uploadstatusprobereading", x => x.id);
                    table.ForeignKey(
                        name: "fk_uploadstatusprobereading_tank_tank_id",
                        column: x => x.tank_id,
                        principalTable: "tank",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_transfer_battery_details",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    transfer_id = table.Column<int>(type: "integer", nullable: false),
                    battery_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    voltage = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    remarks = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_transfer_battery_details", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicle_transfer_battery_details_vehicle_transfers_transfer",
                        column: x => x.transfer_id,
                        principalTable: "vehicle_transfers",
                        principalColumn: "transfer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_transfer_checkup_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    transfer_id = table.Column<int>(type: "integer", nullable: false),
                    serial_no = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    check_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_good = table.Column<bool>(type: "boolean", nullable: true),
                    is_fair = table.Column<bool>(type: "boolean", nullable: true),
                    is_damaged = table.Column<bool>(type: "boolean", nullable: true),
                    is_worn = table.Column<bool>(type: "boolean", nullable: true),
                    worn_percentage = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    remarks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_transfer_checkup_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicle_transfer_checkup_items_vehicle_transfers_transfer_id",
                        column: x => x.transfer_id,
                        principalTable: "vehicle_transfers",
                        principalColumn: "transfer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_transfer_tyre_details",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    transfer_id = table.Column<int>(type: "integer", nullable: false),
                    position = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    size = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    condition = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    remarks = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_transfer_tyre_details", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicle_transfer_tyre_details_vehicle_transfers_transfer_id",
                        column: x => x.transfer_id,
                        principalTable: "vehicle_transfers",
                        principalColumn: "transfer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip",
                columns: table => new
                {
                    vehicle_trip_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    sequence_no = table.Column<int>(type: "integer", nullable: false),
                    start_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    origin_site_id = table.Column<int>(type: "integer", nullable: true),
                    destination_site_id = table.Column<int>(type: "integer", nullable: true),
                    origin_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    destination_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    start_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    start_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    end_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    end_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    distance_km = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    duration_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    max_speed_kph = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    movement_profile = table.Column<int>(type: "integer", nullable: false),
                    detection_mode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    start_track_info_id = table.Column<int>(type: "integer", nullable: true),
                    end_track_info_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_at_departure = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fuel_at_arrival = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fuel_consumed = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    confidence_score = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 1.00m),
                    confidence_band = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "High"),
                    anomaly_flags = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    reconciliation_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_low_confidence = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    project_plan_id = table.Column<int>(type: "integer", nullable: true),
                    work_shift_id = table.Column<int>(type: "integer", nullable: true),
                    planned_haul_route_id = table.Column<int>(type: "integer", nullable: true),
                    planned_origin_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planned_destination_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planning_match_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_out_of_bounds = table.Column<bool>(type: "boolean", nullable: true),
                    is_productive_movement = table.Column<bool>(type: "boolean", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_trip", x => x.vehicle_trip_id);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_site_destination_site_id",
                        column: x => x.destination_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_site_origin_site_id",
                        column: x => x.origin_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_vehicle_trip_group_vehicle_trip_group_id",
                        column: x => x.vehicle_trip_group_id,
                        principalTable: "vehicle_trip_group",
                        principalColumn: "vehicle_trip_group_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tankvolumeadjustmentaudit",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    adjustment_id = table.Column<int>(type: "integer", nullable: false),
                    affected_record_id = table.Column<int>(type: "integer", nullable: false),
                    original_running_balance = table.Column<decimal>(type: "numeric(15,3)", precision: 15, scale: 3, nullable: false),
                    new_running_balance = table.Column<decimal>(type: "numeric(15,3)", precision: 15, scale: 3, nullable: false),
                    adjustment_amount = table.Column<decimal>(type: "numeric(15,3)", precision: 15, scale: 3, nullable: false),
                    adjustment_timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    adjustment_reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    processed_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tank_id = table.Column<int>(type: "integer", nullable: false),
                    original_volume_change = table.Column<decimal>(type: "numeric(15,3)", precision: 15, scale: 3, nullable: true),
                    new_volume_change = table.Column<decimal>(type: "numeric(15,3)", precision: 15, scale: 3, nullable: true),
                    operation_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tankvolumeadjustmentaudit", x => x.id);
                    table.ForeignKey(
                        name: "FK_TankVolumeAdjustmentAudit_Tank",
                        column: x => x.tank_id,
                        principalTable: "tank",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TankVolumeAdjustmentAudit_TankVolumeHistory",
                        column: x => x.affected_record_id,
                        principalTable: "tankvolumehistory",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TankVolumeAdjustmentAudit_User",
                        column: x => x.processed_by,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip_out_of_bounds_event",
                columns: table => new
                {
                    vehicle_trip_out_of_bounds_event_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_trip_id = table.Column<int>(type: "integer", nullable: true),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "BoundaryExit"),
                    occurred_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    geofence_id = table.Column<int>(type: "integer", nullable: true),
                    distance_from_boundary_meters = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    duration_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    metadata_json = table.Column<string>(type: "text", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_trip_out_of_bounds_event", x => x.vehicle_trip_out_of_bounds_event_id);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_out_of_bounds_event_site_site_id",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_out_of_bounds_event_vehicle_trip_group_vehicle",
                        column: x => x.vehicle_trip_group_id,
                        principalTable: "vehicle_trip_group",
                        principalColumn: "vehicle_trip_group_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_out_of_bounds_event_vehicle_trip_vehicle_trip_",
                        column: x => x.vehicle_trip_id,
                        principalTable: "vehicle_trip",
                        principalColumn: "vehicle_trip_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_out_of_bounds_event_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip_override",
                columns: table => new
                {
                    vehicle_trip_override_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_trip_id = table.Column<int>(type: "integer", nullable: true),
                    secondary_vehicle_trip_id = table.Column<int>(type: "integer", nullable: true),
                    result_vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    action_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    requested_by_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    requested_by_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    request_ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    requested_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    required_supervisor_approval = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    supervisor_approval_json = table.Column<string>(type: "text", nullable: true),
                    original_values_json = table.Column<string>(type: "text", nullable: true),
                    new_values_json = table.Column<string>(type: "text", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_trip_override", x => x.vehicle_trip_override_id);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_override_vehicle_trip_group_result_vehicle_tri",
                        column: x => x.result_vehicle_trip_group_id,
                        principalTable: "vehicle_trip_group",
                        principalColumn: "vehicle_trip_group_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_override_vehicle_trip_group_vehicle_trip_group",
                        column: x => x.vehicle_trip_group_id,
                        principalTable: "vehicle_trip_group",
                        principalColumn: "vehicle_trip_group_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_override_vehicle_trip_vehicle_trip_id",
                        column: x => x.vehicle_trip_id,
                        principalTable: "vehicle_trip",
                        principalColumn: "vehicle_trip_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_override_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip_state",
                columns: table => new
                {
                    vehicle_trip_state_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    state_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    movement_profile = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    current_state = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "AT_SITE"),
                    current_site_id = table.Column<int>(type: "integer", nullable: true),
                    current_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    current_site_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    current_cluster_index = table.Column<int>(type: "integer", nullable: true),
                    origin_site_id = table.Column<int>(type: "integer", nullable: true),
                    origin_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    origin_site_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    origin_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    origin_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    trip_start_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    trip_start_track_info_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_at_departure = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    consecutive_out_of_site_points = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    consecutive_at_site_points = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    accumulated_distance_km = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    max_speed_kph = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    last_processed_point_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_gps_timestamp_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    last_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    in_progress_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    in_progress_trip_id = table.Column<int>(type: "integer", nullable: true),
                    recent_points_json = table.Column<string>(type: "text", nullable: true),
                    known_clusters_json = table.Column<string>(type: "text", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_trip_state", x => x.vehicle_trip_state_id);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_state_site_current_site_id",
                        column: x => x.current_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_state_site_origin_site_id",
                        column: x => x.origin_site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_state_vehicle_trip_groups_in_progress_trip_gro",
                        column: x => x.in_progress_trip_group_id,
                        principalTable: "vehicle_trip_group",
                        principalColumn: "vehicle_trip_group_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_state_vehicle_trips_in_progress_trip_id",
                        column: x => x.in_progress_trip_id,
                        principalTable: "vehicle_trip",
                        principalColumn: "vehicle_trip_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_vehicle_trip_state_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_active_events_tank_id",
                table: "active_events",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveEvents_EventType_State",
                table: "active_events",
                columns: new[] { "event_type", "state" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveEvents_ExpressionId",
                table: "active_events",
                column: "event_expression_id");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveEvents_SiteId_State",
                table: "active_events",
                columns: new[] { "site_id", "state" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveEvents_State_TriggeredAt",
                table: "active_events",
                columns: new[] { "state", "triggered_at" });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_GroupId",
                table: "BusinessFunctionNotificationGroups",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_IsActive_TriggerSource",
                table: "BusinessFunctionNotificationGroups",
                columns: new[] { "is_active", "trigger_source" });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_SiteId",
                table: "BusinessFunctionNotificationGroups",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_TriggerSource",
                table: "BusinessFunctionNotificationGroups",
                column: "trigger_source");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_TriggerSource_SiteId",
                table: "BusinessFunctionNotificationGroups",
                columns: new[] { "trigger_source", "site_id" });

            migrationBuilder.CreateIndex(
                name: "UX_BusinessFunctionNotificationGroups_TriggerSource_Group_Site",
                table: "BusinessFunctionNotificationGroups",
                columns: new[] { "trigger_source", "group_id", "site_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_calibrationdata_vehicle_id",
                table: "calibrationdata",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_calibrationdatapoints_tank_interval_recorded",
                table: "calibrationdatapoints",
                columns: new[] { "tank_id", "height_interval", "recorded_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_calibrationdatapoints_tank_processed_recorded",
                table: "calibrationdatapoints",
                columns: new[] { "tank_id", "is_processed", "recorded_at_utc" });

            migrationBuilder.CreateIndex(
                name: "UX_calibrationdatapoints_tank_source_event",
                table: "calibrationdatapoints",
                columns: new[] { "tank_id", "source_type", "source_event_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_calibrationintervalaccumulations_tank_updated",
                table: "calibrationintervalaccumulations",
                columns: new[] { "tank_id", "last_updated_utc" });

            migrationBuilder.CreateIndex(
                name: "UX_calibrationintervalaccumulations_tank_interval",
                table: "calibrationintervalaccumulations",
                columns: new[] { "tank_id", "interval_start_mm", "interval_end_mm" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_configuration_ptsid",
                table: "configuration",
                column: "ptsid");

            migrationBuilder.CreateIndex(
                name: "ix_dailytankreconciliation_tank_id",
                table: "dailytankreconciliation",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_dailytankreconciliation_tank_id_reconciliation_date",
                table: "dailytankreconciliation",
                columns: new[] { "tank_id", "reconciliation_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_Category",
                table: "dashboard_widget_instance",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_IsCustom",
                table: "dashboard_widget_instance",
                column: "is_custom_widget");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_Template",
                table: "dashboard_widget_instance",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_User",
                table: "dashboard_widget_instance",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_UserTemplate",
                table: "dashboard_widget_instance",
                columns: new[] { "user_id", "template_id" });

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetTemplate_Category",
                table: "dashboard_widget_template",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetTemplate_Enabled",
                table: "dashboard_widget_template",
                column: "is_enabled");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetTemplate_Type",
                table: "dashboard_widget_template",
                column: "widget_type");

            migrationBuilder.CreateIndex(
                name: "ix_delivery_deleted_by",
                table: "delivery",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_delivery_recorded_by",
                table: "delivery",
                column: "recorded_by");

            migrationBuilder.CreateIndex(
                name: "ix_delivery_supplier_id",
                table: "delivery",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "ix_delivery_tank_id",
                table: "delivery",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_delivery_tank_id_delivery_date",
                table: "delivery",
                columns: new[] { "tank_id", "delivery_date" });

            migrationBuilder.CreateIndex(
                name: "ix_device_connections_ptsdevice_id",
                table: "device_connections",
                column: "ptsdevice_id");

            migrationBuilder.CreateIndex(
                name: "ix_devicetype_name",
                table: "devicetype",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_discrepancy_records_detected_at",
                table: "DiscrepancyRecords",
                column: "detected_at");

            migrationBuilder.CreateIndex(
                name: "ix_discrepancy_records_execution_id",
                table: "DiscrepancyRecords",
                column: "execution_id");

            migrationBuilder.CreateIndex(
                name: "ix_discrepancy_records_is_resolved",
                table: "DiscrepancyRecords",
                column: "is_resolved");

            migrationBuilder.CreateIndex(
                name: "ix_discrepancy_records_policy_id",
                table: "DiscrepancyRecords",
                column: "policy_id");

            migrationBuilder.CreateIndex(
                name: "ix_discrepancy_records_tank_id",
                table: "DiscrepancyRecords",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_employee_created_by",
                table: "employee",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_employee_modified_by",
                table: "employee",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "ix_employee_site_id",
                table: "employee",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_employee_documents_DocumentType",
                table: "employee_documents",
                column: "document_type");

            migrationBuilder.CreateIndex(
                name: "IX_employee_documents_EmployeeId",
                table: "employee_documents",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_employee_documents_ExpiryDate",
                table: "employee_documents",
                column: "expiry_date");

            migrationBuilder.CreateIndex(
                name: "IX_employee_documents_Status",
                table: "employee_documents",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "UK_employee_documents_EmployeeId_DocumentType_DocumentNumber",
                table: "employee_documents",
                columns: new[] { "employee_id", "document_type", "document_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_employee_position_is_active",
                table: "employee_position",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_employee_position_name",
                table: "employee_position",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_employee_position_sort_order",
                table: "employee_position",
                column: "sort_order");

            migrationBuilder.CreateIndex(
                name: "ix_employeevehicle_employee_id",
                table: "employeevehicle",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLog_CreatedAt",
                table: "error_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLog_UserId",
                table: "error_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_event_expression_executions_issue_tracker_id",
                table: "event_expression_executions",
                column: "issue_tracker_id");

            migrationBuilder.CreateIndex(
                name: "ix_event_expression_executions_notification_id",
                table: "event_expression_executions",
                column: "notification_id");

            migrationBuilder.CreateIndex(
                name: "IX_Executions_EventType_ExecutedAt",
                table: "event_expression_executions",
                columns: new[] { "event_type", "executed_at" });

            migrationBuilder.CreateIndex(
                name: "IX_Executions_ExpressionId_ExecutedAt",
                table: "event_expression_executions",
                columns: new[] { "event_expression_id", "executed_at" });

            migrationBuilder.CreateIndex(
                name: "IX_Executions_ExpressionId_ScopeKey_ExecutedAt",
                table: "event_expression_executions",
                columns: new[] { "event_expression_id", "scope_key", "executed_at" });

            migrationBuilder.CreateIndex(
                name: "ix_event_expressions_assign_issue_to",
                table: "event_expressions",
                column: "assign_issue_to");

            migrationBuilder.CreateIndex(
                name: "ix_event_expressions_created_by",
                table: "event_expressions",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_event_expressions_issue_category",
                table: "event_expressions",
                column: "issue_category");

            migrationBuilder.CreateIndex(
                name: "ix_event_expressions_issue_priority",
                table: "event_expressions",
                column: "issue_priority");

            migrationBuilder.CreateIndex(
                name: "ix_event_expressions_modified_by",
                table: "event_expressions",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "IX_EventExpressions_EventType_IsActive",
                table: "event_expressions",
                columns: new[] { "event_type", "is_active" });

            migrationBuilder.CreateIndex(
                name: "IX_EventExpressions_PolicyId",
                table: "event_expressions",
                column: "notification_policy_id");

            migrationBuilder.CreateIndex(
                name: "IX_EventExpressions_SiteId",
                table: "event_expressions",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_EventExpressions_TankId",
                table: "event_expressions",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_expected_fuel_average_templates_fuel_route_id",
                table: "expected_fuel_average_templates",
                column: "fuel_route_id");

            migrationBuilder.CreateIndex(
                name: "ix_expected_fuel_average_templates_load_classification_id",
                table: "expected_fuel_average_templates",
                column: "load_classification_id");

            migrationBuilder.CreateIndex(
                name: "ix_expected_fuel_average_templates_site_id",
                table: "expected_fuel_average_templates",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_expected_fuel_average_templates_usage_intensity_id",
                table: "expected_fuel_average_templates",
                column: "usage_intensity_id");

            migrationBuilder.CreateIndex(
                name: "ix_expected_fuel_average_templates_vehicle_manufacturer_id",
                table: "expected_fuel_average_templates",
                column: "vehicle_manufacturer_id");

            migrationBuilder.CreateIndex(
                name: "ix_expected_fuel_average_templates_vehicle_model_id",
                table: "expected_fuel_average_templates",
                column: "vehicle_model_id");

            migrationBuilder.CreateIndex(
                name: "ix_expected_fuel_average_templates_vehicle_type_id",
                table: "expected_fuel_average_templates",
                column: "vehicle_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_expectedaverage_expected_average_classification_id",
                table: "expectedaverage",
                column: "expected_average_classification_id");

            migrationBuilder.CreateIndex(
                name: "ix_expectedaverage_site_id",
                table: "expectedaverage",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_expectedaverage_vehicle_id",
                table: "expectedaverage",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_expectedaverage_vehicle_id_site_id_expected_average_classif",
                table: "expectedaverage",
                columns: new[] { "vehicle_id", "site_id", "expected_average_classification_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_flags_audit_id",
                table: "fuel_audit_flags",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_flags_flag_type",
                table: "fuel_audit_flags",
                column: "flag_type");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_flags_severity",
                table: "fuel_audit_flags",
                column: "severity");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_flags_status",
                table: "fuel_audit_flags",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_audit_id",
                table: "fuel_audit_gps_readings",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "idx_data_quality",
                table: "fuel_audit_gps_readings",
                column: "data_quality");

            migrationBuilder.CreateIndex(
                name: "idx_reading_date_type",
                table: "fuel_audit_gps_readings",
                columns: new[] { "reading_date", "reading_type" });

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_id",
                table: "fuel_audit_gps_readings",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "uq_vehicle_date_type",
                table: "fuel_audit_gps_readings",
                columns: new[] { "vehicle_id", "reading_date", "reading_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_sites_audit_id",
                table: "fuel_audit_sites",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_sites_audit_id_site_id",
                table: "fuel_audit_sites",
                columns: new[] { "audit_id", "site_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_sites_site_id",
                table: "fuel_audit_sites",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_tanker_readings_audit_id",
                table: "fuel_audit_tanker_readings",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_tanker_readings_tank_id",
                table: "fuel_audit_tanker_readings",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_thresholds_category",
                table: "fuel_audit_thresholds",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_thresholds_is_active",
                table: "fuel_audit_thresholds",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_variances_audit_id",
                table: "fuel_audit_variances",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_variances_category",
                table: "fuel_audit_variances",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_variances_exceeds_threshold",
                table: "fuel_audit_variances",
                column: "exceeds_threshold");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_vehicle_positions_audit_id",
                table: "fuel_audit_vehicle_positions",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_vehicle_positions_vehicle_id",
                table: "fuel_audit_vehicle_positions",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_audit_vehicle_positions_vehicle_type",
                table: "fuel_audit_vehicle_positions",
                column: "vehicle_type");

            migrationBuilder.CreateIndex(
                name: "ix_fuel_routes_site_id",
                table: "fuel_routes",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelaudits_audit_number",
                table: "fuelaudits",
                column: "audit_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_fuelaudits_start_date_end_date",
                table: "fuelaudits",
                columns: new[] { "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "ix_fuelaudits_status",
                table: "fuelaudits",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_fueling_rule_set_assignments_fueling_rule_set_id",
                table: "fueling_rule_set_assignments",
                column: "fueling_rule_set_id");

            migrationBuilder.CreateIndex(
                name: "ix_fueling_rule_set_assignments_site_id",
                table: "fueling_rule_set_assignments",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_fueling_rule_set_assignments_tag_id",
                table: "fueling_rule_set_assignments",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "ix_fueling_rule_set_assignments_target_type_is_active",
                table: "fueling_rule_set_assignments",
                columns: new[] { "target_type", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_fueling_rule_set_assignments_vehicle_id",
                table: "fueling_rule_set_assignments",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_fueling_rule_set_assignments_vehicle_type_id",
                table: "fueling_rule_set_assignments",
                column: "vehicle_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelingrule_fueling_rule_set_id",
                table: "fuelingrule",
                column: "fueling_rule_set_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelingrule_site_id",
                table: "fuelingrule",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelingrule_vehicle_id",
                table: "fuelingrule",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_corrects_record_id",
                table: "fuelrefil",
                column: "corrects_record_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_date",
                table: "fuelrefil",
                column: "date");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_deleted_by",
                table: "fuelrefil",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_driver_id",
                table: "fuelrefil",
                column: "driver_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_fuel_by",
                table: "fuelrefil",
                column: "fuel_by");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_pump_transcation_id",
                table: "fuelrefil",
                column: "pump_transcation_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_site_id",
                table: "fuelrefil",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_tag_id",
                table: "fuelrefil",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_tank_id",
                table: "fuelrefil",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelrefil_vehicle_id",
                table: "fuelrefil",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_fuelreportgenerate_approved_by",
                table: "fuelreportgenerate",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "ix_fuelreportgenerate_created_by",
                table: "fuelreportgenerate",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_geofence_sync_jobs_created_at",
                table: "geofence_sync_jobs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_geofence_sync_jobs_job_id",
                table: "geofence_sync_jobs",
                column: "job_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_geofence_sync_jobs_status",
                table: "geofence_sync_jobs",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_gps_geofence_external_id",
                table: "gps_geofence",
                column: "external_geofence_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_gps_geofence_group_external_id",
                table: "gps_geofence_group",
                column: "external_group_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_gps_geofence_group_member_geofence_id",
                table: "gps_geofence_group_member",
                column: "geofence_id");

            migrationBuilder.CreateIndex(
                name: "IX_gps_geofence_group_member_unique",
                table: "gps_geofence_group_member",
                columns: new[] { "group_id", "geofence_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_report_definitions_report_id",
                table: "gpsgate_report_definitions",
                column: "report_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_deleted",
                table: "gpsgate_report_entries",
                column: "is_deleted");

            migrationBuilder.CreateIndex(
                name: "idx_dispense_date",
                table: "gpsgate_report_entries",
                column: "dispense_date");

            migrationBuilder.CreateIndex(
                name: "idx_report",
                table: "gpsgate_report_entries",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_date",
                table: "gpsgate_report_entries",
                columns: new[] { "vehicle_id", "dispense_date" });

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_report_entries_deleted_by",
                table: "gpsgate_report_entries",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_report_entries_modified_by",
                table: "gpsgate_report_entries",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_reports_handle_id",
                table: "gpsgate_reports",
                column: "handle_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_reports_report_id",
                table: "gpsgate_reports",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_reports_requested_at",
                table: "gpsgate_reports",
                column: "requested_at");

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_reports_status",
                table: "gpsgate_reports",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_sessions_session_id",
                table: "gpsgate_sessions",
                column: "session_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_gpsgate_sessions_username",
                table: "gpsgate_sessions",
                column: "username");

            migrationBuilder.CreateIndex(
                name: "IX_intankdelivery_DetectedAt",
                table: "intankdelivery",
                column: "detected_at");

            migrationBuilder.CreateIndex(
                name: "ix_intankdelivery_matched_delivery_id",
                table: "intankdelivery",
                column: "matched_delivery_id");

            migrationBuilder.CreateIndex(
                name: "ix_intankdelivery_ptsid",
                table: "intankdelivery",
                column: "ptsid");

            migrationBuilder.CreateIndex(
                name: "IX_intankdelivery_SiteId",
                table: "intankdelivery",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_intankdelivery_Status",
                table: "intankdelivery",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_intankdelivery_TankId",
                table: "intankdelivery",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_issue_attachments_attachment_category",
                table: "issue_attachments",
                column: "attachment_category");

            migrationBuilder.CreateIndex(
                name: "ix_issue_attachments_issue_id",
                table: "issue_attachments",
                column: "issue_id");

            migrationBuilder.CreateIndex(
                name: "ix_issue_follower_issue_id",
                table: "issue_follower",
                column: "issue_id");

            migrationBuilder.CreateIndex(
                name: "ix_issue_follower_issue_id_user_id",
                table: "issue_follower",
                columns: new[] { "issue_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_issue_follower_user_id",
                table: "issue_follower",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_issue_reminder_is_active",
                table: "issue_reminder",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_issue_reminder_issue_id",
                table: "issue_reminder",
                column: "issue_id");

            migrationBuilder.CreateIndex(
                name: "ix_issue_reminder_next_reminder_date",
                table: "issue_reminder",
                column: "next_reminder_date");

            migrationBuilder.CreateIndex(
                name: "ix_issueactivitylogs_activity_date",
                table: "issueactivitylogs",
                column: "activity_date");

            migrationBuilder.CreateIndex(
                name: "ix_issueactivitylogs_activity_type",
                table: "issueactivitylogs",
                column: "activity_type");

            migrationBuilder.CreateIndex(
                name: "ix_issueactivitylogs_issue_id",
                table: "issueactivitylogs",
                column: "issue_id");

            migrationBuilder.CreateIndex(
                name: "ix_issueactivitylogs_performed_by",
                table: "issueactivitylogs",
                column: "performed_by");

            migrationBuilder.CreateIndex(
                name: "ix_issueassignmenttracker_assigned_from",
                table: "issueassignmenttracker",
                column: "assigned_from");

            migrationBuilder.CreateIndex(
                name: "ix_issueassignmenttracker_assigned_to",
                table: "issueassignmenttracker",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "ix_issueassignmenttracker_issue",
                table: "issueassignmenttracker",
                column: "issue");

            migrationBuilder.CreateIndex(
                name: "ix_issueautocloseconfig_issue_template_id",
                table: "issueautocloseconfig",
                column: "issue_template_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_issuecompletionrecord_actionid",
                table: "issuecompletionrecord",
                column: "template_action_id");

            migrationBuilder.CreateIndex(
                name: "IX_issuecompletionrecord_issueid",
                table: "issuecompletionrecord",
                column: "issue_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuecompletionrecord_source_vehicle_id",
                table: "issuecompletionrecord",
                column: "source_vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetemplate_default_priority_id",
                table: "issuetemplate",
                column: "default_priority_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetemplate_default_status_id",
                table: "issuetemplate",
                column: "default_status_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetemplate_device_type_id_name",
                table: "issuetemplate",
                columns: new[] { "device_type_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_issuetemplate_categories_issue_category_id",
                table: "issuetemplate_categories",
                column: "issue_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetemplateaction_stage_id",
                table: "issuetemplateaction",
                column: "stage_id");

            migrationBuilder.CreateIndex(
                name: "IX_issuetemplateaction_templateid",
                table: "issuetemplateaction",
                column: "issue_template_id");

            migrationBuilder.CreateIndex(
                name: "UQ_issuetemplateaction_template_name",
                table: "issuetemplateaction",
                columns: new[] { "issue_template_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_issuetemplateworkflow_templateid",
                table: "issuetemplateworkflow",
                column: "issue_template_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_issuetemplateworkflowstage_workflow_sortorder",
                table: "issuetemplateworkflowstage",
                columns: new[] { "workflow_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_active_alarm_id",
                table: "issuetracker",
                column: "active_alarm_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_assign_to",
                table: "issuetracker",
                column: "assign_to");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_can_auto_close",
                table: "issuetracker",
                column: "can_auto_close");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_device_type_id",
                table: "issuetracker",
                column: "device_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_is_auto_created",
                table: "issuetracker",
                column: "is_auto_created");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_issue_category_id",
                table: "issuetracker",
                column: "issue_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_issue_template_id",
                table: "issuetracker",
                column: "issue_template_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_openby",
                table: "issuetracker",
                column: "openby");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_priority",
                table: "issuetracker",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_site_id",
                table: "issuetracker",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_status",
                table: "issuetracker",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_issuetracker_vehicle_id",
                table: "issuetracker",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_location_validation_bypasses_vehicle_id",
                table: "location_validation_bypasses",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_LocationValidationLog_IsValid",
                table: "location_validation_log",
                column: "is_valid");

            migrationBuilder.CreateIndex(
                name: "IX_LocationValidationLog_PtsId",
                table: "location_validation_log",
                column: "pts_id");

            migrationBuilder.CreateIndex(
                name: "IX_LocationValidationLog_TankId",
                table: "location_validation_log",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "IX_LocationValidationLog_ValidationTime",
                table: "location_validation_log",
                column: "validation_time");

            migrationBuilder.CreateIndex(
                name: "IX_LocationValidationLog_VehicleId",
                table: "location_validation_log",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_loginactivities_user_id",
                table: "loginactivities",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_issues_maintenance_id",
                table: "maintenance_issues",
                column: "maintenance_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_schedules_created_by_navigation_id",
                table: "maintenance_schedules",
                column: "created_by_navigation_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_schedules_modified_by_navigation_id",
                table: "maintenance_schedules",
                column: "modified_by_navigation_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_schedules_vehicle_id",
                table: "maintenance_schedules",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_maintenance_schedules_vehicle_type_id",
                table: "maintenance_schedules",
                column: "vehicle_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_active_alarm_id",
                table: "notification",
                column: "active_alarm_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_created_at",
                table: "notification",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_notification_issue_tracker_id",
                table: "notification",
                column: "issue_tracker_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_notification_category_id",
                table: "notification",
                column: "notification_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_notification_id",
                table: "notification",
                column: "notification_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_notification_policy_id",
                table: "notification",
                column: "notification_policy_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_priority",
                table: "notification",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "ix_notification_pts_device_id",
                table: "notification",
                column: "pts_device_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_scheduled_at",
                table: "notification",
                column: "scheduled_at");

            migrationBuilder.CreateIndex(
                name: "ix_notification_sent_at",
                table: "notification",
                column: "sent_at");

            migrationBuilder.CreateIndex(
                name: "ix_notification_site_id",
                table: "notification",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_status",
                table: "notification",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_notification_tank_id",
                table: "notification",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_triggered_by",
                table: "notification",
                column: "triggered_by");

            migrationBuilder.CreateIndex(
                name: "ix_notification_type",
                table: "notification",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "ix_notification_vehicle_id",
                table: "notification",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_group_name_site_id",
                table: "notification_group",
                columns: new[] { "name", "site_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_group_site_id",
                table: "notification_group",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_group_member_group_id_member_type_member_id",
                table: "notification_group_member",
                columns: new[] { "group_id", "member_type", "member_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_created_at",
                table: "notification_policy",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_created_by",
                table: "notification_policy",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_is_active",
                table: "notification_policy",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_issue_category",
                table: "notification_policy",
                column: "issue_category");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_issue_priority",
                table: "notification_policy",
                column: "issue_priority");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_modified_by",
                table: "notification_policy",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_name",
                table: "notification_policy",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_notification_category_id",
                table: "notification_policy",
                column: "notification_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_notification_type",
                table: "notification_policy",
                column: "notification_type");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_pts_device_id",
                table: "notification_policy",
                column: "pts_device_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_site_id",
                table: "notification_policy",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_group_group_id",
                table: "notification_policy_group",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_group_policy_id_group_id",
                table: "notification_policy_group",
                columns: new[] { "policy_id", "group_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_recipient_created_by",
                table: "notification_policy_recipient",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_recipient_notification_policy_id",
                table: "notification_policy_recipient",
                column: "notification_policy_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_policy_recipient_user_id",
                table: "notification_policy_recipient",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_recipient_delivery_method",
                table: "notification_recipient",
                column: "delivery_method");

            migrationBuilder.CreateIndex(
                name: "ix_notification_recipient_delivery_status",
                table: "notification_recipient",
                column: "delivery_status");

            migrationBuilder.CreateIndex(
                name: "ix_notification_recipient_is_read",
                table: "notification_recipient",
                column: "is_read");

            migrationBuilder.CreateIndex(
                name: "ix_notification_recipient_notification_id",
                table: "notification_recipient",
                column: "notification_id");

            migrationBuilder.CreateIndex(
                name: "ix_notification_recipient_sent_at",
                table: "notification_recipient",
                column: "sent_at");

            migrationBuilder.CreateIndex(
                name: "ix_notification_recipient_user_id",
                table: "notification_recipient",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "FK_notification_categories_createdby",
                table: "notificationcategories",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "FK_notification_categories_updatedby",
                table: "notificationcategories",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "idx_notification_categories_active",
                table: "notificationcategories",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "idx_notification_categories_display_order",
                table: "notificationcategories",
                column: "display_order");

            migrationBuilder.CreateIndex(
                name: "ix_permissions_name",
                table: "permissions",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_permissions_parent_id",
                table: "permissions",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "idx_provider_active",
                table: "provider_configurations",
                columns: new[] { "is_deleted", "is_enabled" });

            migrationBuilder.CreateIndex(
                name: "idx_provider_default",
                table: "provider_configurations",
                column: "is_default");

            migrationBuilder.CreateIndex(
                name: "idx_provider_enabled",
                table: "provider_configurations",
                column: "is_enabled");

            migrationBuilder.CreateIndex(
                name: "idx_provider_name",
                table: "provider_configurations",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_health_checked_at",
                table: "provider_health_history",
                column: "checked_at");

            migrationBuilder.CreateIndex(
                name: "idx_health_provider_id",
                table: "provider_health_history",
                column: "provider_config_id");

            migrationBuilder.CreateIndex(
                name: "idx_health_provider_name",
                table: "provider_health_history",
                column: "provider_name");

            migrationBuilder.CreateIndex(
                name: "idx_health_provider_time",
                table: "provider_health_history",
                columns: new[] { "provider_config_id", "checked_at" });

            migrationBuilder.CreateIndex(
                name: "idx_health_status",
                table: "provider_health_history",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_AlertRecord_AlertCode",
                table: "PTSAlertRecord",
                column: "alert_code");

            migrationBuilder.CreateIndex(
                name: "IX_AlertRecord_Composite",
                table: "PTSAlertRecord",
                columns: new[] { "pts_id", "device_type", "alert_code" });

            migrationBuilder.CreateIndex(
                name: "IX_AlertRecord_DateTime",
                table: "PTSAlertRecord",
                column: "date_time");

            migrationBuilder.CreateIndex(
                name: "IX_AlertRecord_DeviceType",
                table: "PTSAlertRecord",
                column: "device_type");

            migrationBuilder.CreateIndex(
                name: "IX_AlertRecord_ProcessedAt",
                table: "PTSAlertRecord",
                column: "processed_at");

            migrationBuilder.CreateIndex(
                name: "IX_AlertRecord_PtsId",
                table: "PTSAlertRecord",
                column: "pts_id");

            migrationBuilder.CreateIndex(
                name: "IX_AlertRecord_State",
                table: "PTSAlertRecord",
                column: "state");

            migrationBuilder.CreateIndex(
                name: "ix_ptsdevice_site",
                table: "ptsdevice",
                column: "site");

            migrationBuilder.CreateIndex(
                name: "IX_device_commands_CommandType",
                table: "ptsdevice_pendingcommands",
                column: "command_type");

            migrationBuilder.CreateIndex(
                name: "IX_device_commands_PtsDeviceId",
                table: "ptsdevice_pendingcommands",
                column: "pts_device_id");

            migrationBuilder.CreateIndex(
                name: "IX_device_commands_PtsDeviceId_Status",
                table: "ptsdevice_pendingcommands",
                columns: new[] { "pts_device_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_ptsdevice_pendingcommands_ptsdevice_ptsid",
                table: "ptsdevice_pendingcommands",
                column: "ptsdevice_ptsid");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_date_time",
                table: "pumptransaction",
                column: "date_time");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_destination_tank_id",
                table: "pumptransaction",
                column: "destination_tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_employee_id",
                table: "pumptransaction",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_has_been_processed",
                table: "pumptransaction",
                column: "has_been_processed");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_is_transfer_mode",
                table: "pumptransaction",
                column: "is_transfer_mode");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_pts_id",
                table: "pumptransaction",
                column: "pts_id");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_pts_id_transaction",
                table: "pumptransaction",
                columns: new[] { "pts_id", "transaction" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_pump_transaction",
                table: "pumptransaction",
                columns: new[] { "pump", "transaction" });

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_tank_id",
                table: "pumptransaction",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_pumptransaction_vehicle_id",
                table: "pumptransaction",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliation_event_triggers_policy_id",
                table: "reconciliation_event_triggers",
                column: "policy_id");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationdiscrepancy_detected_at",
                table: "reconciliationdiscrepancy",
                column: "detected_at");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationdiscrepancy_discrepancy_type",
                table: "reconciliationdiscrepancy",
                column: "discrepancy_type");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationdiscrepancy_is_resolved",
                table: "reconciliationdiscrepancy",
                column: "is_resolved");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationdiscrepancy_policy_execution_id",
                table: "reconciliationdiscrepancy",
                column: "policy_execution_id");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationdiscrepancy_severity",
                table: "reconciliationdiscrepancy",
                column: "severity");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationdiscrepancy_tank_id",
                table: "reconciliationdiscrepancy",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicy_created_by",
                table: "reconciliationpolicy",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicy_is_active",
                table: "reconciliationpolicy",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicy_modified_by",
                table: "reconciliationpolicy",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicy_next_execution",
                table: "reconciliationpolicy",
                column: "next_execution");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicy_site_id",
                table: "reconciliationpolicy",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicyexecution_execution_start_time",
                table: "reconciliationpolicyexecution",
                column: "execution_start_time");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicyexecution_policy_id",
                table: "reconciliationpolicyexecution",
                column: "policy_id");

            migrationBuilder.CreateIndex(
                name: "ix_reconciliationpolicyexecution_status",
                table: "reconciliationpolicyexecution",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_refreshtoken_active",
                table: "refreshtokens",
                columns: new[] { "user_id", "is_revoked", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "idx_refreshtoken_expiresat",
                table: "refreshtokens",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "idx_refreshtoken_token",
                table: "refreshtokens",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_refreshtoken_userid",
                table: "refreshtokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_refreshtokens_replaced_by_token_id",
                table: "refreshtokens",
                column: "replaced_by_token_id");

            migrationBuilder.CreateIndex(
                name: "UQ_ReportCategories_CategoryName",
                table: "report_categories",
                column: "CategoryName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_Category",
                table: "report_definitions",
                columns: new[] { "Category", "IsDeleted", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_IsActive",
                table: "report_definitions",
                columns: new[] { "IsActive", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_ReportType",
                table: "report_definitions",
                columns: new[] { "ReportType", "IsDeleted", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "UQ_ReportDefinitions_ReportId",
                table: "report_definitions",
                column: "ReportId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistory_DefId_ExecutedAt",
                table: "report_execution_history",
                columns: new[] { "ReportDefinitionId", "ExecutedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistory_ExecutedAt",
                table: "report_execution_history",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistory_ExecutedBy",
                table: "report_execution_history",
                column: "ExecutedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionHistory_Success",
                table: "report_execution_history",
                column: "Success");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedules_CreatedBy",
                table: "report_schedules",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedules_NextExecution",
                table: "report_schedules",
                column: "NextExecutionAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedules_SourceId",
                table: "report_schedules",
                column: "ReportSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedules_Status",
                table: "report_schedules",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ReportTemplates_CreatedBy",
                table: "report_templates",
                columns: new[] { "CreatedBy", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_ReportTemplates_DefinitionId",
                table: "report_templates",
                columns: new[] { "ReportDefinitionId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "UQ_ReportTemplates_TemplateId",
                table: "report_templates",
                column: "TemplateId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_role_user_users_id",
                table: "role_user",
                column: "users_id");

            migrationBuilder.CreateIndex(
                name: "ix_rolenavigation_navigation_item_id",
                table: "rolenavigation",
                column: "navigation_item_id");

            migrationBuilder.CreateIndex(
                name: "ix_rolenavigation_role_id",
                table: "rolenavigation",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ix_rolepermissions_permission_id",
                table: "rolepermissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "ix_rolepermissions_role_id_permission_id",
                table: "rolepermissions",
                columns: new[] { "role_id", "permission_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_site_gps_geofence_id",
                table: "site",
                column: "gps_geofence_id");

            migrationBuilder.CreateIndex(
                name: "ix_site_site_administrator_id",
                table: "site",
                column: "site_administrator_id");

            migrationBuilder.CreateIndex(
                name: "ix_site_user_users_id",
                table: "site_user",
                column: "users_id");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_adjustment_date",
                table: "stock_adjustments",
                column: "adjustment_date");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_approved_by",
                table: "stock_adjustments",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_corrects_record_id",
                table: "stock_adjustments",
                column: "corrects_record_id");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_created_by",
                table: "stock_adjustments",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_deleted_by",
                table: "stock_adjustments",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_site_id",
                table: "stock_adjustments",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_status",
                table: "stock_adjustments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_tank_id",
                table: "stock_adjustments",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_tank_id_adjustment_date",
                table: "stock_adjustments",
                columns: new[] { "tank_id", "adjustment_date" });

            migrationBuilder.CreateIndex(
                name: "ix_stock_adjustments_tank_volume_history_id",
                table: "stock_adjustments",
                column: "tank_volume_history_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_stock_reports_generated_by_navigation_id",
                table: "stock_reports",
                column: "generated_by_navigation_id");

            migrationBuilder.CreateIndex(
                name: "ix_stock_reports_site_id",
                table: "stock_reports",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigurations_Category",
                table: "SystemConfigurations",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigurations_ConfigurationKey",
                table: "SystemConfigurations",
                column: "configuration_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigurations_IsActive_ConfigurationKey",
                table: "SystemConfigurations",
                columns: new[] { "is_active", "configuration_key" });

            migrationBuilder.CreateIndex(
                name: "ix_tag_fuel_rule_set_id",
                table: "tag",
                column: "fuel_rule_set_id");

            migrationBuilder.CreateIndex(
                name: "ix_tag_name",
                table: "tag",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tag_vehicle_id",
                table: "tag",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_tag_change_logs_vehicle_id",
                table: "tag_change_logs",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_tag_monitoring_config_vehicle_id",
                table: "tag_monitoring_config",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_tank_linked_vehicle_id",
                table: "tank",
                column: "linked_vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_tank_pts_id",
                table: "tank",
                column: "pts_id");

            migrationBuilder.CreateIndex(
                name: "ix_tank_site_id",
                table: "tank",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_tank_tank_type",
                table: "tank",
                column: "tank_type");

            migrationBuilder.CreateIndex(
                name: "IX_tankcalibrationsnapshots_tank_chart_recorded",
                table: "tankcalibrationsnapshots",
                columns: new[] { "tank_id", "chart_type", "recorded_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_tankmeasurement_tank_id",
                table: "tankmeasurement",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_tankstock_active_entry_key",
                table: "tankstock",
                column: "active_entry_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tankstock_recorded_by",
                table: "tankstock",
                column: "recorded_by");

            migrationBuilder.CreateIndex(
                name: "ix_tankstock_site_id",
                table: "tankstock",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_tankstock_tank_id",
                table: "tankstock",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_tanktransfer_corrects_record_id",
                table: "tanktransfer",
                column: "corrects_record_id");

            migrationBuilder.CreateIndex(
                name: "ix_tanktransfer_deleted_by",
                table: "tanktransfer",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_tanktransfer_destination_tank_id",
                table: "tanktransfer",
                column: "destination_tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_tanktransfer_recorded_by",
                table: "tanktransfer",
                column: "recorded_by");

            migrationBuilder.CreateIndex(
                name: "ix_tanktransfer_source_tank_id",
                table: "tanktransfer",
                column: "source_tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumeadjustmentaudit_adjustment_id",
                table: "tankvolumeadjustmentaudit",
                column: "adjustment_id");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumeadjustmentaudit_adjustment_timestamp",
                table: "tankvolumeadjustmentaudit",
                column: "adjustment_timestamp");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumeadjustmentaudit_affected_record_id",
                table: "tankvolumeadjustmentaudit",
                column: "affected_record_id");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumeadjustmentaudit_processed_by",
                table: "tankvolumeadjustmentaudit",
                column: "processed_by");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumeadjustmentaudit_tank_id",
                table: "tankvolumeadjustmentaudit",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumehistory_deleted_by",
                table: "tankvolumehistory",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumehistory_recorded_by",
                table: "tankvolumehistory",
                column: "recorded_by");

            migrationBuilder.CreateIndex(
                name: "ix_tankvolumehistory_tank_id",
                table: "tankvolumehistory",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_tenant_code",
                table: "tenant",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploadstatusprobereading_DateTime",
                table: "uploadstatusprobereading",
                column: "date_time");

            migrationBuilder.CreateIndex(
                name: "IX_uploadstatusprobereading_DeviceId",
                table: "uploadstatusprobereading",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "IX_uploadstatusprobereading_TankId",
                table: "uploadstatusprobereading",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_department_id",
                table: "user",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_master_rfid_tag",
                table: "user",
                column: "master_rfid_tag");

            migrationBuilder.CreateIndex(
                name: "ix_user_user_name",
                table: "user",
                column: "user_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_activity_user_id",
                table: "user_activity",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_UserDashboardLayout_User",
                table: "user_dashboard_layout",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_UserDashboardLayout_UserActive",
                table: "user_dashboard_layout",
                columns: new[] { "user_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_user_notification_preference_created_at",
                table: "user_notification_preference",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_user_notification_preference_created_by",
                table: "user_notification_preference",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_user_notification_preference_is_enabled",
                table: "user_notification_preference",
                column: "is_enabled");

            migrationBuilder.CreateIndex(
                name: "ix_user_notification_preference_notification_category_id",
                table: "user_notification_preference",
                column: "notification_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_notification_preference_updated_by",
                table: "user_notification_preference",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_user_notification_preference_user_id",
                table: "user_notification_preference",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_notification_preference_user_id_notification_category_",
                table: "user_notification_preference",
                columns: new[] { "user_id", "notification_category_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserPushDevices_DeviceToken",
                table: "user_push_devices",
                column: "device_token");

            migrationBuilder.CreateIndex(
                name: "IX_UserPushDevices_UserId",
                table: "user_push_devices",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_UserPushDevices_UserId_IsActive",
                table: "user_push_devices",
                columns: new[] { "user_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_userroles_role_id",
                table: "userroles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ix_userroles_user_id_role_id",
                table: "userroles",
                columns: new[] { "user_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserID_idx",
                table: "usersite",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_created_by",
                table: "vehicle",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_default_employee_id",
                table: "vehicle",
                column: "default_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_default_exptd_avgid",
                table: "vehicle",
                column: "default_exptd_avgid");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_modified_by",
                table: "vehicle",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_vehicle_code",
                table: "vehicle",
                column: "vehicle_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_vehicle_manufacturer_id",
                table: "vehicle",
                column: "vehicle_manufacturer_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_vehicle_model_id",
                table: "vehicle",
                column: "vehicle_model_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_vehicle_type_id",
                table: "vehicle",
                column: "vehicle_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_working_site_id",
                table: "vehicle",
                column: "working_site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_expected_average_assignments_expected_fuel_average_",
                table: "vehicle_expected_average_assignments",
                column: "expected_fuel_average_template_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_expected_average_assignments_vehicle_id",
                table: "vehicle_expected_average_assignments",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_health_checked_at",
                table: "vehicle_health_monitor",
                column: "checked_at");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_health_is_online",
                table: "vehicle_health_monitor",
                column: "is_online");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_health_issue_tracking",
                table: "vehicle_health_monitor",
                column: "issue_tracking_id");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_health_offline_reason",
                table: "vehicle_health_monitor",
                column: "offline_reason");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_health_vehicle_checked",
                table: "vehicle_health_monitor",
                columns: new[] { "vehicle_id", "checked_at" });

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_health_vehicle_id",
                table: "vehicle_health_monitor",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_last_known_location_cached_at",
                table: "vehicle_last_known_location",
                column: "cached_at");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_maintenances_maintenance_schedule_id",
                table: "vehicle_maintenances",
                column: "maintenance_schedule_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_maintenances_vehicle_id",
                table: "vehicle_maintenances",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "idx_mapping_external_device",
                table: "vehicle_provider_mappings",
                column: "external_device_id");

            migrationBuilder.CreateIndex(
                name: "idx_mapping_provider_id",
                table: "vehicle_provider_mappings",
                column: "provider_config_id");

            migrationBuilder.CreateIndex(
                name: "idx_mapping_vehicle_active",
                table: "vehicle_provider_mappings",
                columns: new[] { "vehicle_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "idx_mapping_vehicle_id",
                table: "vehicle_provider_mappings",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "idx_transfer_battery_details_transfer_id",
                table: "vehicle_transfer_battery_details",
                column: "transfer_id");

            migrationBuilder.CreateIndex(
                name: "idx_transfer_checkup_items_transfer_id",
                table: "vehicle_transfer_checkup_items",
                column: "transfer_id");

            migrationBuilder.CreateIndex(
                name: "idx_vt_checkup_template_criteria",
                table: "vehicle_transfer_checkup_templates",
                columns: new[] { "vehicle_type_id", "vehicle_model_id", "has_gps" });

            migrationBuilder.CreateIndex(
                name: "idx_vt_checkup_template_is_active",
                table: "vehicle_transfer_checkup_templates",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "idx_vt_checkup_template_sort_order",
                table: "vehicle_transfer_checkup_templates",
                column: "sort_order");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_transfer_checkup_templates_vehicle_model_id",
                table: "vehicle_transfer_checkup_templates",
                column: "vehicle_model_id");

            migrationBuilder.CreateIndex(
                name: "idx_transfer_tyre_details_transfer_id",
                table: "vehicle_transfer_tyre_details",
                column: "transfer_id");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_transfers_from_site_id",
                table: "vehicle_transfers",
                column: "from_site_id");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_transfers_status",
                table: "vehicle_transfers",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_transfers_to_site_id",
                table: "vehicle_transfers",
                column: "to_site_id");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_transfers_transfer_date",
                table: "vehicle_transfers",
                column: "transfer_date");

            migrationBuilder.CreateIndex(
                name: "idx_vehicle_transfers_vehicle_id",
                table: "vehicle_transfers",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_transfers_driver_id",
                table: "vehicle_transfers",
                column: "driver_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_destination_site_id",
                table: "vehicle_trip",
                column: "destination_site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_origin_site_id",
                table: "vehicle_trip",
                column: "origin_site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_vehicle_id_start_time_utc",
                table: "vehicle_trip",
                columns: new[] { "vehicle_id", "start_time_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_vehicle_trip_group_id",
                table: "vehicle_trip",
                column: "vehicle_trip_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_cluster_snapshot_matched_site_id",
                table: "vehicle_trip_cluster_snapshot",
                column: "matched_site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_cluster_snapshot_vehicle_id_trip_date_captured",
                table: "vehicle_trip_cluster_snapshot",
                columns: new[] { "vehicle_id", "trip_date", "captured_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_group_destination_site_id",
                table: "vehicle_trip_group",
                column: "destination_site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_group_origin_site_id_destination_site_id",
                table: "vehicle_trip_group",
                columns: new[] { "origin_site_id", "destination_site_id" });

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_group_vehicle_id_trip_date",
                table: "vehicle_trip_group",
                columns: new[] { "vehicle_id", "trip_date" });

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_out_of_bounds_event_site_id",
                table: "vehicle_trip_out_of_bounds_event",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_out_of_bounds_event_vehicle_id_occurred_at_utc",
                table: "vehicle_trip_out_of_bounds_event",
                columns: new[] { "vehicle_id", "occurred_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_out_of_bounds_event_vehicle_trip_group_id",
                table: "vehicle_trip_out_of_bounds_event",
                column: "vehicle_trip_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_out_of_bounds_event_vehicle_trip_id",
                table: "vehicle_trip_out_of_bounds_event",
                column: "vehicle_trip_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_override_result_vehicle_trip_group_id",
                table: "vehicle_trip_override",
                column: "result_vehicle_trip_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_override_vehicle_id_requested_at_utc",
                table: "vehicle_trip_override",
                columns: new[] { "vehicle_id", "requested_at_utc" });

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_override_vehicle_trip_group_id",
                table: "vehicle_trip_override",
                column: "vehicle_trip_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_override_vehicle_trip_id",
                table: "vehicle_trip_override",
                column: "vehicle_trip_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_state_current_site_id",
                table: "vehicle_trip_state",
                column: "current_site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_state_current_state",
                table: "vehicle_trip_state",
                column: "current_state");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_state_in_progress_trip_group_id",
                table: "vehicle_trip_state",
                column: "in_progress_trip_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_state_in_progress_trip_id",
                table: "vehicle_trip_state",
                column: "in_progress_trip_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_state_origin_site_id",
                table: "vehicle_trip_state",
                column: "origin_site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_state_updated_at_utc",
                table: "vehicle_trip_state",
                column: "updated_at_utc");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_trip_state_vehicle_id_movement_profile_state_date",
                table: "vehicle_trip_state",
                columns: new[] { "vehicle_id", "movement_profile", "state_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vehicleconsumption_modified_by",
                table: "vehicleconsumption",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "ix_vehicleconsumption_report_id",
                table: "vehicleconsumption",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicleconsumption_site_id",
                table: "vehicleconsumption",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicleconsumption_vehicle_id_date_is_night_shift",
                table: "vehicleconsumption",
                columns: new[] { "vehicle_id", "date", "is_night_shift" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vehiclemodel_manufacturer_id",
                table: "vehiclemodel",
                column: "manufacturer_id");

            migrationBuilder.CreateIndex(
                name: "ix_warning_letter_created_by",
                table: "warning_letter",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_warning_letter_employee_id",
                table: "warning_letter",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_warning_letter_issued_by_user_id",
                table: "warning_letter",
                column: "issued_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_warning_letter_modified_by",
                table: "warning_letter",
                column: "modified_by");

            migrationBuilder.CreateIndex(
                name: "ix_warning_letter_site_id_letter_date",
                table: "warning_letter",
                columns: new[] { "site_id", "letter_date" });

            migrationBuilder.CreateIndex(
                name: "ix_warning_letter_vehicle_id",
                table: "warning_letter",
                column: "vehicle_id");

            migrationBuilder.AddForeignKey(
                name: "FK_ActiveEvents_Expression",
                table: "active_events",
                column: "event_expression_id",
                principalTable: "event_expressions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ActiveEvents_Site",
                table: "active_events",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ActiveEvents_Tank",
                table: "active_events",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_BusinessFunctionNotificationGroup_Group",
                table: "BusinessFunctionNotificationGroups",
                column: "group_id",
                principalTable: "notification_group",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BusinessFunctionNotificationGroup_Site",
                table: "BusinessFunctionNotificationGroups",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "calibrationData_vehicle",
                table: "calibrationdata",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id");

            migrationBuilder.AddForeignKey(
                name: "fk_configuration_ptsdevices_ptsid",
                table: "configuration",
                column: "ptsid",
                principalTable: "ptsdevice",
                principalColumn: "ptsid",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "DailyTankReconciliation_TankId",
                table: "dailytankreconciliation",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_DashboardWidgetInstance_User",
                table: "dashboard_widget_instance",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "Delivery_DeletedBy",
                table: "delivery",
                column: "deleted_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "Delivery_User",
                table: "delivery",
                column: "recorded_by",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "Delivery_tank",
                table: "delivery",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_device_connections_ptsdevices_ptsdevice_id",
                table: "device_connections",
                column: "ptsdevice_id",
                principalTable: "ptsdevice",
                principalColumn: "ptsid");

            migrationBuilder.AddForeignKey(
                name: "fk_discrepancy_records_reconciliationpolicy_policy_id",
                table: "DiscrepancyRecords",
                column: "policy_id",
                principalTable: "reconciliationpolicy",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_discrepancy_records_reconciliationpolicyexecution_execution_",
                table: "DiscrepancyRecords",
                column: "execution_id",
                principalTable: "reconciliationpolicyexecution",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_discrepancy_records_tank_tank_id",
                table: "DiscrepancyRecords",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_employee_sites_site_id",
                table: "employee",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_employee_user_created_by",
                table: "employee",
                column: "created_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_employee_user_modified_by",
                table: "employee",
                column: "modified_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "VehicleID",
                table: "employeevehicle",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_error_logs_user_user_id",
                table: "error_logs",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_Executions_Expression",
                table: "event_expression_executions",
                column: "event_expression_id",
                principalTable: "event_expressions",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Executions_IssueTracker",
                table: "event_expression_executions",
                column: "issue_tracker_id",
                principalTable: "issuetracker",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Executions_Notification",
                table: "event_expression_executions",
                column: "notification_id",
                principalTable: "notification",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_EventExpressions_AssignIssueTo",
                table: "event_expressions",
                column: "assign_issue_to",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_EventExpressions_CreatedBy",
                table: "event_expressions",
                column: "created_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_EventExpressions_ModifiedBy",
                table: "event_expressions",
                column: "modified_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_EventExpressions_Policy",
                table: "event_expressions",
                column: "notification_policy_id",
                principalTable: "notification_policy",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_EventExpressions_Site",
                table: "event_expressions",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_EventExpressions_Tank",
                table: "event_expressions",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_expected_fuel_average_templates_fuel_routes_fuel_route_id",
                table: "expected_fuel_average_templates",
                column: "fuel_route_id",
                principalTable: "fuel_routes",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_expected_fuel_average_templates_sites_site_id",
                table: "expected_fuel_average_templates",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "Expected_site",
                table: "expectedaverage",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "Expected_vehicle",
                table: "expectedaverage",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id");

            migrationBuilder.AddForeignKey(
                name: "fk_gps_reading_vehicle",
                table: "fuel_audit_gps_readings",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_fuel_audit_vehicle_positions_vehicles_vehicle_id",
                table: "fuel_audit_vehicle_positions",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fuel_routes_sites_site_id",
                table: "fuel_routes",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignment_FuelTag",
                table: "fueling_rule_set_assignments",
                column: "tag_id",
                principalTable: "tag",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Assignment_Site",
                table: "fueling_rule_set_assignments",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Assignment_Vehicle",
                table: "fueling_rule_set_assignments",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelingRule_Site",
                table: "fuelingrule",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelingRule_Vehicle",
                table: "fuelingrule",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_deleted_by",
                table: "fuelrefil",
                column: "deleted_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_user",
                table: "fuelrefil",
                column: "fuel_by",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_pump_transaction",
                table: "fuelrefil",
                column: "pump_transcation_id",
                principalTable: "pumptransaction",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_site",
                table: "fuelrefil",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_tag",
                table: "fuelrefil",
                column: "tag_id",
                principalTable: "tag",
                principalColumn: "name",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_tank",
                table: "fuelrefil",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_vehicle",
                table: "fuelrefil",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id");

            migrationBuilder.AddForeignKey(
                name: "fk_gpsgate_report_entries_user_deleted_by",
                table: "gpsgate_report_entries",
                column: "deleted_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_gpsgate_report_entries_user_modified_by",
                table: "gpsgate_report_entries",
                column: "modified_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_gpsgate_report_entries_vehicle_vehicle_id",
                table: "gpsgate_report_entries",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_itd_tankId",
                table: "intankdelivery",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_psTID",
                table: "intankdelivery",
                column: "ptsid",
                principalTable: "ptsdevice",
                principalColumn: "ptsid");

            migrationBuilder.AddForeignKey(
                name: "issueattach_issue",
                table: "issue_attachments",
                column: "issue_id",
                principalTable: "issuetracker",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_issue_reminder_issue",
                table: "issue_reminder",
                column: "issue_id",
                principalTable: "issuetracker",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_issue_activity_log_issue",
                table: "issueactivitylogs",
                column: "issue_id",
                principalTable: "issuetracker",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "Assigned_Issue_To",
                table: "issueassignmenttracker",
                column: "assigned_to",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "assigned_user_From",
                table: "issueassignmenttracker",
                column: "assigned_from",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "Assigned_issue",
                table: "issueassignmenttracker",
                column: "issue",
                principalTable: "issuetracker",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_issuecompletionrecord_issuetracker",
                table: "issuecompletionrecord",
                column: "issue_id",
                principalTable: "issuetracker",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_issuecompletionrecord_vehicle",
                table: "issuecompletionrecord",
                column: "source_vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "Issue_user",
                table: "issuetracker",
                column: "assign_to",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "issue_ser",
                table: "issuetracker",
                column: "openby",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "issue_vehicle",
                table: "issuetracker",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id");

            migrationBuilder.AddForeignKey(
                name: "issuetracker_site",
                table: "issuetracker",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_location_validation_bypasses_vehicles_vehicle_id",
                table: "location_validation_bypasses",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id");

            migrationBuilder.AddForeignKey(
                name: "FK_LoginActivities_Users",
                table: "loginactivities",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_maintenance_issues_vehicle_maintenances_maintenance_id",
                table: "maintenance_issues",
                column: "maintenance_id",
                principalTable: "vehicle_maintenances",
                principalColumn: "maintenance_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_maintenance_schedules_user_created_by_navigation_id",
                table: "maintenance_schedules",
                column: "created_by_navigation_id",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_maintenance_schedules_user_modified_by_navigation_id",
                table: "maintenance_schedules",
                column: "modified_by_navigation_id",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_maintenance_schedules_vehicles_vehicle_id",
                table: "maintenance_schedules",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_NotificationCategories",
                table: "notification",
                column: "notification_category_id",
                principalTable: "notificationcategories",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_NotificationPolicy",
                table: "notification",
                column: "notification_policy_id",
                principalTable: "notification_policy",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_PtsDevice",
                table: "notification",
                column: "pts_device_id",
                principalTable: "ptsdevice",
                principalColumn: "ptsid",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_Site",
                table: "notification",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_Tank",
                table: "notification",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_TriggeredBy",
                table: "notification",
                column: "triggered_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_Vehicle",
                table: "notification",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationGroup_Site",
                table: "notification_group",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_Category",
                table: "notification_policy",
                column: "notification_category_id",
                principalTable: "notificationcategories",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_CreatedBy",
                table: "notification_policy",
                column: "created_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_ModifiedBy",
                table: "notification_policy",
                column: "modified_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_PtsDevice",
                table: "notification_policy",
                column: "pts_device_id",
                principalTable: "ptsdevice",
                principalColumn: "ptsid",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_Site",
                table: "notification_policy",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicyRecipient_CreatedBy",
                table: "notification_policy_recipient",
                column: "created_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicyRecipient_User",
                table: "notification_policy_recipient",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationRecipient_User",
                table: "notification_recipient",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_notification_categories_createdby",
                table: "notificationcategories",
                column: "created_by",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_notification_categories_updatedby",
                table: "notificationcategories",
                column: "updated_by",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "PTSDevice_site",
                table: "ptsdevice",
                column: "site",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_destination_tank",
                table: "pumptransaction",
                column: "destination_tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_tank",
                table: "pumptransaction",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_vehicle",
                table: "pumptransaction",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_reconciliation_event_triggers_reconciliation_policies_polic",
                table: "reconciliation_event_triggers",
                column: "policy_id",
                principalTable: "reconciliationpolicy",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationDiscrepancy_PolicyExecution",
                table: "reconciliationdiscrepancy",
                column: "policy_execution_id",
                principalTable: "reconciliationpolicyexecution",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationDiscrepancy_Tank",
                table: "reconciliationdiscrepancy",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationPolicy_CreatedBy",
                table: "reconciliationpolicy",
                column: "created_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationPolicy_ModifiedBy",
                table: "reconciliationpolicy",
                column: "modified_by",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationPolicy_Site",
                table: "reconciliationpolicy",
                column: "site_id",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_refreshtokens_user_user_id",
                table: "refreshtokens",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_role_user_user_users_id",
                table: "role_user",
                column: "users_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Site_SiteAdministrator",
                table: "site",
                column: "site_administrator_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_site_user_user_users_id",
                table: "site_user",
                column: "users_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_approved_by",
                table: "stock_adjustments",
                column: "approved_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_created_by",
                table: "stock_adjustments",
                column: "created_by",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_deleted_by",
                table: "stock_adjustments",
                column: "deleted_by",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_tank",
                table: "stock_adjustments",
                column: "tank_id",
                principalTable: "tank",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_volume_history",
                table: "stock_adjustments",
                column: "tank_volume_history_id",
                principalTable: "tankvolumehistory",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_stock_reports_user_generated_by_navigation_id",
                table: "stock_reports",
                column: "generated_by_navigation_id",
                principalTable: "user",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "TAG_Vehicle",
                table: "tag",
                column: "vehicle_id",
                principalTable: "vehicle",
                principalColumn: "vehicle_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_employee_sites_site_id",
                table: "employee");

            migrationBuilder.DropForeignKey(
                name: "Expected_site",
                table: "expectedaverage");

            migrationBuilder.DropForeignKey(
                name: "vehicle_site",
                table: "vehicle");

            migrationBuilder.DropForeignKey(
                name: "Expected_vehicle",
                table: "expectedaverage");

            migrationBuilder.DropForeignKey(
                name: "TAG_Vehicle",
                table: "tag");

            migrationBuilder.DropTable(
                name: "active_events");

            migrationBuilder.DropTable(
                name: "assets");

            migrationBuilder.DropTable(
                name: "BusinessFunctionNotificationGroups");

            migrationBuilder.DropTable(
                name: "calibrationdata");

            migrationBuilder.DropTable(
                name: "calibrationdatapoints");

            migrationBuilder.DropTable(
                name: "calibrationintervalaccumulations");

            migrationBuilder.DropTable(
                name: "configuration");

            migrationBuilder.DropTable(
                name: "dailytankreconciliation");

            migrationBuilder.DropTable(
                name: "dashboard_widget_instance");

            migrationBuilder.DropTable(
                name: "device_connections");

            migrationBuilder.DropTable(
                name: "DiscrepancyRecords");

            migrationBuilder.DropTable(
                name: "employee_documents");

            migrationBuilder.DropTable(
                name: "employee_position");

            migrationBuilder.DropTable(
                name: "employeevehicle");

            migrationBuilder.DropTable(
                name: "error_logs");

            migrationBuilder.DropTable(
                name: "event_expression_executions");

            migrationBuilder.DropTable(
                name: "fuel_audit_flags");

            migrationBuilder.DropTable(
                name: "fuel_audit_gps_readings");

            migrationBuilder.DropTable(
                name: "fuel_audit_sites");

            migrationBuilder.DropTable(
                name: "fuel_audit_tanker_readings");

            migrationBuilder.DropTable(
                name: "fuel_audit_thresholds");

            migrationBuilder.DropTable(
                name: "fuel_audit_variances");

            migrationBuilder.DropTable(
                name: "fuel_audit_vehicle_positions");

            migrationBuilder.DropTable(
                name: "fueling_rule_set_assignments");

            migrationBuilder.DropTable(
                name: "fuelingrule");

            migrationBuilder.DropTable(
                name: "fuelrefil");

            migrationBuilder.DropTable(
                name: "fuelreportgenerate");

            migrationBuilder.DropTable(
                name: "geofence_sync_jobs");

            migrationBuilder.DropTable(
                name: "gps_geofence_group_member");

            migrationBuilder.DropTable(
                name: "gpsgate_report_definitions");

            migrationBuilder.DropTable(
                name: "gpsgate_report_entries");

            migrationBuilder.DropTable(
                name: "gpsgate_sessions");

            migrationBuilder.DropTable(
                name: "intankdelivery");

            migrationBuilder.DropTable(
                name: "issue_attachments");

            migrationBuilder.DropTable(
                name: "issue_follower");

            migrationBuilder.DropTable(
                name: "issue_reminder");

            migrationBuilder.DropTable(
                name: "issueactivitylogs");

            migrationBuilder.DropTable(
                name: "issueassignmenttracker");

            migrationBuilder.DropTable(
                name: "issueautocloseconfig");

            migrationBuilder.DropTable(
                name: "issuecompletionrecord");

            migrationBuilder.DropTable(
                name: "issuetemplate_categories");

            migrationBuilder.DropTable(
                name: "location_validation_bypasses");

            migrationBuilder.DropTable(
                name: "location_validation_log");

            migrationBuilder.DropTable(
                name: "loginactivities");

            migrationBuilder.DropTable(
                name: "maintenance_issues");

            migrationBuilder.DropTable(
                name: "notification_group_member");

            migrationBuilder.DropTable(
                name: "notification_policy_group");

            migrationBuilder.DropTable(
                name: "notification_policy_recipient");

            migrationBuilder.DropTable(
                name: "notification_recipient");

            migrationBuilder.DropTable(
                name: "provider_health_history");

            migrationBuilder.DropTable(
                name: "PTSAlertRecord");

            migrationBuilder.DropTable(
                name: "ptsdevice_pendingcommands");

            migrationBuilder.DropTable(
                name: "reconciliation_event_triggers");

            migrationBuilder.DropTable(
                name: "reconciliationdiscrepancy");

            migrationBuilder.DropTable(
                name: "refreshtokens");

            migrationBuilder.DropTable(
                name: "report_categories");

            migrationBuilder.DropTable(
                name: "report_execution_history");

            migrationBuilder.DropTable(
                name: "report_schedules");

            migrationBuilder.DropTable(
                name: "report_templates");

            migrationBuilder.DropTable(
                name: "reportitems");

            migrationBuilder.DropTable(
                name: "role_claims");

            migrationBuilder.DropTable(
                name: "role_user");

            migrationBuilder.DropTable(
                name: "rolenavigation");

            migrationBuilder.DropTable(
                name: "rolepermissions");

            migrationBuilder.DropTable(
                name: "site_user");

            migrationBuilder.DropTable(
                name: "stock_adjustments");

            migrationBuilder.DropTable(
                name: "stock_reports");

            migrationBuilder.DropTable(
                name: "SystemConfigurations");

            migrationBuilder.DropTable(
                name: "tag_change_logs");

            migrationBuilder.DropTable(
                name: "tag_monitoring_config");

            migrationBuilder.DropTable(
                name: "tankcalibrationsnapshots");

            migrationBuilder.DropTable(
                name: "tankmeasurement");

            migrationBuilder.DropTable(
                name: "tankstock");

            migrationBuilder.DropTable(
                name: "tanktransfer");

            migrationBuilder.DropTable(
                name: "tankvolumeadjustmentaudit");

            migrationBuilder.DropTable(
                name: "tenant");

            migrationBuilder.DropTable(
                name: "uploadstatusprobereading");

            migrationBuilder.DropTable(
                name: "user_activity");

            migrationBuilder.DropTable(
                name: "user_claims");

            migrationBuilder.DropTable(
                name: "user_dashboard_layout");

            migrationBuilder.DropTable(
                name: "user_logins");

            migrationBuilder.DropTable(
                name: "user_notification_preference");

            migrationBuilder.DropTable(
                name: "user_push_devices");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "user_tokens");

            migrationBuilder.DropTable(
                name: "userroles");

            migrationBuilder.DropTable(
                name: "usersite");

            migrationBuilder.DropTable(
                name: "vehicle_expected_average_assignments");

            migrationBuilder.DropTable(
                name: "vehicle_health_monitor");

            migrationBuilder.DropTable(
                name: "vehicle_last_known_location");

            migrationBuilder.DropTable(
                name: "vehicle_provider_mappings");

            migrationBuilder.DropTable(
                name: "vehicle_transfer_battery_details");

            migrationBuilder.DropTable(
                name: "vehicle_transfer_checkup_items");

            migrationBuilder.DropTable(
                name: "vehicle_transfer_checkup_templates");

            migrationBuilder.DropTable(
                name: "vehicle_transfer_tyre_details");

            migrationBuilder.DropTable(
                name: "vehicle_trip_cluster_snapshot");

            migrationBuilder.DropTable(
                name: "vehicle_trip_out_of_bounds_event");

            migrationBuilder.DropTable(
                name: "vehicle_trip_override");

            migrationBuilder.DropTable(
                name: "vehicle_trip_state");

            migrationBuilder.DropTable(
                name: "vehicleconsumption");

            migrationBuilder.DropTable(
                name: "warning_letter");

            migrationBuilder.DropTable(
                name: "dashboard_widget_template");

            migrationBuilder.DropTable(
                name: "event_expressions");

            migrationBuilder.DropTable(
                name: "fuelaudits");

            migrationBuilder.DropTable(
                name: "pumptransaction");

            migrationBuilder.DropTable(
                name: "gps_geofence_group");

            migrationBuilder.DropTable(
                name: "gpsgate_reports");

            migrationBuilder.DropTable(
                name: "delivery");

            migrationBuilder.DropTable(
                name: "issuetemplateaction");

            migrationBuilder.DropTable(
                name: "vehicle_maintenances");

            migrationBuilder.DropTable(
                name: "notification_group");

            migrationBuilder.DropTable(
                name: "notification");

            migrationBuilder.DropTable(
                name: "reconciliationpolicyexecution");

            migrationBuilder.DropTable(
                name: "report_definitions");

            migrationBuilder.DropTable(
                name: "navigationitems");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "tankvolumehistory");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "expected_fuel_average_templates");

            migrationBuilder.DropTable(
                name: "provider_configurations");

            migrationBuilder.DropTable(
                name: "vehicle_transfers");

            migrationBuilder.DropTable(
                name: "vehicle_trip");

            migrationBuilder.DropTable(
                name: "supplier");

            migrationBuilder.DropTable(
                name: "issuetemplateworkflowstage");

            migrationBuilder.DropTable(
                name: "maintenance_schedules");

            migrationBuilder.DropTable(
                name: "issuetracker");

            migrationBuilder.DropTable(
                name: "notification_policy");

            migrationBuilder.DropTable(
                name: "reconciliationpolicy");

            migrationBuilder.DropTable(
                name: "tank");

            migrationBuilder.DropTable(
                name: "fuel_routes");

            migrationBuilder.DropTable(
                name: "load_classifications");

            migrationBuilder.DropTable(
                name: "usage_intensities");

            migrationBuilder.DropTable(
                name: "vehicle_trip_group");

            migrationBuilder.DropTable(
                name: "issuetemplateworkflow");

            migrationBuilder.DropTable(
                name: "notificationcategories");

            migrationBuilder.DropTable(
                name: "issuecategory");

            migrationBuilder.DropTable(
                name: "ptsdevice");

            migrationBuilder.DropTable(
                name: "issuetemplate");

            migrationBuilder.DropTable(
                name: "devicetype");

            migrationBuilder.DropTable(
                name: "issuepriority");

            migrationBuilder.DropTable(
                name: "issuestatus");

            migrationBuilder.DropTable(
                name: "site");

            migrationBuilder.DropTable(
                name: "gps_geofence");

            migrationBuilder.DropTable(
                name: "vehicle");

            migrationBuilder.DropTable(
                name: "employee");

            migrationBuilder.DropTable(
                name: "expectedaverage");

            migrationBuilder.DropTable(
                name: "vehiclemodel");

            migrationBuilder.DropTable(
                name: "vehicletype");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropTable(
                name: "expectedaverageclassification");

            migrationBuilder.DropTable(
                name: "vehiclemanufacturer");

            migrationBuilder.DropTable(
                name: "tag");

            migrationBuilder.DropTable(
                name: "departments");

            migrationBuilder.DropTable(
                name: "fuelingruleset");
        }
    }
}
