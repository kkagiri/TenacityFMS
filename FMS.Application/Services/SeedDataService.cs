// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading.Tasks;
// using FMS.Domain.Entities;
// using FMS.Domain.Entities.Auth;
// using FMS.Persistence.DataAccess;
// using Microsoft.AspNetCore.Identity;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Services
// {
//     public class SeedDataService : ISeedDataService
//     {
//         private readonly GpsdataContext _context;
//         private readonly UserManager<User> _userManager;
//         private readonly RoleManager<Role> _roleManager;
//         private readonly ILogger<SeedDataService> _logger;

//         public SeedDataService(
//             GpsdataContext context,
//             UserManager<User> userManager,
//             RoleManager<Role> roleManager,
//             ILogger<SeedDataService> logger)
//         {
//             _context = context;
//             _userManager = userManager;
//             _roleManager = roleManager;
//             _logger = logger;
//         }

//         public async Task<bool> HasInitialDataBeenSeededAsync()
//         {
//             return await _context.SeedingHistories
//                 .AnyAsync(sh => sh.SeedType == "InitialSetup");
//         }

//         public async Task<bool> SeedInitialDataAsync()
//         {
//             try
//             {
//                 // Check if already seeded
//                 if (await HasInitialDataBeenSeededAsync())
//                 {
//                     _logger.LogInformation("Initial data has already been seeded");
//                     return true;
//                 }

//                 _logger.LogInformation("Starting initial data seeding...");

//                 // Start transaction
//                 using var transaction = await _context.Database.BeginTransactionAsync();

//                 try
//                 {
//                     // 1. Seed Roles
//                     await SeedRolesAsync();

//                     // 2. Seed Permissions
//                     await SeedPermissionsAsync();

//                     // 3. Seed Navigation Items
//                     await SeedNavigationItemsAsync();

//                     // 4. Seed Users
//                     await SeedUsersAsync();

//                     // 5. Seed Role Permissions
//                     await SeedRolePermissionsAsync();

//                     // 6. Seed Role Navigations
//                     await SeedRoleNavigationsAsync();

//                     // 7. Record seeding history
//                     await RecordSeedingHistoryAsync();

//                     // Commit transaction
//                     await transaction.CommitAsync();

//                     _logger.LogInformation("Initial data seeding completed successfully");
//                     return true;
//                 }
//                 catch (Exception ex)
//                 {
//                     await transaction.RollbackAsync();
//                     _logger.LogError(ex, "Error during initial data seeding");
//                     throw;
//                 }
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Failed to seed initial data");
//                 return false;
//             }
//         }

//         private async Task SeedRolesAsync()
//         {
//             _logger.LogInformation("Seeding roles...");

//             var roles = new[]
//             {
//                 new { Name = "Admin", Description = "Has all access" },
//                 new { Name = "PowerUser", Description = "users that can perform powerful actions" },
//                 new { Name = "User", Description = "User that perform basic day to day operations" },
//                 new { Name = "Reader", Description = "Users can only read certain data" },
//                 new { Name = "Analyst", Description = "User that have access to dashboard" },
//                 new { Name = "Guest", Description = "Guest Accounts" }
//             };

//             foreach (var roleData in roles)
//             {
//                 var role = new Role
//                 {
//                     Name = roleData.Name,
//                     NormalizedName = roleData.Name.ToUpper(),
//                     Description = roleData.Description
//                 };

//                 if (!await _roleManager.RoleExistsAsync(role.Name))
//                 {
//                     await _roleManager.CreateAsync(role);
//                     _logger.LogInformation($"Created role: {role.Name}");
//                 }
//             }
//         }

//         private async Task SeedPermissionsAsync()
//         {
//             _logger.LogInformation("Seeding permissions...");

//             var permissions = new List<Permission>
//             {
//                 // Dashboard
//                 new Permission { Name = "Dashboard.View" },

//                 // Vehicles
//                 new Permission { Name = "Vehicles.View" },
//                 new Permission { Name = "Vehicles.Create" },
//                 new Permission { Name = "Vehicles.Edit" },
//                 new Permission { Name = "Vehicles.Delete" },

//                 // Automatic Fueling
//                 new Permission { Name = "AutomaticFueling.View" },
//                 new Permission { Name = "AutomaticFueling.Configure" },

