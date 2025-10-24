# Fuel Import Calendar - Deployment Checklist

## ⚠️ IMPORTANT: Complete These Steps Before Testing

### Step 1: Entity Configuration (REQUIRED)

**File**: `FMS.Persistence/EntityConfigurations/FuelReportImportHistoryConfiguration.cs`

Create this file with the following content:

```csharp
using FMS.Domain.Entities.Features.FuelImport;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class FuelReportImportHistoryConfiguration : IEntityTypeConfiguration<FuelReportImportHistory>
    {
        public void Configure(EntityTypeBuilder<FuelReportImportHistory> builder)
        {
            builder.ToTable("fuel_report_import_history");
            builder.HasKey(h => h.Id);

            builder.Property(h => h.ReportId).HasMaxLength(50).IsRequired();
            builder.Property(h => h.ConsumptionDate).IsRequired();
            builder.Property(h => h.UserId).HasMaxLength(450).IsRequired();
            builder.Property(h => h.Status).HasMaxLength(20).IsRequired();

            builder.HasOne(h => h.Site)
                .WithMany()
                .HasForeignKey(h => h.SiteId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(h => h.User)
                .WithMany()
                .HasForeignKey(h => h.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(h => h.ReportId);
            builder.HasIndex(h => h.ConsumptionDate);
            builder.HasIndex(h => h.SiteId);
            builder.HasIndex(h => new { h.ConsumptionDate, h.SiteId });
        }
    }
}
```

### Step 2: Update GpsdataContext (REQUIRED)

**File**: `FMS.Persistence/DataAccess/GpsdataContext.cs`

**A. Add DbSet Property:**

Find the DbSet declarations section and add:

```csharp
public virtual DbSet<FuelReportImportHistory> FuelReportImportHistories { get; set; }
```

**B. Register Configuration:**

In the `OnModelCreating` method, add:

```csharp
modelBuilder.ApplyConfiguration(new FuelReportImportHistoryConfiguration());
```

**C. Add Using Statement:**

At the top of the file:

```csharp
using FMS.Domain.Entities.Features.FuelImport;
```

### Step 3: Update Site Configuration (OPTIONAL but recommended)

**File**: `FMS.Persistence/EntityConfigurations/SiteConfiguration.cs`

Add configuration for IsActive property:

```csharp
builder.Property(s => s.IsActive)
    .IsRequired()
    .HasDefaultValue(true)
    .HasComment("Indicates whether the site is active for fuel reporting");
```

### Step 4: Run Database Migration (REQUIRED)

Open MySQL Workbench or command line:

```bash
# 1. Backup database first!
mysqldump -u root -p gpsdata > backup_before_fuel_calendar.sql

# 2. Run migration
mysql -u root -p gpsdata < Database/Scripts/FuelImportCalendar_Migration.sql

# 3. Verify tables created
mysql -u root -p gpsdata -e "DESCRIBE fuel_report_import_history;"
mysql -u root -p gpsdata -e "SHOW COLUMNS FROM sites LIKE 'IsActive';"
```

### Step 5: Set Active Sites (REQUIRED)

After migration, mark which sites should appear in calendar:

```sql
-- Mark all sites as active (default)
UPDATE sites SET IsActive = 1;

-- OR mark specific sites as active
UPDATE sites SET IsActive = 1 WHERE Id IN (1, 2, 3, 4, 5);

-- Mark inactive sites (if any)
UPDATE sites SET IsActive = 0 WHERE [your conditions for inactive sites];
```

### Step 6: Build Solution (REQUIRED)

```bash
# From solution root
dotnet build Hyoung.Fms.sln

# Check for errors
# Fix any namespace or reference issues
```

### Step 7: Install Frontend Dependencies (if needed)

```bash
cd fms.frontend
npm install
```

### Step 8: Test the Feature

1. **Start Backend**: Run `FMS.WebClient` in Visual Studio
2. **Start Frontend**:
   ```bash
   cd fms.frontend
   npm start
   ```
