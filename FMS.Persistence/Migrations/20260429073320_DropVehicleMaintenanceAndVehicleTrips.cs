using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropVehicleMaintenanceAndVehicleTrips : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "maintenance_issues");

            migrationBuilder.DropTable(
                name: "vehicle_trip_cluster_snapshot");

            migrationBuilder.DropTable(
                name: "vehicle_trip_out_of_bounds_event");

            migrationBuilder.DropTable(
                name: "vehicle_trip_override");

            migrationBuilder.DropTable(
                name: "vehicle_trip_state");

            migrationBuilder.DropTable(
                name: "vehicle_maintenances");

            migrationBuilder.DropTable(
                name: "vehicle_trip");

            migrationBuilder.DropTable(
                name: "maintenance_schedules");

            migrationBuilder.DropTable(
                name: "vehicle_trip_group");

            migrationBuilder.AlterColumn<decimal>(
                name: "excess_working_hr_cost",
                table: "vehicle",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "sensor_discrepancy",
                table: "tankstock",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "expected_closing_level",
                table: "tankstock",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "discrepancy",
                table: "tankstock",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "tank_volume",
                table: "tank",
                type: "numeric(10)",
                precision: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10);

            migrationBuilder.AlterColumn<decimal>(
                name: "tank_length",
                table: "tank",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "tank_height",
                table: "tank",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "current_stock",
                table: "tank",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "sensor_delivery_amount",
                table: "delivery",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "manual_delivery_amount",
                table: "delivery",
                type: "numeric(10)",
                precision: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10);

            migrationBuilder.AlterColumn<decimal>(
                name: "delivery_temperature",
                table: "delivery",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "delivery_mass",
                table: "delivery",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "delivery_density",
                table: "delivery",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_transfers_out",
                table: "dailytankreconciliation",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_transfers_in",
                table: "dailytankreconciliation",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_refills",
                table: "dailytankreconciliation",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_deliveries",
                table: "dailytankreconciliation",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "opening_level",
                table: "dailytankreconciliation",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "closing_level",
                table: "dailytankreconciliation",
                type: "numeric(10)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,0)",
                oldPrecision: 10,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "excess_working_hr_cost",
                table: "vehicle",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "sensor_discrepancy",
                table: "tankstock",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "expected_closing_level",
                table: "tankstock",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "discrepancy",
                table: "tankstock",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "tank_volume",
                table: "tank",
                type: "numeric(10,0)",
                precision: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10);

            migrationBuilder.AlterColumn<decimal>(
                name: "tank_length",
                table: "tank",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "tank_height",
                table: "tank",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "current_stock",
                table: "tank",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "sensor_delivery_amount",
                table: "delivery",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "manual_delivery_amount",
                table: "delivery",
                type: "numeric(10,0)",
                precision: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10);

            migrationBuilder.AlterColumn<decimal>(
                name: "delivery_temperature",
                table: "delivery",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "delivery_mass",
                table: "delivery",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "delivery_density",
                table: "delivery",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_transfers_out",
                table: "dailytankreconciliation",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_transfers_in",
                table: "dailytankreconciliation",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_refills",
                table: "dailytankreconciliation",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_deliveries",
                table: "dailytankreconciliation",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "opening_level",
                table: "dailytankreconciliation",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "closing_level",
                table: "dailytankreconciliation",
                type: "numeric(10,0)",
                precision: 10,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10)",
                oldPrecision: 10,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "maintenance_schedules",
                columns: table => new
                {
                    schedule_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    created_by_navigation_id = table.Column<string>(type: "character varying(100)", nullable: true),
                    modified_by_navigation_id = table.Column<string>(type: "character varying(100)", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_type_id = table.Column<int>(type: "integer", nullable: true),
                    apply_to_all_vehicles = table.Column<bool>(type: "boolean", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    default_priority = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    estimated_cost = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    interval_days = table.Column<int>(type: "integer", nullable: true),
                    interval_kilometers = table.Column<decimal>(type: "numeric", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    maintenance_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    warning_threshold_days = table.Column<int>(type: "integer", nullable: true),
                    warning_threshold_km = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_maintenance_schedules", x => x.schedule_id);
                    table.ForeignKey(
                        name: "fk_maintenance_schedules_user_created_by_navigation_id",
                        column: x => x.created_by_navigation_id,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_maintenance_schedules_user_modified_by_navigation_id",
                        column: x => x.modified_by_navigation_id,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_maintenance_schedules_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicle_id");
                    table.ForeignKey(
                        name: "fk_maintenance_schedules_vehicletypes_vehicle_type_id",
                        column: x => x.vehicle_type_id,
                        principalTable: "vehicletype",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip_cluster_snapshot",
                columns: table => new
                {
                    vehicle_trip_cluster_snapshot_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    matched_site_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    average_dwell_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    captured_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    centroid_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    centroid_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    classification = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Unknown"),
                    cluster_index = table.Column<int>(type: "integer", nullable: false),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    matched_site_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    metadata_json = table.Column<string>(type: "text", nullable: true),
                    snapshot_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "RealtimeDetector"),
                    trip_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    visit_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
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
                    destination_site_id = table.Column<int>(type: "integer", nullable: true),
                    origin_site_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    anomaly_flags = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    confidence_band = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "High"),
                    confidence_score = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 1.00m),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    detection_mode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    end_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    grouping_type = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    is_out_of_bounds = table.Column<bool>(type: "boolean", nullable: true),
                    is_productive_movement = table.Column<bool>(type: "boolean", nullable: true),
                    movement_profile = table.Column<int>(type: "integer", nullable: false),
                    planned_destination_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planned_haul_route_id = table.Column<int>(type: "integer", nullable: true),
                    planned_origin_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planning_match_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    project_plan_id = table.Column<int>(type: "integer", nullable: true),
                    reconciliation_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    start_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    total_distance_km = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    total_duration_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    total_fuel_consumed = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    trip_count = table.Column<int>(type: "integer", nullable: false),
                    trip_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    work_shift_id = table.Column<int>(type: "integer", nullable: true)
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
                name: "vehicle_maintenances",
                columns: table => new
                {
                    maintenance_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    maintenance_schedule_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    completed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cost = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_overdue = table.Column<bool>(type: "boolean", nullable: false),
                    issue_note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    maintenance_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    next_due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_due_odometer = table.Column<decimal>(type: "numeric", nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    odometer_at_completion = table.Column<decimal>(type: "numeric", nullable: true),
                    odometer_at_schedule = table.Column<decimal>(type: "numeric", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    responsible_person = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    scheduled_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    service_provider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
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
                name: "vehicle_trip",
                columns: table => new
                {
                    vehicle_trip_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    destination_site_id = table.Column<int>(type: "integer", nullable: true),
                    origin_site_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: false),
                    anomaly_flags = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    confidence_band = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "High"),
                    confidence_score = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 1.00m),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    destination_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    detection_mode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    distance_km = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    duration_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    end_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    end_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    end_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_track_info_id = table.Column<int>(type: "integer", nullable: true),
                    fuel_at_arrival = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fuel_at_departure = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fuel_consumed = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    is_low_confidence = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_out_of_bounds = table.Column<bool>(type: "boolean", nullable: true),
                    is_productive_movement = table.Column<bool>(type: "boolean", nullable: true),
                    max_speed_kph = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    movement_profile = table.Column<int>(type: "integer", nullable: false),
                    origin_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    planned_destination_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planned_haul_route_id = table.Column<int>(type: "integer", nullable: true),
                    planned_origin_zone_id = table.Column<int>(type: "integer", nullable: true),
                    planning_match_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    project_plan_id = table.Column<int>(type: "integer", nullable: true),
                    reconciliation_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    sequence_no = table.Column<int>(type: "integer", nullable: false),
                    start_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    start_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    start_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    start_track_info_id = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    work_shift_id = table.Column<int>(type: "integer", nullable: true)
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
                name: "maintenance_issues",
                columns: table => new
                {
                    issue_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    maintenance_id = table.Column<int>(type: "integer", nullable: false),
                    additional_cost = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    date_created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_reported = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_resolved = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    issue_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    modified_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    reported_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    resolution_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    responsible_person = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_maintenance_issues", x => x.issue_id);
                    table.ForeignKey(
                        name: "fk_maintenance_issues_vehicle_maintenances_maintenance_id",
                        column: x => x.maintenance_id,
                        principalTable: "vehicle_maintenances",
                        principalColumn: "maintenance_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_trip_out_of_bounds_event",
                columns: table => new
                {
                    vehicle_trip_out_of_bounds_event_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    site_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_trip_id = table.Column<int>(type: "integer", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    distance_from_boundary_meters = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    duration_minutes = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "BoundaryExit"),
                    geofence_id = table.Column<int>(type: "integer", nullable: true),
                    latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: false),
                    metadata_json = table.Column<string>(type: "text", nullable: true),
                    occurred_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
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
                    result_vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    vehicle_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_trip_id = table.Column<int>(type: "integer", nullable: true),
                    action_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    new_values_json = table.Column<string>(type: "text", nullable: true),
                    original_values_json = table.Column<string>(type: "text", nullable: true),
                    reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    request_ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    requested_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    requested_by_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    requested_by_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    required_supervisor_approval = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    secondary_vehicle_trip_id = table.Column<int>(type: "integer", nullable: true),
                    supervisor_approval_json = table.Column<string>(type: "text", nullable: true)
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
                    current_site_id = table.Column<int>(type: "integer", nullable: true),
                    in_progress_trip_group_id = table.Column<int>(type: "integer", nullable: true),
                    in_progress_trip_id = table.Column<int>(type: "integer", nullable: true),
                    origin_site_id = table.Column<int>(type: "integer", nullable: true),
                    vehicle_id = table.Column<int>(type: "integer", nullable: false),
                    accumulated_distance_km = table.Column<decimal>(type: "numeric(10,2)", nullable: false, defaultValue: 0m),
                    consecutive_at_site_points = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    consecutive_out_of_site_points = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    current_cluster_index = table.Column<int>(type: "integer", nullable: true),
                    current_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    current_site_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    current_state = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "AT_SITE"),
                    fuel_at_departure = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    known_clusters_json = table.Column<string>(type: "text", nullable: true),
                    last_gps_timestamp_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    last_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    last_processed_point_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    max_speed_kph = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    movement_profile = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    origin_geofence_id = table.Column<int>(type: "integer", nullable: true),
                    origin_latitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    origin_longitude = table.Column<decimal>(type: "numeric(11,8)", nullable: true),
                    origin_site_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    recent_points_json = table.Column<string>(type: "text", nullable: true),
                    state_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    trip_start_time_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    trip_start_track_info_id = table.Column<int>(type: "integer", nullable: true),
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
                name: "ix_vehicle_maintenances_maintenance_schedule_id",
                table: "vehicle_maintenances",
                column: "maintenance_schedule_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_maintenances_vehicle_id",
                table: "vehicle_maintenances",
                column: "vehicle_id");

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
        }
    }
}