//                 // Employees
//                 new Permission { Name = "Employees.View" },
//                 new Permission { Name = "Employees.Create" },
//                 new Permission { Name = "Employees.Edit" },
//                 new Permission { Name = "Employees.Delete" },

//                 // Device Issues
//                 new Permission { Name = "DeviceIssues.View" },
//                 new Permission { Name = "DeviceIssues.Manage" },

//                 // Consumption
//                 new Permission { Name = "Consumption.View" },
//                 new Permission { Name = "Consumption.Analyze" },

//                 // Manual Refill
//                 new Permission { Name = "ManualRefill.View" },
//                 new Permission { Name = "ManualRefill.Create" },
//                 new Permission { Name = "ManualRefill.Edit" },

//                 // Analysis
//                 new Permission { Name = "Analysis.View" },
//                 new Permission { Name = "Analysis.Generate" },

//                 // Reports
//                 new Permission { Name = "Reports.View" },
//                 new Permission { Name = "Reports.Generate" },
//                 new Permission { Name = "Reports.Import" },

//                 // Tank Stock
//                 new Permission { Name = "TankStock.View" },
//                 new Permission { Name = "TankStock.Edit" },

//                 // Tags
//                 new Permission { Name = "Tags.View" },
//                 new Permission { Name = "Tags.Create" },
//                 new Permission { Name = "Tags.Edit" },
//                 new Permission { Name = "Tags.Delete" },

//                 // Roles
//                 new Permission { Name = "Roles.View" },
//                 new Permission { Name = "Roles.Create" },
//                 new Permission { Name = "Roles.Edit" },
//                 new Permission { Name = "Roles.Delete" },

//                 // Navigations
//                 new Permission { Name = "Navigations.View" },
//                 new Permission { Name = "Navigations.Create" },
//                 new Permission { Name = "Navigations.Edit" },
//                 new Permission { Name = "Navigations.Delete" },

//                 // Users
//                 new Permission { Name = "Users.View" },
//                 new Permission { Name = "Users.Create" },
//                 new Permission { Name = "Users.Edit" },
//                 new Permission { Name = "Users.Delete" },

//                 // Permissions
//                 new Permission { Name = "Permissions.View" },
//                 new Permission { Name = "Permissions.Create" },
//                 new Permission { Name = "Permissions.Edit" },
//                 new Permission { Name = "Permissions.Delete" },

//                 // PTS Device
//                 new Permission { Name = "PTSDevice.View" },
//                 new Permission { Name = "PTSDevice.Create" },
//                 new Permission { Name = "PTSDevice.Edit" },
//                 new Permission { Name = "PTSDevice.Delete" },

//                 // Administration
//                 new Permission { Name = "Admin.Access" }
//             };

//             foreach (var permission in permissions)
//             {
//                 if (!await _context.Permissions.AnyAsync(p => p.Name == permission.Name))
//                 {
//                     _context.Permissions.Add(permission);
//                     _logger.LogInformation($"Created permission: {permission.Name}");
//                 }
//             }

//             await _context.SaveChangesAsync();
//         }

//         private async Task SeedNavigationItemsAsync()
//         {
//             _logger.LogInformation("Seeding navigation items...");

//             // First, seed the main navigation items
//             var mainNavigationItems = new List<Navigationitem>
//             {
//                 new Navigationitem { Page = "Dashboard", Link = "/home", Icon = "home", ParentId = null },
//                 new Navigationitem { Page = "Vehicles", Link = "/vehicles", Icon = "fa-light fa-cars", ParentId = null },
//                 new Navigationitem { Page = "Automatic Fueling", Link = "/ATG", Icon = "fa-light fa-plug", ParentId = null },
//                 new Navigationitem { Page = "Employees", Link = "/Employees", Icon = "fa-light fa-users", ParentId = null },
//                 new Navigationitem { Page = "Device Issues", Link = "/Issues", Icon = "fa-light fa-microchip", ParentId = null },
//                 new Navigationitem { Page = "Consumption", Link = "/Consumption", Icon = "fa-light fa-ranking-star", ParentId = null },
//                 new Navigationitem { Page = "Manual Refill", Link = "/ManualRefill", Icon = "fa-light fa-gas-pump", ParentId = null },
//                 new Navigationitem { Page = "Analysis", Link = "/Analysis", Icon = "fa-light fa-chart-network", ParentId = null },
//                 new Navigationitem { Page = "reports", Link = "/reports", Icon = "fa-light fa-folder", ParentId = null },
//                 new Navigationitem { Page = "Tank Stock", Link = "/TankStock", Icon = "fa-light fa-vials", ParentId = null },
//                 new Navigationitem { Page = "Admin", Link = "", Icon = "fa-light fa-gears", ParentId = 0 }
//             };

