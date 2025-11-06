using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FMS.Persistence.Migrations.Gpsdata
{
    /// <inheritdoc />
    public partial class AddVehicleMaintenanceFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Baseline migration on production: no-op to prevent re-creating existing schema.
            // The remaining code is intentionally left unreachable.
            return;
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "alarm",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Priority = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Assets",
                columns: table => new
                {
                    AssetId = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssetName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assets", x => x.AssetId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "dashboard_widget_template",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    WidgetType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataSource = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfigurationJson = table.Column<string>(type: "longtext", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequiredRole = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequiredPermissions = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "expectedaverageclassification",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(545)", maxLength: 545, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IskmperLiter = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "fuelingruleset",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "fuelreportgenerate",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ApprovedDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ApprovedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModfifiedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "issuecategory",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(945)", maxLength: 945, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "issuepriority",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "issuestatus",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false),
                    status = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "navigationitems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Page = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Link = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    parentId = table.Column<int>(type: "int(11)", nullable: true),
                    icon = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParentId = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Permissions_Parent",
                        column: x => x.ParentId,
                        principalTable: "permissions",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "provider_configurations",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    display_name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_enabled = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_default = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    version = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "1.0.0")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    settings = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    priority = table.Column<int>(type: "int", nullable: false, defaultValue: 999),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    created_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updated_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    deleted_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provider_configurations", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "reportitem",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LayoutData = table.Column<byte[]>(type: "longblob", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    CreatedBy = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedBy = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RoleId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClaimType = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClaimValue = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleClaims", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Name = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NormalizedName = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConcurrencyStamp = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "supplier",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Contacts = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SystemConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ConfigurationKey = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfigurationValue = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    IsEditable = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    Category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp", nullable: false, defaultValueSql: "'0000-00-00 00:00:00'"),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValidationPattern = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MinValue = table.Column<double>(type: "double", nullable: true),
                    MaxValue = table.Column<double>(type: "double", nullable: true),
                    DefaultValue = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigurations", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClaimType = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClaimValue = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserClaims", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProviderKey = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProviderDisplayName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLogins", x => new { x.LoginProvider, x.ProviderKey });
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RoleId = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LoginProvider = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Value = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vehicle_health_monitor",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    vehicle_id = table.Column<int>(type: "int", nullable: false),
                    checked_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    is_online = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    last_online_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    last_offline_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    offline_duration = table.Column<TimeSpan>(type: "time(6)", nullable: true),
                    offline_reason = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    permanent_location = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    working_site_id = table.Column<int>(type: "int", nullable: true),
                    last_known_latitude = table.Column<decimal>(type: "decimal(10,7)", precision: 10, scale: 7, nullable: true),
                    last_known_longitude = table.Column<decimal>(type: "decimal(10,7)", precision: 10, scale: 7, nullable: true),
                    last_known_address = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    issue_tracking_id = table.Column<int>(type: "int", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicle_health_monitor", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vehiclemanufacturer",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vehicletype",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Abbvr = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nothinghere = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                },
                comment: "			")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PTSAlertRecord",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    pts_id = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    device_type = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    device_number = table.Column<int>(type: "int", nullable: false),
                    alert_code = table.Column<int>(type: "int", nullable: false),
                    state = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    date_time = table.Column<DateTime>(type: "datetime", nullable: false),
                    configuration_id = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    alarm_id = table.Column<int>(type: "int(11)", nullable: true),
                    processed_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PTSAlertRecord", x => x.id);
                    table.ForeignKey(
                        name: "FK_PTSAlertRecord_alarm_alarm_id",
                        column: x => x.alarm_id,
                        principalTable: "alarm",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "provider_health_history",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    provider_config_id = table.Column<int>(type: "int", nullable: false),
                    provider_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "Unknown")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    message = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    response_time_ms = table.Column<int>(type: "int", nullable: true),
                    success_rate = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    error_count = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    additional_metrics = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    checked_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provider_health_history", x => x.id);
                    table.ForeignKey(
                        name: "FK_provider_health_history_provider_configurations_provider_con~",
                        column: x => x.provider_config_id,
                        principalTable: "provider_configurations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rolenavigation",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RoleId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    navigationItemId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleNavigations_NavigationItems",
                        column: x => x.navigationItemId,
                        principalTable: "navigationitems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoleNavigations_Roles",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rolepermissions",
                columns: table => new
                {
                    RoleId = table.Column<string>(type: "varchar(100)", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PermissionId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rolepermissions", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions",
                        column: x => x.PermissionId,
                        principalTable: "permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "vehiclemodel",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ManufacturerID = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                    table.ForeignKey(
                        name: "vehiclemodel_manufacturer",
                        column: x => x.ManufacturerID,
                        principalTable: "vehiclemanufacturer",
                        principalColumn: "ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "activealarms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AlarmType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    State = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Active", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggerSource = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggeredAt = table.Column<DateTime>(type: "timestamp", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    AcknowledgedAt = table.Column<DateTime>(type: "timestamp", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp", nullable: true),
                    AcknowledgedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResolvedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Severity = table.Column<int>(type: "int", nullable: false, defaultValue: 2),
                    Priority = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Medium", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Message = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    TankId = table.Column<int>(type: "int(11)", nullable: true),
                    PtsDeviceId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ThresholdValue = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    ActualValue = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    Unit = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AlarmHandlerId = table.Column<int>(type: "int(11)", nullable: true),
                    AlertRecordId = table.Column<int>(type: "int", nullable: true),
                    ReconciliationDiscrepancyId = table.Column<int>(type: "int(11)", nullable: true),
                    AdditionalData = table.Column<string>(type: "TEXT", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResolutionNotes = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SuppressNotifications = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    AutoResolveMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    EscalationLevel = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    LastEscalatedAt = table.Column<DateTime>(type: "timestamp", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_activealarms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActiveAlarms_PTSAlertRecords",
                        column: x => x.AlertRecordId,
                        principalTable: "PTSAlertRecord",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "alarm_handler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    AlarmType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AlarmId = table.Column<int>(type: "int(11)", nullable: true),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    TankId = table.Column<int>(type: "int(11)", nullable: true),
                    TriggerConditions = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NotificationPolicyId = table.Column<int>(type: "int(11)", nullable: false),
                    CreateIssueTracker = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    IssueCategory = table.Column<int>(type: "int(11)", nullable: true),
                    IssuePriority = table.Column<int>(type: "int(11)", nullable: true),
                    AssignIssueTo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CooldownMinutes = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 30),
                    MaxNotificationsPerDay = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    EnableEscalation = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    EscalationRules = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MessageTemplate = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AdditionalData = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Priority = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Medium", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ModifiedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    TriggerCount = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    LastTriggeredAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlarmHandler_Alarm",
                        column: x => x.AlarmId,
                        principalTable: "alarm",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AlarmHandler_IssueCategory",
                        column: x => x.IssueCategory,
                        principalTable: "issuecategory",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AlarmHandler_IssuePriority",
                        column: x => x.IssuePriority,
                        principalTable: "issuepriority",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "alarm_handler_execution",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AlarmHandlerId = table.Column<int>(type: "int(11)", nullable: false),
                    NotificationId = table.Column<int>(type: "int(11)", nullable: true),
                    IssueTrackerId = table.Column<int>(type: "int(11)", nullable: true),
                    ExecutedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Success = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    ErrorMessage = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggerData = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExecutionDetails = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExecutionTimeMs = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlarmHandlerExecution_AlarmHandler",
                        column: x => x.AlarmHandlerId,
                        principalTable: "alarm_handler",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "automatedfuelingconfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    UpdateTankVolumeFromBookKeeping = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    UsePtsProbeReadings = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    VolumeSourcePriority = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 1),
                    AutoCreateLedgerEntries = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    CheckForDuplicateManualEntries = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    DuplicateVolumeTolerance = table.Column<decimal>(type: "decimal(5,4)", precision: 5, scale: 4, nullable: false, defaultValue: 0.01m),
                    AutoReconcileTankVolumes = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    ReconciliationFrequencyMinutes = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 60),
                    MaxVolumeDiscrepancyThreshold = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    DiscrepancyAction = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 1),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ModifiedOn = table.Column<DateTime>(type: "datetime", nullable: true),
                    CreatedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_automatedfuelingconfigurations", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BusinessFunctionNotificationGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TriggerSource = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GroupId = table.Column<int>(type: "int(11)", nullable: false),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    AllowedDeliveryMethods = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MinimumSeverity = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp", nullable: true),
                    UpdatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessFunctionNotificationGroups", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "calibrationdata",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    VehicleID = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    calibrationDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CalibrationData = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Configuration",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ConfigurationId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Configuration1 = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ptsid = table.Column<string>(type: "varchar(100)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Configuration", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "dailytankreconciliation",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankId = table.Column<int>(type: "int(11)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ReconciliationDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    OpeningLevel = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    ClosingLevel = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TotalRefills = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TotalDeliveries = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TotalTransfersIn = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TotalTransfersOut = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "dashboard_widget_instance",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TemplateId = table.Column<int>(type: "int", nullable: true),
                    CustomName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    WidgetType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataSource = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PositionX = table.Column<int>(type: "int", nullable: false),
                    PositionY = table.Column<int>(type: "int", nullable: false),
                    Width = table.Column<int>(type: "int", nullable: false),
                    Height = table.Column<int>(type: "int", nullable: false),
                    ConfigurationJson = table.Column<string>(type: "longtext", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsVisible = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    IsCustomWidget = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    IsShared = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SharedFromUserId = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SharedFromWidgetId = table.Column<int>(type: "int", nullable: true),
                    CanEdit = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CanDelete = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SharedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DashboardWidgetInstance_Template",
                        column: x => x.TemplateId,
                        principalTable: "dashboard_widget_template",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "delivery",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankId = table.Column<int>(type: "int(11)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false),
                    DeliveryDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ManualDeliveryAmount = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: false),
                    SensorDeliveryAmount = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    DeliveryTemperature = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    DeliveryDensity = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    DeliveryMass = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    StockBeforeDelivery = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: false),
                    StockAfterDelivery = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: false),
                    PricePerLiter = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 150.00m, comment: "Price per liter in Kenya Shillings (KES)"),
                    RecordedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SupplierId = table.Column<int>(type: "int(11)", nullable: false),
                    LPONumber = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Product = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "datetime", nullable: true),
                    deleted_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "Delivery_Supplier",
                        column: x => x.SupplierId,
                        principalTable: "supplier",
                        principalColumn: "Id");
                },
                comment: "		")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DeviceConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IpAddress = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConnectedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DisconnectedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    LastActivityAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ConnectionType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PtsdeviceId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceConnections", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DiscrepancyRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankId = table.Column<int>(type: "int(11)", nullable: false),
                    PolicyId = table.Column<int>(type: "int(11)", nullable: false),
                    ExecutionId = table.Column<int>(type: "int(11)", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    VarianceLiters = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    VariancePercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    IsResolved = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscrepancyRecords", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "employee",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FullName = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false, defaultValueSql: "'Employee Name'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmployeeWorkNo = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true, defaultValueSql: "'New'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    employeephoneNumber = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true, defaultValueSql: "'0700000000'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    employeestatus = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteID = table.Column<int>(type: "int(11)", nullable: true),
                    DateCreated = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DateModified = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsModified = table.Column<sbyte>(type: "tinyint(4)", nullable: true, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "employeevehicle",
                columns: table => new
                {
                    EmployeeID = table.Column<int>(type: "int(11)", nullable: false),
                    VehicleID = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => new { x.VehicleID, x.EmployeeID });
                    table.ForeignKey(
                        name: "EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "latin1");

            migrationBuilder.CreateTable(
                name: "EmployeeVehicle",
                columns: table => new
                {
                    EmployeesId = table.Column<int>(type: "int(11)", nullable: false),
                    VehiclesVehicleId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeVehicle", x => new { x.EmployeesId, x.VehiclesVehicleId });
                    table.ForeignKey(
                        name: "FK_EmployeeVehicle_employee_EmployeesId",
                        column: x => x.EmployeesId,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "error_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "CHAR(36)", nullable: false, collation: "ascii_general_ci"),
                    created_at = table.Column<DateTime>(type: "DATETIME", nullable: false),
                    message = table.Column<string>(type: "TEXT", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    stack = table.Column<string>(type: "TEXT", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    component_stack = table.Column<string>(type: "TEXT", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserAgent = table.Column<string>(type: "VARCHAR(500)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    url = table.Column<string>(type: "VARCHAR(1000)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    user_id = table.Column<string>(type: "VARCHAR(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserId1 = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_error_logs", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "expectedaverage",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VehicleID = table.Column<int>(type: "int(11)", nullable: false),
                    ExpectedAverageClassificationID = table.Column<int>(type: "int(11)", nullable: false),
                    ExpectedAverageValue = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    SiteID = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                    table.ForeignKey(
                        name: "Expected_classification",
                        column: x => x.ExpectedAverageClassificationID,
                        principalTable: "expectedaverageclassification",
                        principalColumn: "ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "fuelingrule",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RuleName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: true),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Discriminator = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FuelingRuleSetId = table.Column<int>(type: "int(11)", nullable: false),
                    DailyLimitLiter = table.Column<int>(type: "int", nullable: true),
                    MonthlyLimitLiter = table.Column<int>(type: "int", nullable: true),
                    MaxRefillsPerDay = table.Column<int>(type: "int", nullable: true),
                    MaxRefillsPerWeek = table.Column<int>(type: "int", nullable: true),
                    MaxRefillsPerMonth = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FuelingRule_FuelingRuleSet",
                        column: x => x.FuelingRuleSetId,
                        principalTable: "fuelingruleset",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "fuelrefil",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: false),
                    ManualFuelrefilAmount = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    Date = table.Column<DateTime>(type: "datetime", nullable: true),
                    PreviousMeterReading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    CurrentMeterReading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    SiteId = table.Column<int>(type: "int(11)", nullable: false),
                    Comment = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FuelBy = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PumpTranscationId = table.Column<int>(type: "int(11)", nullable: true),
                    DriverId = table.Column<int>(type: "int(11)", nullable: true),
                    TagId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TankId = table.Column<int>(type: "int(11)", nullable: true),
                    DateCreated = table.Column<DateTime>(type: "datetime", nullable: false),
                    DateModified = table.Column<DateTime>(type: "datetime", nullable: true),
                    ModifiedBy = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsModified = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "datetime", nullable: true),
                    deleted_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_correction = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    corrects_record_id = table.Column<int>(type: "int(11)", nullable: true),
                    correction_reason = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "fuelrefil_corrects_record",
                        column: x => x.corrects_record_id,
                        principalTable: "fuelrefil",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fuelrefill_driver",
                        column: x => x.DriverId,
                        principalTable: "employee",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "fuelreportimportlog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ReportId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ImportDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    TotalRecords = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    SuccessCount = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    FailedCount = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    SkippedCount = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    DuplicateCount = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "Completed")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ImportedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "intankdelivery",
                columns: table => new
                {
                    DeliveryId = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Tank = table.Column<int>(type: "int(11)", nullable: false),
                    FuelGradeId = table.Column<int>(type: "int(11)", nullable: false),
                    FuelGradeName = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartDateTime = table.Column<DateTime>(type: "datetime", nullable: true),
                    StartProductHeight = table.Column<float>(type: "float", nullable: true),
                    StartWaterHeight = table.Column<float>(type: "float", nullable: true),
                    StartTemperature = table.Column<float>(type: "float", nullable: true),
                    StartProductVolume = table.Column<float>(type: "float", nullable: true),
                    StartProductTCVolume = table.Column<float>(type: "float", nullable: true),
                    StartProductDensity = table.Column<float>(type: "float", nullable: true),
                    StartProductMass = table.Column<float>(type: "float", nullable: true),
                    EndDateTime = table.Column<DateTime>(type: "datetime", nullable: true),
                    EndProductHeight = table.Column<float>(type: "float", nullable: true),
                    EndWaterHeight = table.Column<float>(type: "float", nullable: true),
                    EndTemperature = table.Column<float>(type: "float", nullable: true),
                    EndProductVolume = table.Column<float>(type: "float", nullable: true),
                    EndProductTCVolume = table.Column<float>(type: "float", nullable: true),
                    EndProductDensity = table.Column<float>(type: "float", nullable: true),
                    EndProductMass = table.Column<float>(type: "float", nullable: true),
                    AbsoluteProductHeight = table.Column<float>(type: "float", nullable: true),
                    AbsoluteWaterHeight = table.Column<float>(type: "float", nullable: true),
                    AbsoluteTemperature = table.Column<float>(type: "float", nullable: true),
                    AbsoluteProductVolume = table.Column<float>(type: "float", nullable: true),
                    AbsoluteProductTCVolume = table.Column<float>(type: "float", nullable: true),
                    AbsoluteProductDensity = table.Column<float>(type: "float", nullable: true),
                    AbsoluteProductMass = table.Column<float>(type: "float", nullable: true),
                    PumpsDispensedVolume = table.Column<float>(type: "float", nullable: true),
                    ConfigurationId = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PTSId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PacketID = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.DeliveryId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "issueassignmenttracker",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    AssignedFrom = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignedTo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Issue = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "issuetracker",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    IssueCategoryID = table.Column<int>(type: "int(11)", nullable: false),
                    siteID = table.Column<int>(type: "int(11)", nullable: false),
                    openby = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    relatedIssue = table.Column<int>(type: "int(11)", nullable: true),
                    problemDescription = table.Column<string>(type: "varchar(945)", maxLength: 945, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    problemTitle = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<int>(type: "int(11)", nullable: true),
                    priority = table.Column<int>(type: "int(11)", nullable: true),
                    dueDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    openDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    closingDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    LastModfield = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    VehicleID = table.Column<int>(type: "int(11)", nullable: false),
                    DeviceType = table.Column<int>(type: "int(11)", nullable: true),
                    AssignTo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActiveAlarmId = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                    table.ForeignKey(
                        name: "Issue_tracker_issuepriorty",
                        column: x => x.priority,
                        principalTable: "issuepriority",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "Issuetracker_status",
                        column: x => x.status,
                        principalTable: "issuestatus",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "issuetracker_activealarm",
                        column: x => x.ActiveAlarmId,
                        principalTable: "activealarms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "issuetrcker_issuecategoryID",
                        column: x => x.IssueCategoryID,
                        principalTable: "issuecategory",
                        principalColumn: "ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "loginactivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Timestamp = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IpAddress = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsSuccessful = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "MaintenanceIssues",
                columns: table => new
                {
                    IssueId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaintenanceId = table.Column<int>(type: "int", nullable: false),
                    IssueType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Severity = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResponsiblePerson = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReportedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateReported = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DateResolved = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AdditionalCost = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    CreatedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateCreated = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DateModified = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceIssues", x => x.IssueId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MaintenanceSchedules",
                columns: table => new
                {
                    ScheduleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaintenanceType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IntervalKilometers = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    IntervalDays = table.Column<int>(type: "int", nullable: true),
                    WarningThresholdKm = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    WarningThresholdDays = table.Column<int>(type: "int", nullable: true),
                    EstimatedCost = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    VehicleTypeId = table.Column<int>(type: "int(11)", nullable: true),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ApplyToAllVehicles = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: true),
                    DefaultPriority = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateCreated = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DateModified = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceSchedules", x => x.ScheduleId);
                    table.ForeignKey(
                        name: "FK_MaintenanceSchedules_vehicletype_VehicleTypeId",
                        column: x => x.VehicleTypeId,
                        principalTable: "vehicletype",
                        principalColumn: "ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "notification",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NotificationId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NotificationCategoryId = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    Priority = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Medium", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Message = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Data = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggerSource = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggeredBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp", nullable: true),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SendAttempts = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    ErrorMessage = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    TankId = table.Column<int>(type: "int(11)", nullable: true),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: true),
                    PtsDeviceId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IssueTrackerId = table.Column<int>(type: "int(11)", nullable: true),
                    ActiveAlarmId = table.Column<int>(type: "int(11)", nullable: true),
                    NotificationPolicyId = table.Column<int>(type: "int(11)", nullable: true),
                    IsRead = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp", nullable: true),
                    IsArchived = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    ArchivedAt = table.Column<DateTime>(type: "timestamp", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notification_IssueTracker",
                        column: x => x.IssueTrackerId,
                        principalTable: "issuetracker",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_notification_activealarms",
                        column: x => x.ActiveAlarmId,
                        principalTable: "activealarms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "notification_group",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    AllowedDeliveryMethods = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "notification_group_member",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    GroupId = table.Column<int>(type: "int(11)", nullable: false),
                    MemberType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MemberId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationGroupMember_Group",
                        column: x => x.GroupId,
                        principalTable: "notification_group",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "notification_policy",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    NotificationCategoryId = table.Column<int>(type: "int(11)", nullable: false),
                    NotificationType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Priority = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Medium", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MaxNotificationsPerHour = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    MaxNotificationsPerDay = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CooldownMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    EnableEmail = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    EnableSms = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    EnableSystem = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    EnableSound = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    SoundFile = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EscalationRules = table.Column<string>(type: "TEXT", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggerConditions = table.Column<string>(type: "TEXT", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecipientRules = table.Column<string>(type: "TEXT", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ScheduleConfiguration = table.Column<string>(type: "TEXT", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    PtsDeviceId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TitleTemplate = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MessageTemplate = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmailTemplate = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SmsTemplate = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequireAcknowledgment = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    AcknowledgmentTimeoutMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreateIssueTracker = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    IssueCategory = table.Column<int>(type: "int(11)", nullable: true),
                    IssuePriority = table.Column<int>(type: "int(11)", nullable: true),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ModifiedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    NotificationCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    LastNotificationAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationPolicy_IssueCategory",
                        column: x => x.IssueCategory,
                        principalTable: "issuecategory",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NotificationPolicy_IssuePriority",
                        column: x => x.IssuePriority,
                        principalTable: "issuepriority",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "notification_policy_group",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PolicyId = table.Column<int>(type: "int(11)", nullable: false),
                    GroupId = table.Column<int>(type: "int(11)", nullable: false),
                    AllowedDeliveryMethods = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationPolicyGroup_Group",
                        column: x => x.GroupId,
                        principalTable: "notification_group",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotificationPolicyGroup_Policy",
                        column: x => x.PolicyId,
                        principalTable: "notification_policy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "notification_policy_recipient",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NotificationPolicyId = table.Column<int>(type: "int(11)", nullable: false),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeliveryMethods = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, defaultValue: "System", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    PriorityOverride = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationPolicyRecipient_NotificationPolicy",
                        column: x => x.NotificationPolicyId,
                        principalTable: "notification_policy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "notification_recipient",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NotificationId = table.Column<int>(type: "int(11)", nullable: false),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeliveryMethod = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecipientAddress = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeliveryStatus = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SentAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ReadAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DeliveryAttempts = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DeliveryError = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsRead = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    IsAcknowledged = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    AcknowledgedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PriorityOverride = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeliveryMetadata = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationRecipient_Notification",
                        column: x => x.NotificationId,
                        principalTable: "notification",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "notificationcategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    default_priority = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Medium")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_active = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    display_order = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    icon_class = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    default_require_acknowledgment = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    default_delivery_methods = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, defaultValue: "System")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    created_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updated_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notificationcategories", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ptsdevice",
                columns: table => new
                {
                    PTSId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IPAddress = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PortNumber = table.Column<int>(type: "int(11)", nullable: true),
                    Login = table.Column<string>(type: "varchar(145)", maxLength: 145, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Password = table.Column<string>(type: "varchar(1045)", maxLength: 1045, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProtocolSecurityType = table.Column<string>(type: "varchar(145)", maxLength: 145, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AuthenticationType = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Site = table.Column<int>(type: "int(11)", nullable: true),
                    IsActive = table.Column<sbyte>(type: "tinyint(4)", nullable: false),
                    IsAuthenticated = table.Column<sbyte>(type: "tinyint(4)", nullable: false),
                    WebSocketCapable = table.Column<sbyte>(type: "tinyint(4)", nullable: false),
                    AllowedForDirectCommands = table.Column<sbyte>(type: "tinyint(4)", nullable: false),
                    LastActivity = table.Column<DateTime>(type: "datetime", nullable: true),
                    ConnectionStatus = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AutoAssignUserMasterTag = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PTSId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ptsdevice_pendingcommands",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CommandType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PtsDeviceId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CommandDataJson = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResponseJson = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResponseCode = table.Column<int>(type: "int(11)", nullable: true),
                    Priority = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    Source = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiryAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    PtsdevicePtsid = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_device_commands_ptsdevice",
                        column: x => x.PtsDeviceId,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ptsdevice_pendingcommands_ptsdevice_PtsdevicePtsid",
                        column: x => x.PtsdevicePtsid,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "pumptransaction",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PtsId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PacketId = table.Column<int>(type: "int(11)", nullable: false),
                    DateTimeStart = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DateTime = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Pump = table.Column<int>(type: "int(11)", nullable: true),
                    Nozzle = table.Column<int>(type: "int(11)", nullable: true),
                    FuelGradeId = table.Column<int>(type: "int(11)", nullable: true),
                    FuelGradeName = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Transaction = table.Column<int>(type: "int(11)", nullable: true),
                    Volume = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    TCVolume = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    TotalVolume = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    Tag = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserId = table.Column<int>(type: "int(11)", nullable: true),
                    ConfigurationId = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TankId = table.Column<int>(type: "int(11)", nullable: true),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: true),
                    HasBeenProcessed = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false, comment: "Indicates whether this transaction has been processed by business logic")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pumptransaction",
                        column: x => x.PtsId,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "reconciliationdiscrepancy",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PolicyExecutionId = table.Column<int>(type: "int(11)", nullable: false),
                    TankId = table.Column<int>(type: "int(11)", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    CurrentStock = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    ExpectedStock = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    AbsoluteVariance = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    PercentageVariance = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Severity = table.Column<int>(type: "int(11)", nullable: false),
                    IsResolved = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ResolutionMethod = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AnalysisNotes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TrendAnalysis = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BusinessImpactScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    ReconciliationPolicyId = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ReconciliationEventTriggers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PolicyId = table.Column<int>(type: "int(11)", nullable: false),
                    TriggerReason = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggeredAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsProcessed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TriggeredBy = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReconciliationEventTriggers", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "reconciliationpolicy",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    ExecutionType = table.Column<int>(type: "int", nullable: false),
                    ScheduleFrequencyHours = table.Column<int>(type: "int", nullable: true),
                    ScheduleConfiguration = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DiscrepancyThreshold = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    DiscrepancyPercentageThreshold = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    TankScopeConfiguration = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Priority = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 100),
                    MaxTanksPerExecution = table.Column<int>(type: "int(11)", nullable: true),
                    NotificationConfiguration = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedBy = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ModifiedBy = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedOn = table.Column<DateTime>(type: "datetime", nullable: true),
                    LastExecuted = table.Column<DateTime>(type: "datetime", nullable: true),
                    NextExecution = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "reconciliationpolicyexecution",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PolicyId = table.Column<int>(type: "int(11)", nullable: false),
                    ExecutionStartTime = table.Column<DateTime>(type: "datetime", nullable: false),
                    ExecutedBy = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExecutionEndTime = table.Column<DateTime>(type: "datetime", nullable: true),
                    Status = table.Column<int>(type: "int(11)", nullable: false),
                    TanksEvaluated = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    DiscrepanciesDetected = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    TanksReconciled = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    ReconciliationFailures = table.Column<int>(type: "int(11)", nullable: false, defaultValue: 0),
                    TotalVolumeVariance = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    AveragePercentageVariance = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    ExecutionDurationMs = table.Column<long>(type: "bigint", nullable: true),
                    ErrorMessage = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExecutionResults = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExecutionLog = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReconciliationPolicyExecution_Policy",
                        column: x => x.PolicyId,
                        principalTable: "reconciliationpolicy",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RoleUser",
                columns: table => new
                {
                    RolesId = table.Column<string>(type: "varchar(100)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UsersId = table.Column<string>(type: "varchar(100)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleUser", x => new { x.RolesId, x.UsersId });
                    table.ForeignKey(
                        name: "FK_RoleUser_roles_RolesId",
                        column: x => x.RolesId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "site",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "TINYINT(1)", nullable: false, defaultValue: true, comment: "Indicates whether the site is active for fuel reporting"),
                    site_administrator_id = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                },
                comment: "			")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tank",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TankVolume = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: false),
                    TankHeight = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    ptsID = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UseBookKeeping = table.Column<sbyte>(type: "tinyint(4)", nullable: true, defaultValueSql: "'0'"),
                    SiteID = table.Column<int>(type: "int(11)", nullable: false),
                    DiscrepancyThreshold = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    TankLength = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    CurrentStock = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    LastStockUpdate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    PhysicalStockValue = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    LastPhysicalStockUpdate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PhysicalStockSource = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FuelGradeId = table.Column<int>(type: "int(11)", nullable: true),
                    FuelGradeName = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tank_ptsdevice_ptsID",
                        column: x => x.ptsID,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId");
                    table.ForeignKey(
                        name: "Tank_site",
                        column: x => x.SiteID,
                        principalTable: "site",
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tankmeasurement",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DateTime = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FuelGradeId = table.Column<int>(type: "int(11)", nullable: false),
                    PTSId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProductHeight = table.Column<double>(type: "double", nullable: true),
                    waterHeight = table.Column<double>(type: "double", nullable: true),
                    Temperature = table.Column<double>(type: "double", nullable: true),
                    ProductVolume = table.Column<double>(type: "double", nullable: true),
                    WaterVolume = table.Column<double>(type: "double", nullable: true),
                    ProductTCVolume = table.Column<double>(type: "double", nullable: true),
                    ProductDensity = table.Column<double>(type: "double", nullable: true),
                    ProductMass = table.Column<double>(type: "double", nullable: true),
                    TankFillingPercentage = table.Column<int>(type: "int(11)", nullable: true),
                    ConfigurationId = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PacketId = table.Column<int>(type: "int(11)", nullable: false),
                    ProductUllage = table.Column<double>(type: "double", nullable: true),
                    Status = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tank = table.Column<int>(type: "int(11)", nullable: false),
                    FuelGradeName = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TankId = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                    table.ForeignKey(
                        name: "FK_tankmeasurement_tank_TankId",
                        column: x => x.TankId,
                        principalTable: "tank",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TankmeasurementAlarm",
                columns: table => new
                {
                    TankmeasurementId = table.Column<int>(type: "int(11)", nullable: false),
                    AlarmId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TankmeasurementAlarm", x => new { x.TankmeasurementId, x.AlarmId });
                    table.ForeignKey(
                        name: "FK_TankmeasurementAlarm_alarm_AlarmId",
                        column: x => x.AlarmId,
                        principalTable: "alarm",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TankmeasurementAlarm_tankmeasurement_TankmeasurementId",
                        column: x => x.TankmeasurementId,
                        principalTable: "tankmeasurement",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SiteUser",
                columns: table => new
                {
                    SitesId = table.Column<int>(type: "int(11)", nullable: false),
                    UsersId = table.Column<string>(type: "varchar(100)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteUser", x => new { x.SitesId, x.UsersId });
                    table.ForeignKey(
                        name: "FK_SiteUser_site_SitesId",
                        column: x => x.SitesId,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "stock_adjustments",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    tank_id = table.Column<int>(type: "int(11)", nullable: false),
                    site_id = table.Column<int>(type: "int(11)", nullable: false),
                    adjustment_date = table.Column<DateTime>(type: "datetime", nullable: false),
                    previous_volume = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    new_volume = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    volume_change = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    adjustment_type = table.Column<sbyte>(type: "tinyint(4)", nullable: false, comment: "0=Increase, 1=Decrease, 2=Correction"),
                    reason_code = table.Column<int>(type: "int(11)", nullable: false),
                    reason = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_on = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    approved_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    approved_on = table.Column<DateTime>(type: "datetime", nullable: true),
                    status = table.Column<sbyte>(type: "tinyint(4)", nullable: false, defaultValue: (sbyte)1, comment: "0=Pending, 1=Approved, 2=Rejected"),
                    tank_volume_history_id = table.Column<int>(type: "int(11)", nullable: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "datetime", nullable: true),
                    deleted_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsCorrection = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CorrectsRecordId = table.Column<int>(type: "int(11)", nullable: true),
                    CorrectionReason = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                    table.ForeignKey(
                        name: "FK_stock_adjustments_stock_adjustments_CorrectsRecordId",
                        column: x => x.CorrectsRecordId,
                        principalTable: "stock_adjustments",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_stock_adjustments_site",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_stock_adjustments_tank",
                        column: x => x.tank_id,
                        principalTable: "tank",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StockReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ReportType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GeneratedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeneratedBy = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
                    FilePath = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ContentType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    Parameters = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ErrorMessage = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedOn = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    GeneratedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockReports_site_SiteId",
                        column: x => x.SiteId,
                        principalTable: "site",
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tag",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsEnabled = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    FuelRuleSetId = table.Column<int>(type: "int(11)", nullable: true),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: true),
                    IsMaster = table.Column<sbyte>(type: "tinyint", nullable: true, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                    table.UniqueConstraint("AK_tag_Name", x => x.Name);
                    table.ForeignKey(
                        name: "FuelRuleSetId_FK",
                        column: x => x.FuelRuleSetId,
                        principalTable: "fuelingruleset",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsDeleted = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    MasterRFIDTag = table.Column<int>(type: "int(11)", nullable: true),
                    UserName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NormalizedUserName = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NormalizedEmail = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmailConfirmed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PasswordHash = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SecurityStamp = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConcurrencyStamp = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PhoneNumber = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PhoneNumberConfirmed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TagID_TAGID",
                        column: x => x.MasterRFIDTag,
                        principalTable: "tag",
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tankstock",
                columns: table => new
                {
                    EntryID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankID = table.Column<int>(type: "int(11)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EntryDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ManualOpeningLevel = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ManualClosingLevel = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ManualAmount = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ManualCalculatedUsage = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    SensorOpeningLevel = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ExpectedClosingLevel = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    Discrepancy = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    SensorClosingLevel = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    RecordedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<int>(type: "int(11)", nullable: false),
                    SensorCalculatedUsage = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    Comment = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EntryType = table.Column<int>(type: "int(11)", nullable: false),
                    SensorDiscrepancy = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.EntryID);
                    table.ForeignKey(
                        name: "TankID",
                        column: x => x.TankID,
                        principalTable: "tank",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "TankStock_User",
                        column: x => x.RecordedBy,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "TankStock_site",
                        column: x => x.SiteId,
                        principalTable: "site",
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tanktransfer",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SourceTankId = table.Column<int>(type: "int(11)", nullable: true),
                    DestinationTankId = table.Column<int>(type: "int(11)", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(10,0)", precision: 10, scale: 0, nullable: true),
                    TransferDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    RecordedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "datetime", nullable: true),
                    deleted_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_correction = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    corrects_record_id = table.Column<int>(type: "int(11)", nullable: true),
                    correction_reason = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TankTransfer_CorrectsRecord",
                        column: x => x.corrects_record_id,
                        principalTable: "tanktransfer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TankTransfer_DeletedBy",
                        column: x => x.deleted_by,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "dest",
                        column: x => x.DestinationTankId,
                        principalTable: "tank",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "recordedby",
                        column: x => x.RecordedBy,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "source",
                        column: x => x.SourceTankId,
                        principalTable: "tank",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tankvolumehistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankId = table.Column<int>(type: "int(11)", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime", nullable: false),
                    VolumeChange = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    NewVolume = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ChangeReason = table.Column<int>(type: "int(11)", nullable: false),
                    RecordedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReferenceId = table.Column<int>(type: "int(11)", nullable: true),
                    ReferenceType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false),
                    IsDeleted = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    DeletedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    DeletedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TankVolumeHistory_Tank",
                        column: x => x.TankId,
                        principalTable: "tank",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TankVolumeHistory_User",
                        column: x => x.RecordedBy,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_tankvolumehistory_user_DeletedBy",
                        column: x => x.DeletedBy,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tasks",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    priority = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assigned_to = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assigned_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    assigned_on = table.Column<DateTime>(type: "datetime", nullable: true),
                    due_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    source_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    source_id = table.Column<int>(type: "int", nullable: true),
                    site_id = table.Column<int>(type: "int(11)", nullable: true),
                    tank_id = table.Column<int>(type: "int(11)", nullable: true),
                    completed_on = table.Column<DateTime>(type: "datetime", nullable: true),
                    completed_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    completion_notes = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_on = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_by = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updated_on = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                    table.ForeignKey(
                        name: "FK_task_assigned_by",
                        column: x => x.assigned_by,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_task_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_task_completed_by",
                        column: x => x.completed_by,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_task_created_by",
                        column: x => x.created_by,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_task_site",
                        column: x => x.site_id,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_task_tank",
                        column: x => x.tank_id,
                        principalTable: "tank",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_task_updated_by",
                        column: x => x.updated_by,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "user_activity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Action = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Controller = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActionName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Parameters = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpAddress = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Timestamp = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "user_activity_user_fk",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "user_dashboard_layout",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LayoutName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LayoutJson = table.Column<string>(type: "longtext", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserDashboardLayout_User",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "user_notification_preference",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NotificationCategoryId = table.Column<int>(type: "int", nullable: false),
                    DeliveryMethods = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, defaultValue: "System", collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    Priority = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    QuietHoursStart = table.Column<TimeSpan>(type: "time", nullable: true),
                    QuietHoursEnd = table.Column<TimeSpan>(type: "time", nullable: true),
                    MaxNotificationsPerHour = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    MaxNotificationsPerDay = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    RequireAcknowledgment = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_Category",
                        column: x => x.NotificationCategoryId,
                        principalTable: "notificationcategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserNotificationPreference_User",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "userroles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RoleId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_userroles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "usersite",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => new { x.SiteId, x.UserId });
                    table.ForeignKey(
                        name: "SiteID",
                        column: x => x.SiteId,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "UserID",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vehicle",
                columns: table => new
                {
                    vehicleID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HyoungNo = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VehicleTypeID = table.Column<int>(type: "int(11)", nullable: true, defaultValueSql: "'1'"),
                    VehicleModelID = table.Column<int>(type: "int(11)", nullable: true),
                    VehicleManufacturerID = table.Column<int>(type: "int(11)", nullable: true),
                    YOM = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeviceId = table.Column<int>(type: "int", nullable: true),
                    DefaultEmployeeID = table.Column<int>(type: "int(11)", nullable: true),
                    WorkingSiteID = table.Column<int>(type: "int(11)", nullable: true),
                    ExcessWorkingHrCost = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    NumberPlate = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Average_km_l = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Capacity = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HasGPSInstalled = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    Passenger = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CurrentPhysicalReading = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsCompanyVehicle = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    IsActive = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    GPSGATEGeneratedID = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    DefaultExptdAVGId = table.Column<int>(type: "int(11)", nullable: true),
                    DateCreated = table.Column<DateTime>(type: "datetime", nullable: true),
                    DateModified = table.Column<DateTime>(type: "datetime", nullable: true),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.vehicleID);
                    table.UniqueConstraint("AK_vehicle_HyoungNo", x => x.HyoungNo);
                    table.ForeignKey(
                        name: "Vehicle_employee",
                        column: x => x.DefaultEmployeeID,
                        principalTable: "employee",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicle_expectedAvg",
                        column: x => x.DefaultExptdAVGId,
                        principalTable: "expectedaverage",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "vehicle_manufacturer",
                        column: x => x.VehicleManufacturerID,
                        principalTable: "vehiclemanufacturer",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "vehicle_model",
                        column: x => x.VehicleModelID,
                        principalTable: "vehiclemodel",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "vehicle_site",
                        column: x => x.WorkingSiteID,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicle_user1",
                        column: x => x.CreatedBy,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "vehicle_vehicleType",
                        column: x => x.VehicleTypeID,
                        principalTable: "vehicletype",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "vehilce_user",
                        column: x => x.ModifiedBy,
                        principalTable: "user",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tankvolumeadjustmentaudit",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AdjustmentId = table.Column<int>(type: "int(11)", nullable: false),
                    AffectedRecordId = table.Column<int>(type: "int(11)", nullable: false),
                    OriginalRunningBalance = table.Column<decimal>(type: "decimal(15,3)", precision: 15, scale: 3, nullable: false),
                    NewRunningBalance = table.Column<decimal>(type: "decimal(15,3)", precision: 15, scale: 3, nullable: false),
                    AdjustmentAmount = table.Column<decimal>(type: "decimal(15,3)", precision: 15, scale: 3, nullable: false),
                    AdjustmentTimestamp = table.Column<DateTime>(type: "datetime", nullable: false),
                    AdjustmentReason = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProcessedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TankId = table.Column<int>(type: "int(11)", nullable: false),
                    OriginalVolumeChange = table.Column<decimal>(type: "decimal(15,3)", precision: 15, scale: 3, nullable: true),
                    NewVolumeChange = table.Column<decimal>(type: "decimal(15,3)", precision: 15, scale: 3, nullable: true),
                    OperationType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TankVolumeAdjustmentAudit_Tank",
                        column: x => x.TankId,
                        principalTable: "tank",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TankVolumeAdjustmentAudit_TankVolumeHistory",
                        column: x => x.AffectedRecordId,
                        principalTable: "tankvolumehistory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TankVolumeAdjustmentAudit_User",
                        column: x => x.ProcessedBy,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TagChangeLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: false),
                    Username = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OldTag = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NewTag = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Location = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Timestamp = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Action = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Note = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagChangeLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TagChangeLogs_vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TagMonitoringConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: true),
                    TagName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IgnoredLocations = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Monitored = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagMonitoringConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TagMonitoringConfigs_vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vehicle_documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "CHAR(36)", nullable: false, collation: "ascii_general_ci"),
                    VehicleId = table.Column<int>(type: "INT", nullable: false),
                    DocumentType = table.Column<int>(type: "INT", nullable: false),
                    DocumentNumber = table.Column<string>(type: "VARCHAR(100)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IssueDate = table.Column<DateTime>(type: "DATETIME", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "DATETIME", nullable: false),
                    IssuingAuthority = table.Column<string>(type: "VARCHAR(200)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "VARCHAR(1000)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentFileName = table.Column<string>(type: "VARCHAR(255)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentFileUrl = table.Column<string>(type: "VARCHAR(500)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<int>(type: "INT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME", nullable: false),
                    CreatedBy = table.Column<string>(type: "VARCHAR(100)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "DATETIME", nullable: true),
                    UpdatedBy = table.Column<string>(type: "VARCHAR(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicle_documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_vehicle_documents_vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vehicle_provider_mappings",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    vehicle_id = table.Column<int>(type: "int(11)", nullable: false),
                    provider_config_id = table.Column<int>(type: "int", nullable: false),
                    external_device_id = table.Column<string>(type: "varchar(191)", maxLength: 191, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    device_imei = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    device_name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    device_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    metadata = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_active = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    created_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updated_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicle_provider_mappings", x => x.id);
                    table.ForeignKey(
                        name: "FK_vehicle_provider_mappings_provider_configurations_provider_c~",
                        column: x => x.provider_config_id,
                        principalTable: "provider_configurations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_vehicle_provider_mappings_vehicle_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "vehicleconsumption",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VehicleID = table.Column<int>(type: "int(11)", nullable: false),
                    SiteID = table.Column<int>(type: "int(11)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    MaxSpeed = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    AvgSpeed = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ExpectedConsumption = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    TotalDistance = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    EmployeeName = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Comments = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FuelLost = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    FuelEfficiency = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    TotalFuel = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    FlowMeterFuelUsed = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    FlowMeterFuelLost = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    FlowMeterEffiency = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    EngHours = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    FlowMeterEngineHrs = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ExcessWorkingHrsCost = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    IsNightShift = table.Column<ulong>(type: "bit(1)", nullable: false, defaultValueSql: "b'0'"),
                    IsKmperhr = table.Column<ulong>(type: "bit(1)", nullable: false, defaultValueSql: "b'0'"),
                    ModifiedBy = table.Column<int>(type: "int(11)", nullable: true),
                    ModifiedDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    IsModified = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    ReportId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                    table.ForeignKey(
                        name: "vehicleconsumption_site",
                        column: x => x.SiteID,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "vehicleconsumption_vehicle",
                        column: x => x.VehicleID,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "VehicleMaintenances",
                columns: table => new
                {
                    MaintenanceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VehicleId = table.Column<int>(type: "int(11)", nullable: false),
                    MaintenanceType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ScheduledDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CompletedDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    OdometerAtSchedule = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    OdometerAtCompletion = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    NextDueOdometer = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    NextDueDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Cost = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    ServiceProvider = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    IsOverdue = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedBy = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResponsiblePerson = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateCreated = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DateModified = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MaintenanceScheduleId = table.Column<int>(type: "int", nullable: true),
                    CreatedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleMaintenances", x => x.MaintenanceId);
                    table.ForeignKey(
                        name: "FK_VehicleMaintenances_MaintenanceSchedules_MaintenanceSchedule~",
                        column: x => x.MaintenanceScheduleId,
                        principalTable: "MaintenanceSchedules",
                        principalColumn: "ScheduleId");
                    table.ForeignKey(
                        name: "FK_VehicleMaintenances_user_CreatedByNavigationId",
                        column: x => x.CreatedByNavigationId,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_VehicleMaintenances_user_ModifiedByNavigationId",
                        column: x => x.ModifiedByNavigationId,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_VehicleMaintenances_vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_AcknowledgedAt",
                table: "activealarms",
                column: "AcknowledgedAt");

            migrationBuilder.CreateIndex(
                name: "IX_activealarms_AlarmHandlerId",
                table: "activealarms",
                column: "AlarmHandlerId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_AlarmType",
                table: "activealarms",
                column: "AlarmType");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_AlarmType_State",
                table: "activealarms",
                columns: new[] { "AlarmType", "State" });

            migrationBuilder.CreateIndex(
                name: "IX_activealarms_AlertRecordId",
                table: "activealarms",
                column: "AlertRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_Priority",
                table: "activealarms",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_PtsDeviceId",
                table: "activealarms",
                column: "PtsDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_activealarms_ReconciliationDiscrepancyId",
                table: "activealarms",
                column: "ReconciliationDiscrepancyId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_ResolvedAt",
                table: "activealarms",
                column: "ResolvedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_Severity",
                table: "activealarms",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_SiteId",
                table: "activealarms",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_SiteId_State",
                table: "activealarms",
                columns: new[] { "SiteId", "State" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_State",
                table: "activealarms",
                column: "State");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_State_AutoResolveMinutes",
                table: "activealarms",
                columns: new[] { "State", "AutoResolveMinutes" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_State_Escalation",
                table: "activealarms",
                columns: new[] { "State", "EscalationLevel", "LastEscalatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_State_Priority",
                table: "activealarms",
                columns: new[] { "State", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_State_TriggeredAt",
                table: "activealarms",
                columns: new[] { "State", "TriggeredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_TankId",
                table: "activealarms",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_TankId_State",
                table: "activealarms",
                columns: new[] { "TankId", "State" });

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_TriggeredAt",
                table: "activealarms",
                column: "TriggeredAt");

            migrationBuilder.CreateIndex(
                name: "IX_ActiveAlarms_TriggerSource",
                table: "activealarms",
                column: "TriggerSource");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_AlarmId",
                table: "alarm_handler",
                column: "AlarmId");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_AssignIssueTo",
                table: "alarm_handler",
                column: "AssignIssueTo");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_CreatedBy",
                table: "alarm_handler",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_IssueCategory",
                table: "alarm_handler",
                column: "IssueCategory");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_IssuePriority",
                table: "alarm_handler",
                column: "IssuePriority");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_ModifiedBy",
                table: "alarm_handler",
                column: "ModifiedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandler_AlarmType",
                table: "alarm_handler",
                column: "AlarmType");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandler_IsActive",
                table: "alarm_handler",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandler_NotificationPolicyId",
                table: "alarm_handler",
                column: "NotificationPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandler_SiteId",
                table: "alarm_handler",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandler_TankId",
                table: "alarm_handler",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_execution_IssueTrackerId",
                table: "alarm_handler_execution",
                column: "IssueTrackerId");

            migrationBuilder.CreateIndex(
                name: "IX_alarm_handler_execution_NotificationId",
                table: "alarm_handler_execution",
                column: "NotificationId");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandlerExecution_AlarmHandlerId",
                table: "alarm_handler_execution",
                column: "AlarmHandlerId");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandlerExecution_ExecutedAt",
                table: "alarm_handler_execution",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmHandlerExecution_Success",
                table: "alarm_handler_execution",
                column: "Success");

            migrationBuilder.CreateIndex(
                name: "IX_AutomatedFuelingConfiguration_IsActive",
                table: "automatedfuelingconfigurations",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AutomatedFuelingConfiguration_SiteId",
                table: "automatedfuelingconfigurations",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_AutomatedFuelingConfiguration_SiteId_IsActive_Unique",
                table: "automatedfuelingconfigurations",
                columns: new[] { "SiteId", "IsActive" },
                unique: true,
                filter: "IsActive = 1");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_GroupId",
                table: "BusinessFunctionNotificationGroups",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_IsActive_TriggerSource",
                table: "BusinessFunctionNotificationGroups",
                columns: new[] { "IsActive", "TriggerSource" });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_SiteId",
                table: "BusinessFunctionNotificationGroups",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_TriggerSource",
                table: "BusinessFunctionNotificationGroups",
                column: "TriggerSource");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFunctionNotificationGroups_TriggerSource_SiteId",
                table: "BusinessFunctionNotificationGroups",
                columns: new[] { "TriggerSource", "SiteId" });

            migrationBuilder.CreateIndex(
                name: "UX_BusinessFunctionNotificationGroups_TriggerSource_Group_Site",
                table: "BusinessFunctionNotificationGroups",
                columns: new[] { "TriggerSource", "GroupId", "SiteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "calibrationDataRow_idx",
                table: "calibrationdata",
                column: "VehicleID");

            migrationBuilder.CreateIndex(
                name: "IX_Configuration_Ptsid",
                table: "Configuration",
                column: "Ptsid");

            migrationBuilder.CreateIndex(
                name: "DailyTankReconciliation_TankId_idx",
                table: "dailytankreconciliation",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "unique_tank_date",
                table: "dailytankreconciliation",
                columns: new[] { "TankId", "ReconciliationDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_Category",
                table: "dashboard_widget_instance",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_IsCustom",
                table: "dashboard_widget_instance",
                column: "IsCustomWidget");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_Template",
                table: "dashboard_widget_instance",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_User",
                table: "dashboard_widget_instance",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetInstance_UserTemplate",
                table: "dashboard_widget_instance",
                columns: new[] { "UserId", "TemplateId" });

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetTemplate_Category",
                table: "dashboard_widget_template",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetTemplate_Enabled",
                table: "dashboard_widget_template",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_DashboardWidgetTemplate_Type",
                table: "dashboard_widget_template",
                column: "WidgetType");

            migrationBuilder.CreateIndex(
                name: "Delivery_Supplier_idx",
                table: "delivery",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "Delivery_tank_idx",
                table: "delivery",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "Delivery_User_idx",
                table: "delivery",
                column: "RecordedBy");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_deleted_by",
                table: "delivery",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "IX_Delivery_TankId_DeliveryDate_PricePerLiter",
                table: "delivery",
                columns: new[] { "TankId", "DeliveryDate", "PricePerLiter" });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceConnections_PtsdeviceId",
                table: "DeviceConnections",
                column: "PtsdeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscrepancyRecords_DetectedAt",
                table: "DiscrepancyRecords",
                column: "DetectedAt");

            migrationBuilder.CreateIndex(
                name: "IX_DiscrepancyRecords_ExecutionId",
                table: "DiscrepancyRecords",
                column: "ExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscrepancyRecords_IsResolved",
                table: "DiscrepancyRecords",
                column: "IsResolved");

            migrationBuilder.CreateIndex(
                name: "IX_DiscrepancyRecords_PolicyId",
                table: "DiscrepancyRecords",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscrepancyRecords_TankId",
                table: "DiscrepancyRecords",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "Employe_modifyUser_idx",
                table: "employee",
                column: "ModifiedBy");

            migrationBuilder.CreateIndex(
                name: "Employee_site_idx",
                table: "employee",
                column: "SiteID");

            migrationBuilder.CreateIndex(
                name: "Employee_user_idx",
                table: "employee",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "EmployeeID_idx",
                table: "employeevehicle",
                column: "EmployeeID");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeVehicle_VehiclesVehicleId",
                table: "EmployeeVehicle",
                column: "VehiclesVehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_error_logs_UserId1",
                table: "error_logs",
                column: "UserId1");

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLog_CreatedAt",
                table: "error_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLog_UserId",
                table: "error_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "Expected_classification_idx",
                table: "expectedaverage",
                column: "ExpectedAverageClassificationID");

            migrationBuilder.CreateIndex(
                name: "Expected_vehicle_idx",
                table: "expectedaverage",
                column: "VehicleID");

            migrationBuilder.CreateIndex(
                name: "Site_idx",
                table: "expectedaverage",
                column: "SiteID");

            migrationBuilder.CreateIndex(
                name: "UniqueRecord",
                table: "expectedaverage",
                columns: new[] { "VehicleID", "SiteID", "ExpectedAverageClassificationID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "FK_FuelingRule_FuelingRuleSet_idx",
                table: "fuelingrule",
                column: "FuelingRuleSetId");

            migrationBuilder.CreateIndex(
                name: "IX_fuelingrule_SiteId",
                table: "fuelingrule",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_fuelingrule_VehicleId",
                table: "fuelingrule",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "fuelrefill_date_idx",
                table: "fuelrefil",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "fuelrefill_site_idx",
                table: "fuelrefil",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "fuelrefill_tank_idx",
                table: "fuelrefil",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "fuelrefill_user_idx",
                table: "fuelrefil",
                column: "FuelBy");

            migrationBuilder.CreateIndex(
                name: "fuelrefill_vehicle_idx",
                table: "fuelrefil",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_fuelrefil_corrects_record_id",
                table: "fuelrefil",
                column: "corrects_record_id");

            migrationBuilder.CreateIndex(
                name: "IX_fuelrefil_deleted_by",
                table: "fuelrefil",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "IX_fuelrefil_DriverId",
                table: "fuelrefil",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_fuelrefil_PumpTranscationId",
                table: "fuelrefil",
                column: "PumpTranscationId");

            migrationBuilder.CreateIndex(
                name: "IX_fuelrefil_TagId",
                table: "fuelrefil",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "fuelregenrate_user_idx",
                table: "fuelreportgenerate",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "fuelregenrate_user_idx1",
                table: "fuelreportgenerate",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "fk_fuel_import_history_user",
                table: "fuelreportimportlog",
                column: "ImportedBy");

            migrationBuilder.CreateIndex(
                name: "FuelReportImportLog",
                table: "fuelreportimportlog",
                column: "ReportId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "SiteID_reportID_idx",
                table: "fuelreportimportlog",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "fk_psTID_idx",
                table: "intankdelivery",
                column: "PTSId");

            migrationBuilder.CreateIndex(
                name: "Assigned_issue_idx",
                table: "issueassignmenttracker",
                column: "Issue");

            migrationBuilder.CreateIndex(
                name: "AssignedFrom_idx",
                table: "issueassignmenttracker",
                column: "AssignedFrom");

            migrationBuilder.CreateIndex(
                name: "AssigneTo_idx",
                table: "issueassignmenttracker",
                column: "AssignedTo");

            migrationBuilder.CreateIndex(
                name: "activealarm_idx",
                table: "issuetracker",
                column: "ActiveAlarmId");

            migrationBuilder.CreateIndex(
                name: "issetracker_issueID_idx",
                table: "issuetracker",
                column: "IssueCategoryID");

            migrationBuilder.CreateIndex(
                name: "Issue_tracker_issuepriorty_idx",
                table: "issuetracker",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "Issue_user_idx",
                table: "issuetracker",
                column: "AssignTo");

            migrationBuilder.CreateIndex(
                name: "issue_vehicle_idx",
                table: "issuetracker",
                column: "VehicleID");

            migrationBuilder.CreateIndex(
                name: "issuetracker_site_idx",
                table: "issuetracker",
                column: "siteID");

            migrationBuilder.CreateIndex(
                name: "Issuetracker_status_idx",
                table: "issuetracker",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "Isuse_deviceType_idx",
                table: "issuetracker",
                column: "DeviceType");

            migrationBuilder.CreateIndex(
                name: "openby_idx",
                table: "issuetracker",
                column: "openby");

            migrationBuilder.CreateIndex(
                name: "FK_LoginActivities_Users",
                table: "loginactivities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceIssues_CreatedByNavigationId",
                table: "MaintenanceIssues",
                column: "CreatedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceIssues_MaintenanceId",
                table: "MaintenanceIssues",
                column: "MaintenanceId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceIssues_ModifiedByNavigationId",
                table: "MaintenanceIssues",
                column: "ModifiedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceSchedules_CreatedByNavigationId",
                table: "MaintenanceSchedules",
                column: "CreatedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceSchedules_ModifiedByNavigationId",
                table: "MaintenanceSchedules",
                column: "ModifiedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceSchedules_VehicleId",
                table: "MaintenanceSchedules",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceSchedules_VehicleTypeId",
                table: "MaintenanceSchedules",
                column: "VehicleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_AlarmId",
                table: "notification",
                column: "ActiveAlarmId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_Category",
                table: "notification",
                column: "NotificationCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_CreatedAt",
                table: "notification",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_notification_IssueTrackerId",
                table: "notification",
                column: "IssueTrackerId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_NotificationId",
                table: "notification",
                column: "NotificationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notification_NotificationPolicyId",
                table: "notification",
                column: "NotificationPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_Priority",
                table: "notification",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_PtsDeviceId",
                table: "notification",
                column: "PtsDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_ScheduledAt",
                table: "notification",
                column: "ScheduledAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_SentAt",
                table: "notification",
                column: "SentAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_SiteId",
                table: "notification",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_Status",
                table: "notification",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_TankId",
                table: "notification",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_TriggeredBy",
                table: "notification",
                column: "TriggeredBy");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_Type",
                table: "notification",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_VehicleId",
                table: "notification",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_notification_group_SiteId",
                table: "notification_group",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationGroup_Name_SiteId",
                table: "notification_group",
                columns: new[] { "Name", "SiteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationGroupMember_UQ",
                table: "notification_group_member",
                columns: new[] { "GroupId", "MemberType", "MemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_policy_IssueCategory",
                table: "notification_policy",
                column: "IssueCategory");

            migrationBuilder.CreateIndex(
                name: "IX_notification_policy_IssuePriority",
                table: "notification_policy",
                column: "IssuePriority");

            migrationBuilder.CreateIndex(
                name: "IX_notification_policy_ModifiedBy",
                table: "notification_policy",
                column: "ModifiedBy");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_Category",
                table: "notification_policy",
                column: "NotificationCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_CreatedAt",
                table: "notification_policy",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_CreatedBy",
                table: "notification_policy",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_IsActive",
                table: "notification_policy",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_Name",
                table: "notification_policy",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_NotificationType",
                table: "notification_policy",
                column: "NotificationType");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_PtsDeviceId",
                table: "notification_policy",
                column: "PtsDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicy_SiteId",
                table: "notification_policy",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_notification_policy_group_GroupId",
                table: "notification_policy_group",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicyGroup_UQ",
                table: "notification_policy_group",
                columns: new[] { "PolicyId", "GroupId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_policy_recipient_CreatedBy",
                table: "notification_policy_recipient",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicyRecipient_NotificationPolicyId",
                table: "notification_policy_recipient",
                column: "NotificationPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPolicyRecipient_UserId",
                table: "notification_policy_recipient",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_DeliveryMethod",
                table: "notification_recipient",
                column: "DeliveryMethod");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_DeliveryStatus",
                table: "notification_recipient",
                column: "DeliveryStatus");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_IsRead",
                table: "notification_recipient",
                column: "IsRead");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_NotificationId",
                table: "notification_recipient",
                column: "NotificationId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_SentAt",
                table: "notification_recipient",
                column: "SentAt");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_UserId",
                table: "notification_recipient",
                column: "UserId");

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
                name: "FK_Permissions_Parent",
                table: "permissions",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "Name_UNIQUE1",
                table: "permissions",
                column: "Name",
                unique: true);

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
                name: "IX_PTSAlertRecord_alarm_id",
                table: "PTSAlertRecord",
                column: "alarm_id");

            migrationBuilder.CreateIndex(
                name: "PTSDevice_site_idx",
                table: "ptsdevice",
                column: "Site");

            migrationBuilder.CreateIndex(
                name: "IX_device_commands_CommandType",
                table: "ptsdevice_pendingcommands",
                column: "CommandType");

            migrationBuilder.CreateIndex(
                name: "IX_device_commands_PtsDeviceId",
                table: "ptsdevice_pendingcommands",
                column: "PtsDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_device_commands_PtsDeviceId_Status",
                table: "ptsdevice_pendingcommands",
                columns: new[] { "PtsDeviceId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ptsdevice_pendingcommands_PtsdevicePtsid",
                table: "ptsdevice_pendingcommands",
                column: "PtsdevicePtsid");

            migrationBuilder.CreateIndex(
                name: "FK_pumptransaction_idx",
                table: "pumptransaction",
                column: "PtsId");

            migrationBuilder.CreateIndex(
                name: "idx_pumptransaction_datetime",
                table: "pumptransaction",
                column: "DateTime");

            migrationBuilder.CreateIndex(
                name: "idx_pumptransaction_processed",
                table: "pumptransaction",
                column: "HasBeenProcessed");

            migrationBuilder.CreateIndex(
                name: "idx_pumptransaction_pts_transaction_unique",
                table: "pumptransaction",
                columns: new[] { "PtsId", "Transaction" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_pumptransaction_pump_transaction",
                table: "pumptransaction",
                columns: new[] { "Pump", "Transaction" });

            migrationBuilder.CreateIndex(
                name: "idx_pumptransaction_tankid",
                table: "pumptransaction",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "idx_pumptransaction_vehicleid",
                table: "pumptransaction",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "FK_ReconciliationDiscrepancy_PolicyExecution_idx",
                table: "reconciliationdiscrepancy",
                column: "PolicyExecutionId");

            migrationBuilder.CreateIndex(
                name: "FK_ReconciliationDiscrepancy_Tank_idx",
                table: "reconciliationdiscrepancy",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationDiscrepancy_DetectedAt",
                table: "reconciliationdiscrepancy",
                column: "DetectedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationDiscrepancy_IsResolved",
                table: "reconciliationdiscrepancy",
                column: "IsResolved");

            migrationBuilder.CreateIndex(
                name: "IX_reconciliationdiscrepancy_ReconciliationPolicyId",
                table: "reconciliationdiscrepancy",
                column: "ReconciliationPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationDiscrepancy_Severity",
                table: "reconciliationdiscrepancy",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationEventTriggers_PolicyId",
                table: "ReconciliationEventTriggers",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "FK_ReconciliationPolicy_CreatedBy_idx",
                table: "reconciliationpolicy",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "FK_ReconciliationPolicy_ModifiedBy_idx",
                table: "reconciliationpolicy",
                column: "ModifiedBy");

            migrationBuilder.CreateIndex(
                name: "FK_ReconciliationPolicy_Site_idx",
                table: "reconciliationpolicy",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationPolicy_IsActive",
                table: "reconciliationpolicy",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationPolicy_NextExecution",
                table: "reconciliationpolicy",
                column: "NextExecution");

            migrationBuilder.CreateIndex(
                name: "FK_ReconciliationPolicyExecution_Policy_idx",
                table: "reconciliationpolicyexecution",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationPolicyExecution_ExecutionStartTime",
                table: "reconciliationpolicyexecution",
                column: "ExecutionStartTime");

            migrationBuilder.CreateIndex(
                name: "IX_ReconciliationPolicyExecution_Status",
                table: "reconciliationpolicyexecution",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_rolenavigation_navigationItemId",
                table: "rolenavigation",
                column: "navigationItemId");

            migrationBuilder.CreateIndex(
                name: "IX_rolenavigation_RoleId",
                table: "rolenavigation",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_rolepermissions_PermissionId",
                table: "rolepermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_rolepermissions_RoleId_PermissionId",
                table: "rolepermissions",
                columns: new[] { "RoleId", "PermissionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoleUser_UsersId",
                table: "RoleUser",
                column: "UsersId");

            migrationBuilder.CreateIndex(
                name: "IX_Site_SiteAdministrator",
                table: "site",
                column: "site_administrator_id");

            migrationBuilder.CreateIndex(
                name: "IX_SiteUser_UsersId",
                table: "SiteUser",
                column: "UsersId");

            migrationBuilder.CreateIndex(
                name: "idx_stock_adjustments_created_by",
                table: "stock_adjustments",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "idx_stock_adjustments_date",
                table: "stock_adjustments",
                column: "adjustment_date");

            migrationBuilder.CreateIndex(
                name: "idx_stock_adjustments_site_id",
                table: "stock_adjustments",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "idx_stock_adjustments_status",
                table: "stock_adjustments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_stock_adjustments_tank_date",
                table: "stock_adjustments",
                columns: new[] { "tank_id", "adjustment_date" });

            migrationBuilder.CreateIndex(
                name: "idx_stock_adjustments_tank_id",
                table: "stock_adjustments",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_approved_by",
                table: "stock_adjustments",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_CorrectsRecordId",
                table: "stock_adjustments",
                column: "CorrectsRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_deleted_by",
                table: "stock_adjustments",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_tank_volume_history_id",
                table: "stock_adjustments",
                column: "tank_volume_history_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockReports_GeneratedByNavigationId",
                table: "StockReports",
                column: "GeneratedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_StockReports_SiteId",
                table: "StockReports",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigurations_Category",
                table: "SystemConfigurations",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigurations_ConfigurationKey",
                table: "SystemConfigurations",
                column: "ConfigurationKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigurations_IsActive_ConfigurationKey",
                table: "SystemConfigurations",
                columns: new[] { "IsActive", "ConfigurationKey" });

            migrationBuilder.CreateIndex(
                name: "FuelRuleSetId_FK_idx",
                table: "tag",
                column: "FuelRuleSetId");

            migrationBuilder.CreateIndex(
                name: "Name_UNIQUE",
                table: "tag",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "TAG_Vehicle_idx",
                table: "tag",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_TagChangeLogs_VehicleId",
                table: "TagChangeLogs",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_TagMonitoringConfigs_VehicleId",
                table: "TagMonitoringConfigs",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_tank_ptsID",
                table: "tank",
                column: "ptsID");

            migrationBuilder.CreateIndex(
                name: "Tank_site_idx",
                table: "tank",
                column: "SiteID");

            migrationBuilder.CreateIndex(
                name: "IX_tankmeasurement_TankId",
                table: "tankmeasurement",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_TankmeasurementAlarm_AlarmId",
                table: "TankmeasurementAlarm",
                column: "AlarmId");

            migrationBuilder.CreateIndex(
                name: "TankID_idx",
                table: "tankstock",
                column: "TankID");

            migrationBuilder.CreateIndex(
                name: "TankStock_site_idx",
                table: "tankstock",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "TankStock_User_idx",
                table: "tankstock",
                column: "RecordedBy");

            migrationBuilder.CreateIndex(
                name: "dest_idx",
                table: "tanktransfer",
                column: "DestinationTankId");

            migrationBuilder.CreateIndex(
                name: "IX_tanktransfer_corrects_record_id",
                table: "tanktransfer",
                column: "corrects_record_id");

            migrationBuilder.CreateIndex(
                name: "IX_tanktransfer_deleted_by",
                table: "tanktransfer",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "recordedby_idx",
                table: "tanktransfer",
                column: "RecordedBy");

            migrationBuilder.CreateIndex(
                name: "source_idx",
                table: "tanktransfer",
                column: "SourceTankId");

            migrationBuilder.CreateIndex(
                name: "IX_TankVolumeAdjustmentAudit_AdjustmentId",
                table: "tankvolumeadjustmentaudit",
                column: "AdjustmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TankVolumeAdjustmentAudit_AffectedRecordId",
                table: "tankvolumeadjustmentaudit",
                column: "AffectedRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_TankVolumeAdjustmentAudit_ProcessedBy",
                table: "tankvolumeadjustmentaudit",
                column: "ProcessedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TankVolumeAdjustmentAudit_TankId",
                table: "tankvolumeadjustmentaudit",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_TankVolumeAdjustmentAudit_Timestamp",
                table: "tankvolumeadjustmentaudit",
                column: "AdjustmentTimestamp");

            migrationBuilder.CreateIndex(
                name: "FK_TankVolumeHistory_Tank_idx",
                table: "tankvolumehistory",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "FK_TankVolumeHistory_User_idx",
                table: "tankvolumehistory",
                column: "RecordedBy");

            migrationBuilder.CreateIndex(
                name: "IX_tankvolumehistory_DeletedBy",
                table: "tankvolumehistory",
                column: "DeletedBy");

            migrationBuilder.CreateIndex(
                name: "IX_task_assigned_to",
                table: "tasks",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_task_created_on",
                table: "tasks",
                column: "created_on");

            migrationBuilder.CreateIndex(
                name: "IX_task_due_date",
                table: "tasks",
                column: "due_date");

            migrationBuilder.CreateIndex(
                name: "IX_task_priority",
                table: "tasks",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "IX_task_site_id",
                table: "tasks",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_source",
                table: "tasks",
                columns: new[] { "source_type", "source_id" });

            migrationBuilder.CreateIndex(
                name: "IX_task_source_type",
                table: "tasks",
                column: "source_type");

            migrationBuilder.CreateIndex(
                name: "IX_task_status",
                table: "tasks",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_task_tank_id",
                table: "tasks",
                column: "tank_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_assigned_by",
                table: "tasks",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_completed_by",
                table: "tasks",
                column: "completed_by");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_created_by",
                table: "tasks",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_updated_by",
                table: "tasks",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_user_MasterRFIDTag",
                table: "user",
                column: "MasterRFIDTag");

            migrationBuilder.CreateIndex(
                name: "UserName_UNIQUE",
                table: "user",
                column: "UserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserId",
                table: "user_activity",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDashboardLayout_User",
                table: "user_dashboard_layout",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDashboardLayout_UserActive",
                table: "user_dashboard_layout",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_user_notification_preference_CreatedBy",
                table: "user_notification_preference",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_user_notification_preference_UpdatedBy",
                table: "user_notification_preference",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreference_Category",
                table: "user_notification_preference",
                column: "NotificationCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreference_CreatedAt",
                table: "user_notification_preference",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreference_IsEnabled",
                table: "user_notification_preference",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreference_UserCategory",
                table: "user_notification_preference",
                columns: new[] { "UserId", "NotificationCategoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreference_UserId",
                table: "user_notification_preference",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_userroles_RoleId",
                table: "userroles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_userroles_UserId_RoleId",
                table: "userroles",
                columns: new[] { "UserId", "RoleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserID_idx",
                table: "usersite",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "HyoungNo_UNIQUE",
                table: "vehicle",
                column: "HyoungNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Vehicle_employee_idx",
                table: "vehicle",
                column: "DefaultEmployeeID");

            migrationBuilder.CreateIndex(
                name: "vehicle_expectedAvg_idx",
                table: "vehicle",
                column: "DefaultExptdAVGId");

            migrationBuilder.CreateIndex(
                name: "vehicle_manufacturer_idx",
                table: "vehicle",
                column: "VehicleManufacturerID");

            migrationBuilder.CreateIndex(
                name: "vehicle_model_idx",
                table: "vehicle",
                column: "VehicleModelID");

            migrationBuilder.CreateIndex(
                name: "vehicle_site_idx",
                table: "vehicle",
                column: "WorkingSiteID");

            migrationBuilder.CreateIndex(
                name: "vehicle_user1_idx",
                table: "vehicle",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "vehicle_vehicleType_idx",
                table: "vehicle",
                column: "VehicleTypeID");

            migrationBuilder.CreateIndex(
                name: "vehilce_user_idx",
                table: "vehicle",
                column: "ModifiedBy");

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_documents_DocumentType",
                table: "vehicle_documents",
                column: "DocumentType");

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_documents_ExpiryDate",
                table: "vehicle_documents",
                column: "ExpiryDate");

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_documents_Status",
                table: "vehicle_documents",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_vehicle_documents_VehicleId",
                table: "vehicle_documents",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "UK_vehicle_documents_VehicleId_DocumentType_DocumentNumber",
                table: "vehicle_documents",
                columns: new[] { "VehicleId", "DocumentType", "DocumentNumber" },
                unique: true);

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
                name: "vehicle_date_shift_unique",
                table: "vehicleconsumption",
                columns: new[] { "VehicleID", "Date", "IsNightShift" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "vehicleconsumption_site_idx",
                table: "vehicleconsumption",
                column: "SiteID");

            migrationBuilder.CreateIndex(
                name: "vehicleconsumption_user_idx",
                table: "vehicleconsumption",
                column: "ModifiedBy");

            migrationBuilder.CreateIndex(
                name: "vehilceconsumption_fuelreport_idx",
                table: "vehicleconsumption",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenances_CreatedByNavigationId",
                table: "VehicleMaintenances",
                column: "CreatedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenances_MaintenanceScheduleId",
                table: "VehicleMaintenances",
                column: "MaintenanceScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenances_ModifiedByNavigationId",
                table: "VehicleMaintenances",
                column: "ModifiedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenances_VehicleId",
                table: "VehicleMaintenances",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_vehiclemodel_ManufacturerID",
                table: "vehiclemodel",
                column: "ManufacturerID");

            migrationBuilder.AddForeignKey(
                name: "FK_ActiveAlarms_AlarmHandlers",
                table: "activealarms",
                column: "AlarmHandlerId",
                principalTable: "alarm_handler",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ActiveAlarms_ReconciliationDiscrepancies",
                table: "activealarms",
                column: "ReconciliationDiscrepancyId",
                principalTable: "reconciliationdiscrepancy",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ActiveAlarms_Sites",
                table: "activealarms",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ActiveAlarms_Tanks",
                table: "activealarms",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AlarmHandler_AssignIssueTo",
                table: "alarm_handler",
                column: "AssignIssueTo",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AlarmHandler_CreatedBy",
                table: "alarm_handler",
                column: "CreatedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AlarmHandler_ModifiedBy",
                table: "alarm_handler",
                column: "ModifiedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AlarmHandler_NotificationPolicy",
                table: "alarm_handler",
                column: "NotificationPolicyId",
                principalTable: "notification_policy",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AlarmHandler_Site",
                table: "alarm_handler",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AlarmHandler_Tank",
                table: "alarm_handler",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AlarmHandlerExecution_Notification",
                table: "alarm_handler_execution",
                column: "NotificationId",
                principalTable: "notification",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_alarm_handler_execution_issuetracker_IssueTrackerId",
                table: "alarm_handler_execution",
                column: "IssueTrackerId",
                principalTable: "issuetracker",
                principalColumn: "ID");

            migrationBuilder.AddForeignKey(
                name: "FK_AutomatedFuelingConfiguration_Site",
                table: "automatedfuelingconfigurations",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BusinessFunctionNotificationGroup_Group",
                table: "BusinessFunctionNotificationGroups",
                column: "GroupId",
                principalTable: "notification_group",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BusinessFunctionNotificationGroup_Site",
                table: "BusinessFunctionNotificationGroups",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "calibrationData_vehicle",
                table: "calibrationdata",
                column: "VehicleID",
                principalTable: "vehicle",
                principalColumn: "HyoungNo");

            migrationBuilder.AddForeignKey(
                name: "FK_Configuration_ptsdevice_Ptsid",
                table: "Configuration",
                column: "Ptsid",
                principalTable: "ptsdevice",
                principalColumn: "PTSId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "DailyTankReconciliation_TankId",
                table: "dailytankreconciliation",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DashboardWidgetInstance_User",
                table: "dashboard_widget_instance",
                column: "UserId",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "Delivery_DeletedBy",
                table: "delivery",
                column: "deleted_by",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "Delivery_User",
                table: "delivery",
                column: "RecordedBy",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "Delivery_tank",
                table: "delivery",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeviceConnections_ptsdevice_PtsdeviceId",
                table: "DeviceConnections",
                column: "PtsdeviceId",
                principalTable: "ptsdevice",
                principalColumn: "PTSId");

            migrationBuilder.AddForeignKey(
                name: "FK_DiscrepancyRecords_reconciliationpolicy_PolicyId",
                table: "DiscrepancyRecords",
                column: "PolicyId",
                principalTable: "reconciliationpolicy",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DiscrepancyRecords_reconciliationpolicyexecution_ExecutionId",
                table: "DiscrepancyRecords",
                column: "ExecutionId",
                principalTable: "reconciliationpolicyexecution",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DiscrepancyRecords_tank_TankId",
                table: "DiscrepancyRecords",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_employee_site_SiteID",
                table: "employee",
                column: "SiteID",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_employee_user_CreatedBy",
                table: "employee",
                column: "CreatedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_employee_user_ModifiedBy",
                table: "employee",
                column: "ModifiedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "VehicleID",
                table: "employeevehicle",
                column: "VehicleID",
                principalTable: "vehicle",
                principalColumn: "vehicleID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeVehicle_vehicle_VehiclesVehicleId",
                table: "EmployeeVehicle",
                column: "VehiclesVehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_error_logs_user_UserId1",
                table: "error_logs",
                column: "UserId1",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_error_logs_user_user_id",
                table: "error_logs",
                column: "user_id",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "Expected_site",
                table: "expectedaverage",
                column: "SiteID",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "Expected_vehicle",
                table: "expectedaverage",
                column: "VehicleID",
                principalTable: "vehicle",
                principalColumn: "vehicleID");

            migrationBuilder.AddForeignKey(
                name: "FK_FuelingRule_Site",
                table: "fuelingrule",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelingRule_Vehicle",
                table: "fuelingrule",
                column: "VehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_deleted_by",
                table: "fuelrefil",
                column: "deleted_by",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_user",
                table: "fuelrefil",
                column: "FuelBy",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_pump_transaction",
                table: "fuelrefil",
                column: "PumpTranscationId",
                principalTable: "pumptransaction",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_site",
                table: "fuelrefil",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_tag",
                table: "fuelrefil",
                column: "TagId",
                principalTable: "tag",
                principalColumn: "Name",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_tank",
                table: "fuelrefil",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fuelrefill_vehicle",
                table: "fuelrefil",
                column: "VehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID");

            migrationBuilder.AddForeignKey(
                name: "FK_fuelreportimportlog_site",
                table: "fuelreportimportlog",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_fuel_import_history_user",
                table: "fuelreportimportlog",
                column: "ImportedBy",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "fk_psTID",
                table: "intankdelivery",
                column: "PTSId",
                principalTable: "ptsdevice",
                principalColumn: "PTSId");

            migrationBuilder.AddForeignKey(
                name: "Assigned_Issue_To",
                table: "issueassignmenttracker",
                column: "AssignedTo",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "assigned_user_From",
                table: "issueassignmenttracker",
                column: "AssignedFrom",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "Assigned_issue",
                table: "issueassignmenttracker",
                column: "Issue",
                principalTable: "issuetracker",
                principalColumn: "ID");

            migrationBuilder.AddForeignKey(
                name: "Issue_user",
                table: "issuetracker",
                column: "AssignTo",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "issue_ser",
                table: "issuetracker",
                column: "openby",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "issue_vehicle",
                table: "issuetracker",
                column: "VehicleID",
                principalTable: "vehicle",
                principalColumn: "vehicleID");

            migrationBuilder.AddForeignKey(
                name: "issuetracker_site",
                table: "issuetracker",
                column: "siteID",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_LoginActivities_Users",
                table: "loginactivities",
                column: "UserId",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceIssues_VehicleMaintenances_MaintenanceId",
                table: "MaintenanceIssues",
                column: "MaintenanceId",
                principalTable: "VehicleMaintenances",
                principalColumn: "MaintenanceId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceIssues_user_CreatedByNavigationId",
                table: "MaintenanceIssues",
                column: "CreatedByNavigationId",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceIssues_user_ModifiedByNavigationId",
                table: "MaintenanceIssues",
                column: "ModifiedByNavigationId",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceSchedules_user_CreatedByNavigationId",
                table: "MaintenanceSchedules",
                column: "CreatedByNavigationId",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceSchedules_user_ModifiedByNavigationId",
                table: "MaintenanceSchedules",
                column: "ModifiedByNavigationId",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceSchedules_vehicle_VehicleId",
                table: "MaintenanceSchedules",
                column: "VehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID");

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_NotificationCategories",
                table: "notification",
                column: "NotificationCategoryId",
                principalTable: "notificationcategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_NotificationPolicy",
                table: "notification",
                column: "NotificationPolicyId",
                principalTable: "notification_policy",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_PtsDevice",
                table: "notification",
                column: "PtsDeviceId",
                principalTable: "ptsdevice",
                principalColumn: "PTSId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_Site",
                table: "notification",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_Tank",
                table: "notification",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_TriggeredBy",
                table: "notification",
                column: "TriggeredBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_Vehicle",
                table: "notification",
                column: "VehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationGroup_Site",
                table: "notification_group",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_Category",
                table: "notification_policy",
                column: "NotificationCategoryId",
                principalTable: "notificationcategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_CreatedBy",
                table: "notification_policy",
                column: "CreatedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_ModifiedBy",
                table: "notification_policy",
                column: "ModifiedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_PtsDevice",
                table: "notification_policy",
                column: "PtsDeviceId",
                principalTable: "ptsdevice",
                principalColumn: "PTSId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicy_Site",
                table: "notification_policy",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicyRecipient_CreatedBy",
                table: "notification_policy_recipient",
                column: "CreatedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPolicyRecipient_User",
                table: "notification_policy_recipient",
                column: "UserId",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationRecipient_User",
                table: "notification_recipient",
                column: "UserId",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_notification_categories_createdby",
                table: "notificationcategories",
                column: "created_by",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_notification_categories_updatedby",
                table: "notificationcategories",
                column: "updated_by",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "PTSDevice_site",
                table: "ptsdevice",
                column: "Site",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_tank",
                table: "pumptransaction",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_vehicle",
                table: "pumptransaction",
                column: "VehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationDiscrepancy_PolicyExecution",
                table: "reconciliationdiscrepancy",
                column: "PolicyExecutionId",
                principalTable: "reconciliationpolicyexecution",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationDiscrepancy_Tank",
                table: "reconciliationdiscrepancy",
                column: "TankId",
                principalTable: "tank",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_reconciliationdiscrepancy_reconciliationpolicy_Reconciliatio~",
                table: "reconciliationdiscrepancy",
                column: "ReconciliationPolicyId",
                principalTable: "reconciliationpolicy",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationEventTriggers_reconciliationpolicy_PolicyId",
                table: "ReconciliationEventTriggers",
                column: "PolicyId",
                principalTable: "reconciliationpolicy",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationPolicy_CreatedBy",
                table: "reconciliationpolicy",
                column: "CreatedBy",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationPolicy_ModifiedBy",
                table: "reconciliationpolicy",
                column: "ModifiedBy",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReconciliationPolicy_Site",
                table: "reconciliationpolicy",
                column: "SiteId",
                principalTable: "site",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_RoleUser_user_UsersId",
                table: "RoleUser",
                column: "UsersId",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Site_SiteAdministrator",
                table: "site",
                column: "site_administrator_id",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SiteUser_user_UsersId",
                table: "SiteUser",
                column: "UsersId",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_approved_by",
                table: "stock_adjustments",
                column: "approved_by",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_created_by",
                table: "stock_adjustments",
                column: "created_by",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_deleted_by",
                table: "stock_adjustments",
                column: "deleted_by",
                principalTable: "user",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_stock_adjustments_volume_history",
                table: "stock_adjustments",
                column: "tank_volume_history_id",
                principalTable: "tankvolumehistory",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_StockReports_user_GeneratedByNavigationId",
                table: "StockReports",
                column: "GeneratedByNavigationId",
                principalTable: "user",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "TAG_Vehicle",
                table: "tag",
                column: "VehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Prevent destructive rollback on production baseline.
            return;
            migrationBuilder.DropForeignKey(
                name: "FK_employee_site_SiteID",
                table: "employee");

            migrationBuilder.DropForeignKey(
                name: "Expected_site",
                table: "expectedaverage");

            migrationBuilder.DropForeignKey(
                name: "vehicle_site",
                table: "vehicle");

            migrationBuilder.DropForeignKey(
                name: "FK_employee_user_CreatedBy",
                table: "employee");

            migrationBuilder.DropForeignKey(
                name: "FK_employee_user_ModifiedBy",
                table: "employee");

            migrationBuilder.DropForeignKey(
                name: "vehicle_user1",
                table: "vehicle");

            migrationBuilder.DropForeignKey(
                name: "vehilce_user",
                table: "vehicle");

            migrationBuilder.DropForeignKey(
                name: "Expected_vehicle",
                table: "expectedaverage");

            migrationBuilder.DropTable(
                name: "alarm_handler_execution");

            migrationBuilder.DropTable(
                name: "Assets");

            migrationBuilder.DropTable(
                name: "automatedfuelingconfigurations");

            migrationBuilder.DropTable(
                name: "BusinessFunctionNotificationGroups");

            migrationBuilder.DropTable(
                name: "calibrationdata");

            migrationBuilder.DropTable(
                name: "Configuration");

            migrationBuilder.DropTable(
                name: "dailytankreconciliation");

            migrationBuilder.DropTable(
                name: "dashboard_widget_instance");

            migrationBuilder.DropTable(
                name: "delivery");

            migrationBuilder.DropTable(
                name: "DeviceConnections");

            migrationBuilder.DropTable(
                name: "DiscrepancyRecords");

            migrationBuilder.DropTable(
                name: "employeevehicle");

            migrationBuilder.DropTable(
                name: "EmployeeVehicle");

            migrationBuilder.DropTable(
                name: "error_logs");

            migrationBuilder.DropTable(
                name: "fuelingrule");

            migrationBuilder.DropTable(
                name: "fuelrefil");

            migrationBuilder.DropTable(
                name: "fuelreportgenerate");

            migrationBuilder.DropTable(
                name: "fuelreportimportlog");

            migrationBuilder.DropTable(
                name: "intankdelivery");

            migrationBuilder.DropTable(
                name: "issueassignmenttracker");

            migrationBuilder.DropTable(
                name: "loginactivities");

            migrationBuilder.DropTable(
                name: "MaintenanceIssues");

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
                name: "ptsdevice_pendingcommands");

            migrationBuilder.DropTable(
                name: "ReconciliationEventTriggers");

            migrationBuilder.DropTable(
                name: "reportitem");

            migrationBuilder.DropTable(
                name: "RoleClaims");

            migrationBuilder.DropTable(
                name: "rolenavigation");

            migrationBuilder.DropTable(
                name: "rolepermissions");

            migrationBuilder.DropTable(
                name: "RoleUser");

            migrationBuilder.DropTable(
                name: "SiteUser");

            migrationBuilder.DropTable(
                name: "stock_adjustments");

            migrationBuilder.DropTable(
                name: "StockReports");

            migrationBuilder.DropTable(
                name: "SystemConfigurations");

            migrationBuilder.DropTable(
                name: "TagChangeLogs");

            migrationBuilder.DropTable(
                name: "TagMonitoringConfigs");

            migrationBuilder.DropTable(
                name: "TankmeasurementAlarm");

            migrationBuilder.DropTable(
                name: "tankstock");

            migrationBuilder.DropTable(
                name: "tanktransfer");

            migrationBuilder.DropTable(
                name: "tankvolumeadjustmentaudit");

            migrationBuilder.DropTable(
                name: "tasks");

            migrationBuilder.DropTable(
                name: "user_activity");

            migrationBuilder.DropTable(
                name: "user_dashboard_layout");

            migrationBuilder.DropTable(
                name: "user_notification_preference");

            migrationBuilder.DropTable(
                name: "UserClaims");

            migrationBuilder.DropTable(
                name: "UserLogins");

            migrationBuilder.DropTable(
                name: "userroles");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "usersite");

            migrationBuilder.DropTable(
                name: "UserTokens");

            migrationBuilder.DropTable(
                name: "vehicle_documents");

            migrationBuilder.DropTable(
                name: "vehicle_health_monitor");

            migrationBuilder.DropTable(
                name: "vehicle_provider_mappings");

            migrationBuilder.DropTable(
                name: "vehicleconsumption");

            migrationBuilder.DropTable(
                name: "dashboard_widget_template");

            migrationBuilder.DropTable(
                name: "supplier");

            migrationBuilder.DropTable(
                name: "pumptransaction");

            migrationBuilder.DropTable(
                name: "VehicleMaintenances");

            migrationBuilder.DropTable(
                name: "notification_group");

            migrationBuilder.DropTable(
                name: "notification");

            migrationBuilder.DropTable(
                name: "navigationitems");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "tankmeasurement");

            migrationBuilder.DropTable(
                name: "tankvolumehistory");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "provider_configurations");

            migrationBuilder.DropTable(
                name: "MaintenanceSchedules");

            migrationBuilder.DropTable(
                name: "issuetracker");

            migrationBuilder.DropTable(
                name: "issuestatus");

            migrationBuilder.DropTable(
                name: "activealarms");

            migrationBuilder.DropTable(
                name: "alarm_handler");

            migrationBuilder.DropTable(
                name: "PTSAlertRecord");

            migrationBuilder.DropTable(
                name: "reconciliationdiscrepancy");

            migrationBuilder.DropTable(
                name: "notification_policy");

            migrationBuilder.DropTable(
                name: "alarm");

            migrationBuilder.DropTable(
                name: "reconciliationpolicyexecution");

            migrationBuilder.DropTable(
                name: "tank");

            migrationBuilder.DropTable(
                name: "notificationcategories");

            migrationBuilder.DropTable(
                name: "issuecategory");

            migrationBuilder.DropTable(
                name: "issuepriority");

            migrationBuilder.DropTable(
                name: "reconciliationpolicy");

            migrationBuilder.DropTable(
                name: "ptsdevice");

            migrationBuilder.DropTable(
                name: "site");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropTable(
                name: "tag");

            migrationBuilder.DropTable(
                name: "fuelingruleset");

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
                name: "expectedaverageclassification");

            migrationBuilder.DropTable(
                name: "vehiclemanufacturer");
        }
    }
}
