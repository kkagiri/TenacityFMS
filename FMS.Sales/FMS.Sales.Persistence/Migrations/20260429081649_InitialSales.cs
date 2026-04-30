using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FMS.Sales.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialSales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sales_audit_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    actor = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    payload_json = table.Column<string>(type: "jsonb", nullable: true),
                    occurred_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_audit_log", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sales_coupon",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    description = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    discount_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    discount_value = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    max_redemptions = table.Column<int>(type: "integer", nullable: true),
                    redemptions = table.Column<int>(type: "integer", nullable: false),
                    duration_in_cycles = table.Column<int>(type: "integer", nullable: true),
                    valid_from_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    valid_until_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_coupon", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sales_currency",
                columns: table => new
                {
                    code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    symbol = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    decimal_digits = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_currency", x => x.code);
                });

            migrationBuilder.CreateTable(
                name: "sales_plan",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_plan", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sales_usage_record",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subscription_id = table.Column<Guid>(type: "uuid", nullable: true),
                    metric = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    recorded_date = table.Column<DateOnly>(type: "date", nullable: false),
                    quantity = table.Column<long>(type: "bigint", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_usage_record", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sales_manual_sale",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    contact_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    contact_phone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    country_code = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    company_address = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    billing_cycle = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    price_override = table.Column<decimal>(type: "numeric(19,4)", nullable: true),
                    payment_terms = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    purchase_order_number = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    sales_rep = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    notes = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    provisioned_subscription_id = table.Column<Guid>(type: "uuid", nullable: true),
                    provisioned_tenant_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    approved_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_manual_sale", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_manual_sale_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "sales_plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_manual_sale_sales_currency_currency_code",
                        column: x => x.currency_code,
                        principalTable: "sales_currency",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_metered_price",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    metric = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_metered_price", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_metered_price_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "sales_plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_metered_price_sales_currency_currency_code",
                        column: x => x.currency_code,
                        principalTable: "sales_currency",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_onboarding_request",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    company_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    country_code = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    billing_cycle = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    stripe_checkout_session_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    provisioned_tenant_id = table.Column<Guid>(type: "uuid", nullable: true),
                    provisioned_subscription_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_onboarding_request", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_onboarding_request_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "sales_plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_plan_feature",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    feature_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    feature_value = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_plan_feature", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_plan_feature_sales_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "sales_plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_plan_price",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    billing_cycle = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_plan_price", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_plan_price_sales_currency_currency_code",
                        column: x => x.currency_code,
                        principalTable: "sales_currency",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_plan_price_sales_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "sales_plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_plan_quota",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    metric = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    included_units = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_plan_quota", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_plan_quota_sales_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "sales_plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_subscription",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    billing_cycle = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    payment_provider = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    external_subscription_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    external_customer_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    start_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    trial_end_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    current_period_start_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    current_period_end_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    cancelled_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ended_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    coupon_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_subscription", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_subscription_sales_coupon_coupon_id",
                        column: x => x.coupon_id,
                        principalTable: "sales_coupon",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_sales_subscription_sales_currency_currency_code",
                        column: x => x.currency_code,
                        principalTable: "sales_currency",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_subscription_sales_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "sales_plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_invoice",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subscription_id = table.Column<Guid>(type: "uuid", nullable: true),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    period_start_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    period_end_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    issued_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    due_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    paid_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    subtotal = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    discount_amount = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    tax_amount = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    total = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    amount_paid = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    external_invoice_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    notes = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_invoice", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_invoice_sales_currency_currency_code",
                        column: x => x.currency_code,
                        principalTable: "sales_currency",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sales_invoice_subscription_subscription_id",
                        column: x => x.subscription_id,
                        principalTable: "sales_subscription",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "sales_subscription_item",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    subscription_id = table.Column<Guid>(type: "uuid", nullable: false),
                    item_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    metric = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    quantity = table.Column<long>(type: "bigint", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    description = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_subscription_item", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_subscription_item_sales_subscription_subscription_id",
                        column: x => x.subscription_id,
                        principalTable: "sales_subscription",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_invoice_line",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    quantity = table.Column<long>(type: "bigint", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    item_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_invoice_line", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_invoice_line_sales_invoice_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "sales_invoice",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_payment",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(19,4)", nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    external_payment_id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    manual_reference = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    notes = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    attempted_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales_payment", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_payment_sales_invoice_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "sales_invoice",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_sales_audit_log_entity_type_entity_id",
                table: "sales_audit_log",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_coupon_code",
                table: "sales_coupon",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_invoice_currency_code",
                table: "sales_invoice",
                column: "currency_code");

            migrationBuilder.CreateIndex(
                name: "ix_sales_invoice_invoice_number",
                table: "sales_invoice",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_invoice_subscription_id",
                table: "sales_invoice",
                column: "subscription_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_invoice_tenant_id",
                table: "sales_invoice",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_invoice_line_invoice_id",
                table: "sales_invoice_line",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_manual_sale_currency_code",
                table: "sales_manual_sale",
                column: "currency_code");

            migrationBuilder.CreateIndex(
                name: "ix_sales_manual_sale_plan_id",
                table: "sales_manual_sale",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_metered_price_currency_code",
                table: "sales_metered_price",
                column: "currency_code");

            migrationBuilder.CreateIndex(
                name: "ix_sales_metered_price_plan_id_currency_code_metric",
                table: "sales_metered_price",
                columns: new[] { "plan_id", "currency_code", "metric" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_onboarding_request_email",
                table: "sales_onboarding_request",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "ix_sales_onboarding_request_plan_id",
                table: "sales_onboarding_request",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_payment_invoice_id",
                table: "sales_payment",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_plan_code",
                table: "sales_plan",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_plan_feature_plan_id_feature_key",
                table: "sales_plan_feature",
                columns: new[] { "plan_id", "feature_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_plan_price_currency_code",
                table: "sales_plan_price",
                column: "currency_code");

            migrationBuilder.CreateIndex(
                name: "ix_sales_plan_price_plan_id_currency_code_billing_cycle",
                table: "sales_plan_price",
                columns: new[] { "plan_id", "currency_code", "billing_cycle" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_plan_quota_plan_id_metric",
                table: "sales_plan_quota",
                columns: new[] { "plan_id", "metric" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_subscription_coupon_id",
                table: "sales_subscription",
                column: "coupon_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_subscription_currency_code",
                table: "sales_subscription",
                column: "currency_code");

            migrationBuilder.CreateIndex(
                name: "ix_sales_subscription_plan_id",
                table: "sales_subscription",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_subscription_tenant_id",
                table: "sales_subscription",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_subscription_item_subscription_id",
                table: "sales_subscription_item",
                column: "subscription_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_usage_record_tenant_id_metric_recorded_date",
                table: "sales_usage_record",
                columns: new[] { "tenant_id", "metric", "recorded_date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sales_audit_log");

            migrationBuilder.DropTable(
                name: "sales_invoice_line");

            migrationBuilder.DropTable(
                name: "sales_manual_sale");

            migrationBuilder.DropTable(
                name: "sales_metered_price");

            migrationBuilder.DropTable(
                name: "sales_onboarding_request");

            migrationBuilder.DropTable(
                name: "sales_payment");

            migrationBuilder.DropTable(
                name: "sales_plan_feature");

            migrationBuilder.DropTable(
                name: "sales_plan_price");

            migrationBuilder.DropTable(
                name: "sales_plan_quota");

            migrationBuilder.DropTable(
                name: "sales_subscription_item");

            migrationBuilder.DropTable(
                name: "sales_usage_record");

            migrationBuilder.DropTable(
                name: "sales_invoice");

            migrationBuilder.DropTable(
                name: "sales_subscription");

            migrationBuilder.DropTable(
                name: "sales_coupon");

            migrationBuilder.DropTable(
                name: "sales_currency");

            migrationBuilder.DropTable(
                name: "sales_plan");
        }
    }
}
