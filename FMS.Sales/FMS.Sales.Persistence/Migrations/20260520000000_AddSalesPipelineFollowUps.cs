using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FMS.Sales.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesPipelineFollowUps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sales_pipeline_follow_up",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    manual_sale_id = table.Column<Guid>(type: "uuid", nullable: true),
                    onboarding_request_id = table.Column<Guid>(type: "uuid", nullable: true),
                    note = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    due_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_pipeline_follow_up", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_pipeline_follow_up_sales_manual_sale_manual_sale_id",
                        column: x => x.manual_sale_id,
                        principalTable: "sales_manual_sale",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_pipeline_follow_up_sales_onboarding_request_onboard",
                        column: x => x.onboarding_request_id,
                        principalTable: "sales_onboarding_request",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_sales_pipeline_follow_up_created_at_utc",
                table: "sales_pipeline_follow_up",
                column: "created_at_utc");

            migrationBuilder.CreateIndex(
                name: "ix_sales_pipeline_follow_up_manual_sale_id",
                table: "sales_pipeline_follow_up",
                column: "manual_sale_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_pipeline_follow_up_onboarding_request_id",
                table: "sales_pipeline_follow_up",
                column: "onboarding_request_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sales_pipeline_follow_up");
        }
    }
}