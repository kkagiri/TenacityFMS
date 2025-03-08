using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DebugMod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                name: "Alertrecords",
                columns: table => new
                {
                    AlertId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DateTime = table.Column<DateTime>(type: "datetime", nullable: false),
                    DeviceType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeviceNumber = table.Column<int>(type: "int", nullable: false),
                    State = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Code = table.Column<int>(type: "int", nullable: false),
                    ConfigurationId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ptsid = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PacketId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alertrecords", x => x.AlertId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Assets",
                columns: table => new
                {
                    AssetId = table.Column<string>(type: "varchar(95)", nullable: false)
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
                name: "devicemanufacturer",
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
                name: "devicetype",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false),
                    Name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                    CreatedDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    ApprovedDate = table.Column<DateTime>(type: "datetime", nullable: true),
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
                name: "site",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                },
                comment: "			")
                .Annotation("MySql:CharSet", "utf8mb4");

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
                name: "tankmeasurement",
                columns: table => new
                {
                    id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DateTime = table.Column<DateTime>(type: "datetime", nullable: false),
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
                    Tank = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
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
                    LoginProvider = table.Column<string>(type: "varchar(95)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProviderKey = table.Column<string>(type: "varchar(95)", nullable: false)
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
                    UserId = table.Column<string>(type: "varchar(95)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RoleId = table.Column<string>(type: "varchar(95)", nullable: false)
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
                    UserId = table.Column<string>(type: "varchar(95)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LoginProvider = table.Column<string>(type: "varchar(95)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Name = table.Column<string>(type: "varchar(95)", nullable: false)
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
                name: "devicemodel",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    name = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DevicemanufacturerID = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                    table.ForeignKey(
                        name: "deviceModel_deviceManufaturer",
                        column: x => x.DevicemanufacturerID,
                        principalTable: "devicemanufacturer",
                        principalColumn: "ID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Devices",
                columns: table => new
                {
                    DeviceImei = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DeviceMakerId = table.Column<int>(type: "int", nullable: false),
                    DevicePhoneNumber = table.Column<int>(type: "int", nullable: false),
                    DeviceType = table.Column<int>(type: "int", nullable: false),
                    DeviceTypeNavigationId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Devices", x => x.DeviceImei);
                    table.ForeignKey(
                        name: "FK_Devices_devicetype_DeviceTypeNavigationId",
                        column: x => x.DeviceTypeNavigationId,
                        principalTable: "devicetype",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Discriminator = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FuelingRuleSetId = table.Column<int>(type: "int(11)", nullable: false)
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
                name: "permissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParentId = table.Column<int>(type: "int(11)", nullable: true),
                    RoleId = table.Column<string>(type: "varchar(100)", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Permissions_Parent",
                        column: x => x.ParentId,
                        principalTable: "permissions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_permissions_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "rolenavigations",
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
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RoleNavigations_Roles",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                    LastActivity = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PTSId);
                    table.ForeignKey(
                        name: "PTSDevice_site",
                        column: x => x.Site,
                        principalTable: "site",
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsDeleted = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    RoleId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SiteId = table.Column<int>(type: "int(11)", nullable: true),
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
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_user_site_SiteId",
                        column: x => x.SiteId,
                        principalTable: "site",
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "alarm_tankmeasurement",
                columns: table => new
                {
                    tankMeasurementID = table.Column<int>(type: "int(11)", nullable: false),
                    alarmID = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => new { x.tankMeasurementID, x.alarmID })
                        .Annotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                    table.ForeignKey(
                        name: "alarmMeasurement_tankmeasurement",
                        column: x => x.tankMeasurementID,
                        principalTable: "tankmeasurement",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "alarmmeasurement_alarm",
                        column: x => x.alarmID,
                        principalTable: "alarm",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                name: "rolepermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RoleId = table.Column<string>(type: "varchar(100)", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PermissionId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rolepermissions", x => x.Id);
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
                name: "Configurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ConfigurationId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Configuration1 = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PacketId = table.Column<int>(type: "int", nullable: false),
                    Ptsid = table.Column<string>(type: "varchar(100)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Configurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Configurations_ptsdevice_Ptsid",
                        column: x => x.Ptsid,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DeviceConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IpAddress = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConnectedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    DisconnectedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    LastActivityAt = table.Column<DateTime>(type: "datetime", nullable: false),
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
                    table.ForeignKey(
                        name: "FK_DeviceConnections_ptsdevice_PtsdeviceId",
                        column: x => x.PtsdeviceId,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId");
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
                    table.ForeignKey(
                        name: "fk_psTID",
                        column: x => x.PTSId,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId");
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
                    DateTimeStart = table.Column<DateTime>(type: "datetime", nullable: true),
                    DateTime = table.Column<DateTime>(type: "datetime", nullable: false),
                    Pump = table.Column<int>(type: "int(11)", nullable: true),
                    Nozzle = table.Column<int>(type: "int(11)", nullable: true),
                    FuelGradeId = table.Column<int>(type: "int(11)", nullable: true),
                    FuelGradeName = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Transaction = table.Column<int>(type: "int(11)", nullable: true),
                    Volume = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TCVolume = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TotalVolume = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    Tag = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserId = table.Column<int>(type: "int(11)", nullable: true),
                    ConfigurationId = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
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
                name: "tank",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TankVolume = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    TankHeight = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    PtsId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UseBookKeeping = table.Column<sbyte>(type: "tinyint", nullable: true),
                    SiteId = table.Column<int>(type: "int(11)", nullable: false),
                    DiscrepancyThreshold = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    TankLength = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    CurrentStock = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    LastStockUpdate = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tank_ptsdevice_PtsId",
                        column: x => x.PtsId,
                        principalTable: "ptsdevice",
                        principalColumn: "PTSId");
                    table.ForeignKey(
                        name: "Tank_site",
                        column: x => x.SiteId,
                        principalTable: "site",
                        principalColumn: "id");
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
                    DateCreated = table.Column<DateTime>(type: "datetime", nullable: true),
                    DateModified = table.Column<DateTime>(type: "datetime", nullable: true),
                    CreatedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModifiedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsModified = table.Column<sbyte>(type: "tinyint(4)", nullable: true, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                    table.ForeignKey(
                        name: "FK_employee_site_SiteID",
                        column: x => x.SiteID,
                        principalTable: "site",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_employee_user_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_employee_user_ModifiedBy",
                        column: x => x.ModifiedBy,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                    Timestamp = table.Column<DateTime>(type: "datetime", nullable: false),
                    IpAddress = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsSuccessful = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoginActivities_Users",
                        column: x => x.UserId,
                        principalTable: "user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

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
                    IpAddress = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Timestamp = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserActivity_User",
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
                name: "Dailytankreconciliations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankId = table.Column<int>(type: "int", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false),
                    ReconciliationDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    OpeningLevel = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    ClosingLevel = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    TotalRefills = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    TotalDeliveries = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    TotalTransfersIn = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    TotalTransfersOut = table.Column<decimal>(type: "decimal(65,30)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dailytankreconciliations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Dailytankreconciliations_tank_TankId",
                        column: x => x.TankId,
                        principalTable: "tank",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Deliveries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankId = table.Column<int>(type: "int", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false),
                    DeliveryDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    ManualDeliveryAmount = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    SensorDeliveryAmount = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    DeliveryTemperature = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    DeliveryDensity = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    DeliveryMass = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    StockBeforeDelivery = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    StockAfterDelivery = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    RecordedBy = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SupplierId = table.Column<int>(type: "int(11)", nullable: false),
                    Lponumber = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Product = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecordedByNavigationId = table.Column<string>(type: "varchar(100)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Deliveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Deliveries_supplier_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "supplier",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Deliveries_tank_TankId",
                        column: x => x.TankId,
                        principalTable: "tank",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Deliveries_user_RecordedByNavigationId",
                        column: x => x.RecordedByNavigationId,
                        principalTable: "user",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tankstock",
                columns: table => new
                {
                    EntryID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankID = table.Column<int>(type: "int(11)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false),
                    EntryDate = table.Column<DateTime>(type: "datetime", nullable: false),
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
                    Amount = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    TransferDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    RecordedBy = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TankTransfer_DestinationTank",
                        column: x => x.DestinationTankId,
                        principalTable: "tank",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TankTransfer_SourceTank",
                        column: x => x.SourceTankId,
                        principalTable: "tank",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TankTransfer_User",
                        column: x => x.RecordedBy,
                        principalTable: "user",
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
                    RecordedBy = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReferenceId = table.Column<int>(type: "int(11)", nullable: true),
                    ReferenceType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedOn = table.Column<DateTime>(type: "datetime", nullable: false)
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "calibrationdata",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    VehicleID = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    calibrationDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    CalibrationData = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                name: "employeevehicles",
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
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "latin1");

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
                    table.ForeignKey(
                        name: "Expected_site",
                        column: x => x.SiteID,
                        principalTable: "site",
                        principalColumn: "id");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

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
                    DeviceID = table.Column<int>(type: "int(11)", nullable: true),
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
                    GPSGATEGeneratedID = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    DefaultExptdAVGId = table.Column<int>(type: "int(11)", nullable: true),
                    ModifiedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.vehicleID);
                    table.UniqueConstraint("AK_vehicle_HyoungNo", x => x.HyoungNo);
                    table.ForeignKey(
                        name: "Vehicle_Device",
                        column: x => x.DeviceID,
                        principalTable: "Devices",
                        principalColumn: "DeviceImei");
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
                    dueDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    openDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    closingDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    LastModfield = table.Column<DateTime>(type: "datetime", nullable: true),
                    VehicleID = table.Column<int>(type: "int(11)", nullable: false),
                    DeviceID = table.Column<int>(type: "int(11)", nullable: true),
                    DeviceType = table.Column<int>(type: "int(11)", nullable: true),
                    AssignTo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
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
                        name: "Issue_user",
                        column: x => x.AssignTo,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "Issuetracker_status",
                        column: x => x.status,
                        principalTable: "issuestatus",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "Isuse_deviceType",
                        column: x => x.DeviceType,
                        principalTable: "devicetype",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "issue_ser",
                        column: x => x.openby,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "issue_vehicle",
                        column: x => x.VehicleID,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID");
                    table.ForeignKey(
                        name: "issuetracker_site",
                        column: x => x.siteID,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "issuetrcker_issuecategoryID",
                        column: x => x.IssueCategoryID,
                        principalTable: "issuecategory",
                        principalColumn: "ID");
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
                    VehicleId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id);
                    table.ForeignKey(
                        name: "FuelRuleSetId_FK",
                        column: x => x.FuelRuleSetId,
                        principalTable: "fuelingruleset",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "TAG_Vehicle",
                        column: x => x.VehicleId,
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
                    Date = table.Column<DateTime>(type: "datetime", nullable: false),
                    MaxSpeed = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    AvgSpeed = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ExpectedConsumption = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    TotalDistance = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    EmployeeID = table.Column<int>(type: "int(11)", nullable: true, defaultValueSql: "'0'"),
                    Comments = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FuelLost = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    FuelEfficiency = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    TotalFuel = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    FlowMeterFuelUsed = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    FlowMeterFuelLost = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    FlowMeterEffiency = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    EngHours = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    FlowMeterEngineHrs = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    ExcessWorkingHrsCost = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    IsNightShift = table.Column<ulong>(type: "bit(1)", nullable: false, defaultValueSql: "b'0'"),
                    IsKmperhr = table.Column<ulong>(type: "bit(1)", nullable: false, defaultValueSql: "b'0'"),
                    ModifiedBy = table.Column<int>(type: "int(11)", nullable: true),
                    ModifiedDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    IsModified = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    ReportId = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                    table.ForeignKey(
                        name: "vehicleconsumption_employee",
                        column: x => x.EmployeeID,
                        principalTable: "employee",
                        principalColumn: "id");
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
                name: "issueassignmenttracker",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false),
                    AssignedFrom = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignedTo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignedDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    Issue = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ID);
                    table.ForeignKey(
                        name: "Assigned_Issue_To",
                        column: x => x.AssignedTo,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "Assigned_issue",
                        column: x => x.Issue,
                        principalTable: "issuetracker",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "assigned_user_From",
                        column: x => x.AssignedFrom,
                        principalTable: "user",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "fuelrefil",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TankID = table.Column<int>(type: "int(11)", nullable: false),
                    vehicleID = table.Column<int>(type: "int(11)", nullable: false),
                    ManualFuelrefilAmount = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    Date = table.Column<DateTime>(type: "datetime", nullable: true),
                    PreviousMeterReading = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    CurrentMeterReading = table.Column<decimal>(type: "decimal(10)", precision: 10, nullable: true),
                    SiteID = table.Column<int>(type: "int(11)", nullable: false),
                    Comment = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FuelBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PumpTranscationID = table.Column<int>(type: "int(11)", nullable: true),
                    DriverID = table.Column<int>(type: "int(11)", nullable: true),
                    TagId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateCreated = table.Column<DateTime>(type: "datetime", nullable: false),
                    DateModified = table.Column<DateTime>(type: "datetime", nullable: true),
                    IsModified = table.Column<sbyte>(type: "tinyint(4)", nullable: true, defaultValueSql: "'0'"),
                    TagNavigationId = table.Column<int>(type: "int(11)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => new { x.ID, x.TankID })
                        .Annotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                    table.ForeignKey(
                        name: "FK_fuelrefil_tag_TagNavigationId",
                        column: x => x.TagNavigationId,
                        principalTable: "tag",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FuelRefi_Fuelby",
                        column: x => x.FuelBy,
                        principalTable: "user",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FuelRefil_Driver",
                        column: x => x.DriverID,
                        principalTable: "employee",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FuelRefil_PumpTransaction",
                        column: x => x.PumpTranscationID,
                        principalTable: "pumptransaction",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FuelRefill_tank",
                        column: x => x.TankID,
                        principalTable: "tank",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "fuelRefil_Site",
                        column: x => x.SiteID,
                        principalTable: "site",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fuelRefil_vehicle",
                        column: x => x.vehicleID,
                        principalTable: "vehicle",
                        principalColumn: "vehicleID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "alarmmeasurement_alarm_idx",
                table: "alarm_tankmeasurement",
                column: "alarmID");

            migrationBuilder.CreateIndex(
                name: "alarmMeasurement_tankmeasurement_idx",
                table: "alarm_tankmeasurement",
                column: "tankMeasurementID");

            migrationBuilder.CreateIndex(
                name: "calibrationDataRow_idx",
                table: "calibrationdata",
                column: "VehicleID");

            migrationBuilder.CreateIndex(
                name: "IX_Configurations_Ptsid",
                table: "Configurations",
                column: "Ptsid");

            migrationBuilder.CreateIndex(
                name: "IX_Dailytankreconciliations_TankId",
                table: "Dailytankreconciliations",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_RecordedByNavigationId",
                table: "Deliveries",
                column: "RecordedByNavigationId");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_SupplierId",
                table: "Deliveries",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_TankId",
                table: "Deliveries",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceConnections_PtsdeviceId",
                table: "DeviceConnections",
                column: "PtsdeviceId");

            migrationBuilder.CreateIndex(
                name: "deviceModel_deviceManufaturer_idx",
                table: "devicemodel",
                column: "DevicemanufacturerID");

            migrationBuilder.CreateIndex(
                name: "IX_Devices_DeviceTypeNavigationId",
                table: "Devices",
                column: "DeviceTypeNavigationId");

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
                name: "IX_EmployeeVehicle_VehiclesVehicleId",
                table: "EmployeeVehicle",
                column: "VehiclesVehicleId");

            migrationBuilder.CreateIndex(
                name: "EmployeeID_idx",
                table: "employeevehicles",
                column: "EmployeeID",
                unique: true);

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
                name: "FuelRefil_Driver_idx",
                table: "fuelrefil",
                column: "DriverID");

            migrationBuilder.CreateIndex(
                name: "FuelRefil_PumpTransaction_idx",
                table: "fuelrefil",
                column: "PumpTranscationID");

            migrationBuilder.CreateIndex(
                name: "FuelRefil_site_idx",
                table: "fuelrefil",
                column: "SiteID");

            migrationBuilder.CreateIndex(
                name: "FuelRefil_User_idx",
                table: "fuelrefil",
                column: "FuelBy");

            migrationBuilder.CreateIndex(
                name: "fuelRefil_vehilce_idx",
                table: "fuelrefil",
                column: "vehicleID");

            migrationBuilder.CreateIndex(
                name: "FuelRefill_tank_idx",
                table: "fuelrefil",
                column: "TankID");

            migrationBuilder.CreateIndex(
                name: "IX_fuelrefil_TagNavigationId",
                table: "fuelrefil",
                column: "TagNavigationId");

            migrationBuilder.CreateIndex(
                name: "fuelregenrate_user_idx",
                table: "fuelreportgenerate",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "fuelregenrate_user_idx1",
                table: "fuelreportgenerate",
                column: "CreatedBy");

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
                name: "FK_Permissions_Parent",
                table: "permissions",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_permissions_RoleId",
                table: "permissions",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "Name_UNIQUE",
                table: "permissions",
                column: "Name",
                unique: true);

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
                name: "IX_rolenavigations_navigationItemId",
                table: "rolenavigations",
                column: "navigationItemId");

            migrationBuilder.CreateIndex(
                name: "IX_rolenavigations_RoleId",
                table: "rolenavigations",
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
                name: "FuelRuleSetId_FK_idx",
                table: "tag",
                column: "FuelRuleSetId");

            migrationBuilder.CreateIndex(
                name: "TAG_Vehicle_idx",
                table: "tag",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_tank_PtsId",
                table: "tank",
                column: "PtsId");

            migrationBuilder.CreateIndex(
                name: "IX_tank_SiteId",
                table: "tank",
                column: "SiteId");

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
                name: "FK_TankTransfer_DestinationTank_idx",
                table: "tanktransfer",
                column: "DestinationTankId");

            migrationBuilder.CreateIndex(
                name: "FK_TankTransfer_SourceTank_idx",
                table: "tanktransfer",
                column: "SourceTankId");

            migrationBuilder.CreateIndex(
                name: "FK_TankTransfer_User_idx",
                table: "tanktransfer",
                column: "RecordedBy");

            migrationBuilder.CreateIndex(
                name: "FK_TankVolumeHistory_Tank_idx",
                table: "tankvolumehistory",
                column: "TankId");

            migrationBuilder.CreateIndex(
                name: "FK_TankVolumeHistory_User_idx",
                table: "tankvolumehistory",
                column: "RecordedBy");

            migrationBuilder.CreateIndex(
                name: "IX_user_RoleId",
                table: "user",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_user_SiteId",
                table: "user",
                column: "SiteId");

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
                name: "Vehicle_Device_idx",
                table: "vehicle",
                column: "DeviceID");

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
                name: "vehicle_vehicleType_idx",
                table: "vehicle",
                column: "VehicleTypeID");

            migrationBuilder.CreateIndex(
                name: "vehilce_user_idx",
                table: "vehicle",
                column: "ModifiedBy");

            migrationBuilder.CreateIndex(
                name: "vehicle_date_shift_unique",
                table: "vehicleconsumption",
                columns: new[] { "VehicleID", "Date", "IsNightShift" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "vehicleconsumption_employee_idx",
                table: "vehicleconsumption",
                column: "EmployeeID");

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
                name: "IX_vehiclemodel_ManufacturerID",
                table: "vehiclemodel",
                column: "ManufacturerID");

            migrationBuilder.AddForeignKey(
                name: "calibrationData_vehicle",
                table: "calibrationdata",
                column: "VehicleID",
                principalTable: "vehicle",
                principalColumn: "HyoungNo");

            migrationBuilder.AddForeignKey(
                name: "FK_EmployeeVehicle_vehicle_VehiclesVehicleId",
                table: "EmployeeVehicle",
                column: "VehiclesVehicleId",
                principalTable: "vehicle",
                principalColumn: "vehicleID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "VehicleID",
                table: "employeevehicles",
                column: "VehicleID",
                principalTable: "vehicle",
                principalColumn: "vehicleID");

            migrationBuilder.AddForeignKey(
                name: "Expected_vehicle",
                table: "expectedaverage",
                column: "VehicleID",
                principalTable: "vehicle",
                principalColumn: "vehicleID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "Expected_vehicle",
                table: "expectedaverage");

            migrationBuilder.DropTable(
                name: "alarm_tankmeasurement");

            migrationBuilder.DropTable(
                name: "Alertrecords");

            migrationBuilder.DropTable(
                name: "Assets");

            migrationBuilder.DropTable(
                name: "calibrationdata");

            migrationBuilder.DropTable(
                name: "Configurations");

            migrationBuilder.DropTable(
                name: "Dailytankreconciliations");

            migrationBuilder.DropTable(
                name: "Deliveries");

            migrationBuilder.DropTable(
                name: "DeviceConnections");

            migrationBuilder.DropTable(
                name: "devicemodel");

            migrationBuilder.DropTable(
                name: "EmployeeVehicle");

            migrationBuilder.DropTable(
                name: "employeevehicles");

            migrationBuilder.DropTable(
                name: "fuelingrule");

            migrationBuilder.DropTable(
                name: "fuelrefil");

            migrationBuilder.DropTable(
                name: "fuelreportgenerate");

            migrationBuilder.DropTable(
                name: "intankdelivery");

            migrationBuilder.DropTable(
                name: "issueassignmenttracker");

            migrationBuilder.DropTable(
                name: "loginactivities");

            migrationBuilder.DropTable(
                name: "ptsdevice_pendingcommands");

            migrationBuilder.DropTable(
                name: "reportitem");

            migrationBuilder.DropTable(
                name: "RoleClaims");

            migrationBuilder.DropTable(
                name: "rolenavigations");

            migrationBuilder.DropTable(
                name: "rolepermissions");

            migrationBuilder.DropTable(
                name: "tankstock");

            migrationBuilder.DropTable(
                name: "tanktransfer");

            migrationBuilder.DropTable(
                name: "tankvolumehistory");

            migrationBuilder.DropTable(
                name: "user_activity");

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
                name: "vehicleconsumption");

            migrationBuilder.DropTable(
                name: "tankmeasurement");

            migrationBuilder.DropTable(
                name: "alarm");

            migrationBuilder.DropTable(
                name: "supplier");

            migrationBuilder.DropTable(
                name: "devicemanufacturer");

            migrationBuilder.DropTable(
                name: "tag");

            migrationBuilder.DropTable(
                name: "pumptransaction");

            migrationBuilder.DropTable(
                name: "issuetracker");

            migrationBuilder.DropTable(
                name: "navigationitems");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "tank");

            migrationBuilder.DropTable(
                name: "fuelingruleset");

            migrationBuilder.DropTable(
                name: "issuepriority");

            migrationBuilder.DropTable(
                name: "issuestatus");

            migrationBuilder.DropTable(
                name: "issuecategory");

            migrationBuilder.DropTable(
                name: "ptsdevice");

            migrationBuilder.DropTable(
                name: "vehicle");

            migrationBuilder.DropTable(
                name: "Devices");

            migrationBuilder.DropTable(
                name: "employee");

            migrationBuilder.DropTable(
                name: "expectedaverage");

            migrationBuilder.DropTable(
                name: "vehiclemodel");

            migrationBuilder.DropTable(
                name: "vehicletype");

            migrationBuilder.DropTable(
                name: "devicetype");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropTable(
                name: "expectedaverageclassification");

            migrationBuilder.DropTable(
                name: "vehiclemanufacturer");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "site");
        }
    }
}