//             // Save main items first
//             foreach (var item in mainNavigationItems)
//             {
//                 if (!await _context.Navigationitems.AnyAsync(n => n.Page == item.Page))
//                 {
//                     _context.Navigationitems.Add(item);
//                 }
//             }
//             await _context.SaveChangesAsync();

//             // Get the Admin parent ID and Reports parent ID
//             var adminParent = await _context.Navigationitems.FirstOrDefaultAsync(n => n.Page == "Admin");
//             var reportsParent = await _context.Navigationitems.FirstOrDefaultAsync(n => n.Page == "reports");

//             // Add admin sub-items
//             var adminSubItems = new List<Navigationitem>
//             {
//                 new Navigationitem { Page = "Tags", Link = "/admin/tags", Icon = "fa-light fa-barcode", ParentId = adminParent?.Id },
//                 new Navigationitem { Page = "Roles", Link = "/admin/roles", Icon = "fa-light fa-briefcase", ParentId = adminParent?.Id },
//                 new Navigationitem { Page = "Navigations", Link = "/admin/navigations", Icon = "fa-light fa-link", ParentId = adminParent?.Id },
//                 new Navigationitem { Page = "Users", Link = "/admin/users", Icon = "fa-light fa-user", ParentId = adminParent?.Id },
//                 new Navigationitem { Page = "Permissions", Link = "/admin/permission", Icon = "fa-light fa-key", ParentId = adminParent?.Id },
//                 new Navigationitem { Page = "ptsdevice", Link = "/admin/ptsdevice", Icon = "fa-light fa-meter", ParentId = adminParent?.Id }
//             };

//             // Add reports sub-items
//             var reportsSubItems = new List<Navigationitem>
//             {
//                 new Navigationitem { Page = "Fuel Report Importer", Link = "/report/FuelReportImporter", Icon = "fa-light fa-upload", ParentId = reportsParent?.Id }
//             };

//             foreach (var item in adminSubItems.Concat(reportsSubItems))
//             {
//                 if (!await _context.Navigationitems.AnyAsync(n => n.Page == item.Page && n.ParentId == item.ParentId))
//                 {
//                     _context.Navigationitems.Add(item);
//                 }
//             }

//             await _context.SaveChangesAsync();
//             _logger.LogInformation("Navigation items seeded successfully");
//         }

//         private async Task SeedUsersAsync()
//         {
//             _logger.LogInformation("Seeding users...");

//             var users = new[]
//             {
//                 new { Email = "admin@fms.com", UserName = "admin", RoleName = "Admin" },
//                 new { Email = "poweruser@fms.com", UserName = "poweruser", RoleName = "PowerUser" },
//                 new { Email = "user@fms.com", UserName = "user", RoleName = "User" },
//                 new { Email = "reader@fms.com", UserName = "reader", RoleName = "Reader" },
//                 new { Email = "analyst@fms.com", UserName = "analyst", RoleName = "Analyst" },
//                 new { Email = "guest@fms.com", UserName = "guest", RoleName = "Guest" }
//             };

//             foreach (var userData in users)
//             {
//                 var existingUser = await _userManager.FindByEmailAsync(userData.Email);
//                 if (existingUser == null)
//                 {
//                     var user = new User
//                     {
//                         Email = userData.Email,
//                         UserName = userData.UserName,
//                         NormalizedEmail = userData.Email.ToUpper(),
//                         NormalizedUserName = userData.UserName.ToUpper(),
//                         EmailConfirmed = true,
//                         IsDeleted = false
//                     };

//                     var result = await _userManager.CreateAsync(user, "Admin@123");
//                     if (result.Succeeded)
//                     {
//                         await _userManager.AddToRoleAsync(user, userData.RoleName);
//                         _logger.LogInformation($"Created user: {user.UserName} with role: {userData.RoleName}");
//                     }
//                     else
//                     {
//                         _logger.LogError($"Failed to create user {userData.UserName}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
//                     }
//                 }
//             }
//         }

