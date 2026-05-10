# ??? Database Setup - Ready to Execute!

## ? What's Ready

I've created the complete database setup SQL script for you:

**File Location**:

```
C:\Users\admin\Documents\GitHub\Tenacity.FMS\Documentation\Features\VehicleTracking\Phase8\EXECUTE_Database_Setup.sql
```

## ?? Before You Execute

### Update Configuration Values

Open the SQL file and find this section:

```sql
JSON_OBJECT(
    'ApiKey', 'UPDATE_THIS_WITH_YOUR_API_KEY',  ?? REPLACE THIS
    'BaseUrl', 'http://10.0.10.150/comGpsGate/api/v.1',  ?? UPDATE IF NEEDED
    'ApplicationId', '12'  ?? UPDATE IF NEEDED
),
```

**What you need**:

1. **GPSGate API Key** - Get from your GPSGate administrator
2. **GPSGate Base URL** - Your GPSGate server URL (default: `http://10.0.10.150/comGpsGate/api/v.1`)
3. **Application ID** - Usually `12` (confirm with your setup)

## ?? How to Execute

### Option 1: MySQL Workbench (Recommended)

1. **Open MySQL Workbench**
2. **Connect** to your FMS database
3. **File** ? **Run SQL Script**
4. **Select**: `EXECUTE_Database_Setup.sql`
5. **Click** "Run"
6. **Verify** success messages in output

### Option 2: MySQL Command Line

```powershell
# Navigate to the SQL file directory
cd "C:\Users\admin\Documents\GitHub\Tenacity.FMS\Documentation\Features\VehicleTracking\Phase8"

# Execute the script
mysql -h localhost -u your_username -p your_database_name

# Inside MySQL prompt:
source EXECUTE_Database_Setup.sql
```

### Option 3: Copy & Paste

1. **Open** `EXECUTE_Database_Setup.sql` in text editor
2. **Update** the API Key and URLs
3. **Copy** the entire content
4. **Paste** into your MySQL client
5. **Execute**

## ? Verification

After execution, you should see:

```
? Step 1: GPSGate Provider Configured
? Step 2: Navigation Items Created
? DATABASE SETUP COMPLETE!
```

**Check Provider Configuration**:

```sql
SELECT * FROM provider_configurations WHERE provider_name = 'GPSGate';
```

Expected result: 1 row with your configuration

**Check Navigation Items**:

```sql
SELECT Title, Path FROM navigationitems WHERE Title LIKE '%Provider%';
```

Expected result: 4 rows (1 parent + 3 children)

## ?? Troubleshooting

### Issue: "Table 'provider_configurations' doesn't exist"

**Solution**: Create the table first:

```sql
CREATE TABLE provider_configurations (
    provider_id INT PRIMARY KEY AUTO_INCREMENT,
    provider_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    priority_order INT DEFAULT 999,
    configuration_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Issue: "Duplicate entry for key 'provider_name'"

**This is OK!** The script uses `ON DUPLICATE KEY UPDATE`, so it will update existing records.

### Issue: "JSON_OBJECT not recognized"

**Solution**: Ensure MySQL version 5.7.8+. Or use string format:

```sql
configuration_data = '{"ApiKey":"your-key","BaseUrl":"your-url","ApplicationId":"12"}'
```

## ?? What Happens Next

After database setup:

1. ? **GPSGate provider configured** in database
2. ? **Navigation menu items created**
3. ?? **Next**: Build frontend (`npm run build:prod`)
4. ?? **Next**: Start WebClient API
5. ?? **Next**: Navigate to `/providermanagement`

## ?? Additional Files Created

1. **EXECUTE_Database_Setup.sql** - Main setup script
2. **DATABASE_SETUP_GUIDE.md** - Detailed guide
3. **setup-provider-management.ps1** - PowerShell helper script

## ?? Quick Command Summary

```powershell
# 1. Update API key in SQL file (manual edit)

# 2. Execute SQL (choose one method above)

# 3. Verify in database
mysql -u your_user -p -e "SELECT provider_name, is_enabled FROM provider_configurations WHERE provider_name='GPSGate';"

# 4. Build frontend
cd C:\Users\admin\Documents\GitHub\Tenacity.FMS\fms.frontend
npm run build:prod

# 5. Start backend (in Visual Studio)
# Open FMS.WebClient ? Press F5
```

## ? Success Checklist

Before moving to next phase, verify:

- [ ] SQL script executed without errors
- [ ] GPSGate provider exists in `provider_configurations` table
- [ ] Provider is enabled (`is_enabled = 1`)
- [ ] Provider is default (`is_default = 1`)
- [ ] 4 navigation items created (Provider Management + 3 children)
- [ ] Navigation items are active (`IsActive = 1`)
- [ ] API credentials are correct (not placeholders)

## ?? Need Help?

**If stuck**:

1. Check the detailed guide: `DATABASE_SETUP_GUIDE.md`
2. Review error messages in MySQL output
3. Verify database connection works
4. Ensure you have proper permissions (CREATE, INSERT, UPDATE)

---

**Ready to proceed?** Execute the SQL script and mark the "Database Setup & Configuration" todo as complete!

**Estimated Time**: 5-10 minutes
