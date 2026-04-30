using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantIdToTier1Entities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "vehicle",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "user",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

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

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "site",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

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

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "assets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "vehicle");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "user");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "site");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "assets");

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
        }
    }
}