//         private async Task SeedRolePermissionsAsync()
//         {
//             _logger.LogInformation("Seeding role permissions...");

//             var adminRole = await _roleManager.FindByNameAsync("Admin");
//             var powerUserRole = await _roleManager.FindByNameAsync("PowerUser");
//             var userRole = await _roleManager.FindByNameAsync("User");
//             var readerRole = await _roleManager.FindByNameAsync("Reader");
//             var analystRole = await _roleManager.FindByNameAsync("Analyst");
//             var guestRole = await _roleManager.FindByNameAsync("Guest");

//             var allPermissions = await _context.Permissions.ToListAsync();

//             // Admin gets all permissions
//             foreach (var permission in allPermissions)
//             {
//                 if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == permission.Id))
//                 {
//                     _context.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = permission.Id });
//                 }
//             }

//             // PowerUser gets most permissions except admin-specific ones
//             var powerUserPermissions = allPermissions.Where(p =>
//                 !p.Name.StartsWith("Users.") &&
//                 !p.Name.StartsWith("Roles.") &&
//                 !p.Name.StartsWith("Permissions.") &&
//                 !p.Name.StartsWith("Navigations.")).ToList();
//             foreach (var permission in powerUserPermissions)
//             {
//                 if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == powerUserRole.Id && rp.PermissionId == permission.Id))
//                 {
//                     _context.RolePermissions.Add(new RolePermission { RoleId = powerUserRole.Id, PermissionId = permission.Id });
//                 }
//             }

//             // User gets operational permissions
//             var userPermissions = allPermissions.Where(p =>
//                 p.Name.Contains("Vehicles.") ||
//                 p.Name.Contains("Employees.") ||
//                 p.Name.Contains("Consumption.View") ||
//                 p.Name.Contains("ManualRefill.") ||
//                 p.Name.Contains("TankStock.")).ToList();
//             foreach (var permission in userPermissions)
//             {
//                 if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == userRole.Id && rp.PermissionId == permission.Id))
//                 {
//                     _context.RolePermissions.Add(new RolePermission { RoleId = userRole.Id, PermissionId = permission.Id });
//                 }
//             }

//             // Reader gets only view permissions
//             var readerPermissions = allPermissions.Where(p => p.Name.Contains(".View")).ToList();
//             foreach (var permission in readerPermissions)
//             {
//                 if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == readerRole.Id && rp.PermissionId == permission.Id))
//                 {
//                     _context.RolePermissions.Add(new RolePermission { RoleId = readerRole.Id, PermissionId = permission.Id });
//                 }
//             }

//             // Analyst gets dashboard and analysis permissions
//             var analystPermissions = allPermissions.Where(p =>
//                 p.Name.Contains("Dashboard.") ||
//                 p.Name.Contains("Analysis.") ||
//                 p.Name.Contains("Reports.View")).ToList();
//             foreach (var permission in analystPermissions)
//             {
//                 if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == analystRole.Id && rp.PermissionId == permission.Id))
//                 {
//                     _context.RolePermissions.Add(new RolePermission { RoleId = analystRole.Id, PermissionId = permission.Id });
//                 }
//             }

//             // Guest gets minimal view permissions
//             var guestPermissions = allPermissions.Where(p =>
//                 p.Name == "Dashboard.View").ToList();
//             foreach (var permission in guestPermissions)
//             {
//                 if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == guestRole.Id && rp.PermissionId == permission.Id))
//                 {
//                     _context.RolePermissions.Add(new RolePermission { RoleId = guestRole.Id, PermissionId = permission.Id });
//                 }
//             }

//             await _context.SaveChangesAsync();
//             _logger.LogInformation("Role permissions seeded successfully");
//         }

//         private async Task SeedRoleNavigationsAsync()
//         {
//             _logger.LogInformation("Seeding role navigations...");

//             var adminRole = await _roleManager.FindByNameAsync("Admin");
//             var powerUserRole = await _roleManager.FindByNameAsync("PowerUser");
//             var userRole = await _roleManager.FindByNameAsync("User");
//             var readerRole = await _roleManager.FindByNameAsync("Reader");
//             var analystRole = await _roleManager.FindByNameAsync("Analyst");
//             var guestRole = await _roleManager.FindByNameAsync("Guest");