3. **Login** to the application
4. **Navigate** to Fuel Report Importer page
5. **Import** some test data first
6. **Click** "Import Calendar" button
7. **Verify** calendar shows the imported data

## 🔍 Verification Steps

### Database Verification

```sql
-- Check if fuel_report_import_history table exists
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'gpsdata'
AND TABLE_NAME = 'fuel_report_import_history';

-- Check if IsActive column exists in sites
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'gpsdata'
AND TABLE_NAME = 'sites'
AND COLUMN_NAME = 'IsActive';

-- Check if view was created
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_SCHEMA = 'gpsdata'
AND TABLE_NAME = 'v_import_calendar_summary';
```

### Backend Verification

1. Build should succeed with no errors
2. Check Swagger UI: `/swagger`
   - Should see `/api/v1/fuelimport/calendar` endpoint
   - Should see `/api/v1/fuelimport/summary` endpoint

3. Test endpoints:
   ```http
   GET https://localhost:5001/api/v1/fuelimport/calendar?startDate=2025-01-01&endDate=2025-01-31
   ```

### Frontend Verification

1. Calendar button should appear in Fuel Report Importer header
2. Clicking button should open popup
3. Calendar should display current month
4. Site filter dropdown should show all sites
5. Summary stats should show at top

## ❌ Common Issues & Solutions

### Issue: "Table 'gpsdata.fuel_report_import_history' doesn't exist"

**Solution**: Run the database migration script

### Issue: "Cannot convert undefined or null to object"

**Solution**:
- Check that sites data is loaded
- Check browser console for API errors
- Verify backend is running

### Issue: "No data in calendar"

**Solution**:
1. Import some fuel consumption data first
2. Check `fuel_report_import_history` table has records:
   ```sql
   SELECT COUNT(*) FROM fuel_report_import_history;
   ```
3. Check all sites have `IsActive = 1`

### Issue: Build errors about missing references

**Solution**:
- Clean and rebuild solution
- Check that all using statements are correct
- Verify `FuelReportImportHistory` entity compiles

### Issue: "Foreign key constraint fails"

**Solution**:
- Ensure `aspnetusers` table exists
- Ensure UserId being tracked exists in database
- Update migration script foreign key constraints if needed

## 📋 Post-Deployment Testing

### Test Case 1: View Calendar
- [ ] Click "Import Calendar" button
- [ ] Calendar popup opens
- [ ] Current month displayed
- [ ] Summary stats visible

### Test Case 2: Import Data & Track
- [ ] Import fuel consumption data
- [ ] Open calendar
- [ ] Verify imported date shows green
- [ ] Hover over date to see details

### Test Case 3: Missing Data
- [ ] Open calendar for month with no imports
- [ ] Check "Missing Data" section at bottom
- [ ] Should list active sites with no data

### Test Case 4: Site Filter
- [ ] Select specific site from dropdown
- [ ] Calendar updates to show only that site
- [ ] Clear filter to show all sites

### Test Case 5: View Switching
- [ ] Toggle between Month/Week/Day views
- [ ] Calendar updates correctly
- [ ] Navigation works in all views

## ✅ Deployment Complete Checklist

- [ ] Entity configuration created
- [ ] GpsdataContext updated
- [ ] Database migration executed
- [ ] Active sites configured
- [ ] Solution builds successfully
- [ ] Backend endpoints accessible
- [ ] Frontend calendar button visible
- [ ] Calendar popup opens
- [ ] Data displays correctly
- [ ] Site filter works
- [ ] Missing data detection works
- [ ] Summary statistics display

## 📞 Need Help?

Check these resources:
1. `Documentation/Features/FuelImport/FuelImportCalendar.md` - Full documentation
2. `Documentation/Features/FuelImport/IMPLEMENTATION_SUMMARY.md` - Implementation details
3. Backend logs: `FMS.WebClient/Logs/`
4. Browser console: Check for JavaScript errors

---

**Once all checkboxes are complete, the feature is ready for production use!**