//             var allNavigations = await _context.Navigationitems.ToListAsync();

//             // Admin gets all navigation items
//             foreach (var nav in allNavigations)
//             {
//                 if (!await _context.Rolenavigations.AnyAsync(rn => rn.RoleId == adminRole.Id && rn.NavigationItemId == nav.Id))
//                 {
//                     _context.Rolenavigations.Add(new Rolenavigation { RoleId = adminRole.Id, NavigationItemId = nav.Id });
//                 }
//             }

//             // PowerUser gets operational navigation items (not admin submenu)
//             var powerUserNavigations = allNavigations.Where(n =>
//                 n.Page == "Dashboard" ||
//                 n.Page == "Vehicles" ||
//                 n.Page == "Consumption" ||
//                 n.Page == "Manual Refill").ToList();
//             foreach (var nav in powerUserNavigations)
//             {
//                 if (!await _context.Rolenavigations.AnyAsync(rn => rn.RoleId == powerUserRole.Id && rn.NavigationItemId == nav.Id))
//                 {
//                     _context.Rolenavigations.Add(new Rolenavigation { RoleId = powerUserRole.Id, NavigationItemId = nav.Id });
//                 }
//             }

//             // User gets basic operational navigation items
//             var userNavigations = allNavigations.Where(n =>
//                 n.Page == "Vehicles" ||
//                 n.Page == "Employees" ||
//                 n.Page == "Consumption" ||
//                 n.Page == "Manual Refill" ||
//                 n.Page == "Tank Stock").ToList();
//             foreach (var nav in userNavigations)
//             {
//                 if (!await _context.Rolenavigations.AnyAsync(rn => rn.RoleId == userRole.Id && rn.NavigationItemId == nav.Id))
//                 {
//                     _context.Rolenavigations.Add(new Rolenavigation { RoleId = userRole.Id, NavigationItemId = nav.Id });
//                 }
//             }

//             // Reader gets view-only navigation items
//             var readerNavigations = allNavigations.Where(n =>
//                 n.Page == "Dashboard" ||
//                 n.Page == "Consumption" ||
//                 n.Page == "Tank Stock").ToList();
//             foreach (var nav in readerNavigations)
//             {
//                 if (!await _context.Rolenavigations.AnyAsync(rn => rn.RoleId == readerRole.Id && rn.NavigationItemId == nav.Id))
//                 {
//                     _context.Rolenavigations.Add(new Rolenavigation { RoleId = readerRole.Id, NavigationItemId = nav.Id });
//                 }
//             }

//             // Analyst gets dashboard and analysis navigation
//             var analystNavigations = allNavigations.Where(n =>
//                 n.Page == "Dashboard" ||
//                 n.Page == "Analysis" ||
//                 n.Page == "reports").ToList();
//             foreach (var nav in analystNavigations)
//             {
//                 if (!await _context.Rolenavigations.AnyAsync(rn => rn.RoleId == analystRole.Id && rn.NavigationItemId == nav.Id))
//                 {
//                     _context.Rolenavigations.Add(new Rolenavigation { RoleId = analystRole.Id, NavigationItemId = nav.Id });
//                 }
//             }

//             // Guest gets minimal navigation (just dashboard)
//             var guestNavigations = allNavigations.Where(n =>
//                 n.Page == "Dashboard").ToList();
//             foreach (var nav in guestNavigations)
//             {
//                 if (!await _context.Rolenavigations.AnyAsync(rn => rn.RoleId == guestRole.Id && rn.NavigationItemId == nav.Id))
//                 {
//                     _context.Rolenavigations.Add(new Rolenavigation { RoleId = guestRole.Id, NavigationItemId = nav.Id });
//                 }
//             }

//             await _context.SaveChangesAsync();
//             _logger.LogInformation("Role navigations seeded successfully");
//         }

//         private async Task RecordSeedingHistoryAsync()
//         {
//             var seedingHistory = new SeedingHistory
//             {
//                 SeedType = "InitialSetup",
//                 SeedDate = DateTime.UtcNow,
//                 Version = "1.0.0",
//                 Description = "Initial system setup with users, roles, permissions, and navigation items"
//             };

//             _context.SeedingHistories.Add(seedingHistory);
//             await _context.SaveChangesAsync();
//             _logger.LogInformation("Seeding history recorded");
//         }
//     }
// }