# Provider Management System - User Guide

## 📚 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Configuration Management](#configuration-management)
5. [Vehicle Assignments](#vehicle-assignments)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)
8. [FAQs](#faqs)

---

## Overview

### What is Provider Management?

The Provider Management System allows administrators to manage GPS tracking providers for the FMS fleet management system. It provides:

- **Real-time Health Monitoring**: Monitor the status of all GPS tracking providers
- **Configuration Management**: Update provider settings without code changes
- **Vehicle Assignments**: Assign specific vehicles to specific providers
- **Automatic Failover**: System automatically switches to backup providers when primary fails
- **Performance Analytics**: Track provider performance and reliability

### Key Benefits

✅ **Centralized Control**: Manage all GPS providers from one interface
✅ **No Downtime**: Update configurations without restarting the system
✅ **Redundancy**: Multiple providers ensure continuous tracking
✅ **Visibility**: Real-time status of all providers at a glance
✅ **Flexibility**: Easy to add new providers or disable problematic ones

---

## Getting Started

### Accessing Provider Management

1. **Login** to the FMS system with admin credentials
2. **Navigate** to the main menu
3. **Click** "Provider Management" in the navigation menu
4. You'll see three tabs:
   - 📊 **Dashboard** - Real-time monitoring
   - ⚙️ **Configuration** - Manage settings
   - 🚛 **Vehicle Assignments** - Map vehicles to providers

### User Permissions

**Required Role**: Administrator

**Required Permissions**:

- `_Read_ProviderManagement`
- `_Create_ProviderManagement`
- `_Update_ProviderManagement`

Contact your system administrator if you don't have access.

---

## Dashboard

### Overview

The Dashboard provides real-time visibility into all GPS tracking providers.

![Dashboard Screenshot Placeholder]

### Main Components

#### 1. Statistics Cards

**Total Providers**

- Shows the total number of configured providers
- Icon: 🌐 Network

**Healthy Providers**

- Number of providers currently working properly
- Icon: ✅ Check Circle
- Green color indicates good health

**Total Requests**

- Total API requests made to all providers
- Updated in real-time
- Icon: 📊 Chart Line

**Success Rate**

- Percentage of successful requests
- Calculated as: `(Successful Requests / Total Requests) × 100`
- Icon: ✔️ Badge Check

#### 2. Provider Status Table

**Columns**:

| Column            | Description                                        |
| ----------------- | -------------------------------------------------- |
| **Provider Name** | Internal system name (e.g., "GPSGate")             |
| **Display Name**  | User-friendly name shown in UI                     |
| **Status**        | Current health status (Healthy/Degraded/Unhealthy) |
| **Enabled**       | Whether provider is active                         |
| **Default**       | Star (⭐) indicates default provider               |
| **Response Time** | API response time in milliseconds                  |
| **Priority**      | Failover order (1 = highest priority)              |
| **Actions**       | Quick actions (test connection)                    |

**Status Indicators**:

- 🟢 **Healthy**: Provider is working correctly

  - Green badge
  - Response time < 500ms
  - Recent successful requests

- 🟡 **Degraded**: Provider is working but slow

  - Yellow badge
  - Response time 500ms - 2000ms
  - Some failed requests

- 🔴 **Unhealthy**: Provider is not working
  - Red badge
  - Connection failures
  - Timeout errors

#### 3. Provider Statistics Section

Shows detailed statistics for each provider:

- **Requests**: Total number of requests sent to this provider
- **Success Rate**: Percentage of successful requests
- **Avg Response**: Average response time in milliseconds
- **Status**: Current health status

### Using Auto-Refresh

**Enable Auto-Refresh**:

1. Check the "Auto-refresh (30s)" checkbox
2. Dashboard will update every 30 seconds automatically
3. Silent updates won't show notifications

**Disable Auto-Refresh**:

1. Uncheck the "Auto-refresh (30s)" checkbox
2. Use "Refresh" button for manual updates

### Testing Provider Connection

**Steps**:

1. Find the provider in the status table
2. Click the **🔌 Plug icon** in the Actions column
3. Wait for the test to complete
4. See notification:
   - ✅ Success: "Successfully connected to [Provider]"
   - ❌ Failure: "Failed to connect to [Provider]"

**When to Test**:

- After configuration changes
- When troubleshooting issues
- Before setting a provider as default
- After adding a new provider

### Reloading Providers

**What it does**:

- Reloads all provider configurations from database
- Re-initializes provider connections
- Applies recent configuration changes
- Refreshes provider discovery

**How to Reload**:

1. Click the **"Reload Providers"** button
2. Wait for confirmation message
3. Dashboard will automatically refresh

**When to Reload**:

- After changing provider configurations
- When adding new providers
- If providers show incorrect status
- After database updates

---

## Configuration Management

### Overview

The Configuration page allows you to modify provider settings, enable/disable providers, and manage API credentials.

### Provider List

#### Viewing Providers

The configuration table shows all providers with:

- Provider Name
- Display Name
- Description
- Enabled status
- Default status
- Priority order

#### Enable/Disable Provider

**To Disable a Provider**:

1. Find the provider in the table
2. Click the **"Enabled"** badge (green)
3. Badge changes to **"Disabled"** (gray)
4. Provider is immediately deactivated

**To Enable a Provider**:

1. Find the disabled provider
2. Click the **"Disabled"** badge (gray)
3. Badge changes to **"Enabled"** (green)
4. Provider is immediately activated

**Important Notes**:

- ⚠️ Disabling the default provider may affect tracking
- ⚠️ System needs at least one enabled provider
- ✅ Changes apply immediately, no restart needed

#### Setting Default Provider

**Steps**:

1. Find the provider you want to set as default
2. Click the **⭐ Star icon** in the Default column
3. Confirmation message appears
4. Star moves to the selected provider

**Default Provider Behavior**:

- Used for vehicles without specific assignments
- First choice for new tracking requests
- Highest priority in failover scenarios

**Best Practices**:

- Choose your most reliable provider as default
- Ensure default provider is enabled
- Test connection before setting as default

### Editing Provider Configuration

#### Opening Configuration Editor

1. Find the provider to configure
2. Click the **⚙️ Gear icon** in the Actions column
3. Configuration popup opens

#### Configuration Popup

**Sections**:

1. **Provider Information** (Read-only)

   - Provider Name
   - Display Name
   - Current status

2. **Configuration JSON Editor**

   - Large text area for JSON editing
   - Syntax highlighting (basic)
   - Validation on save

3. **Configuration Tips**
   - Helpful reminders
   - JSON formatting guidelines
   - Security notes

#### Editing Configuration

**Example Configuration (GPSGate)**:

```json
{
  "ApiKey": "your-api-key-here",
  "BaseUrl": "http://10.0.10.150/comGpsGate/api/v.1",
  "ApplicationId": "12"
}
```

**Steps to Edit**:

1. **Click** the gear icon for the provider
2. **Review** the current configuration
3. **Edit** the JSON in the text area
4. **Validate** your changes:
   - Ensure proper JSON syntax
   - Include all required fields
   - Use correct data types
5. **Click** "Save Configuration"
6. **Wait** for confirmation message
7. Provider automatically reloads with new settings

#### Common Configuration Fields

**GPSGate Provider**:

```json
{
  "ApiKey": "string", // Required: API authentication key
  "BaseUrl": "string", // Required: API endpoint URL
  "ApplicationId": "number" // Required: GPSGate app ID
}
```

**Future Providers** (Example):

```json
{
  "ApiKey": "string",
  "ApiSecret": "string",
  "AccountId": "string",
  "Region": "string"
}
```

#### Configuration Validation

**Automatic Checks**:

- ✅ Valid JSON syntax
- ✅ Required fields present
- ✅ Correct data types

**Validation Errors**:

- ❌ Invalid JSON format
- ❌ Missing required fields
- ❌ Connection test failed

**Error Messages**:

- "Invalid JSON format" - Fix syntax errors
- "Failed to save configuration" - Check network/permissions
- "Provider not found" - Refresh and try again

### Managing Priority Order

**What is Priority Order?**

- Determines failover sequence
- Lower numbers = higher priority
- Priority 1 is tried first

**Typical Setup**:

1. Priority 1: Default provider (most reliable)
2. Priority 2: Backup provider
3. Priority 3: Secondary backup

**Editing Priority**:

1. Click gear icon to edit configuration
2. Update "PriorityOrder" field in JSON
3. Save changes
4. Reload providers

---

## Vehicle Assignments

### Overview

The Vehicle Assignments page allows you to assign specific vehicles to specific tracking providers for granular control.

### Understanding Assignments

**Default Behavior**:

- Vehicles without assignments use the default provider
- System automatically routes to assigned provider
- Fallback to default if assigned provider fails

**Use Cases**:

- Testing new providers with specific vehicles
- Geographic optimization (regional providers)
- Load distribution across providers
- Troubleshooting specific vehicle issues

### Viewing Assignments

**Assignment Table Shows**:

- Vehicle ID
- Vehicle Name (Tenacy Number)
- Number Plate
- Assigned Provider (or "Not assigned")

### Creating Assignments

**Steps** (when implemented):

1. Find vehicle in the table
2. Click "Assign Provider" button
3. Select provider from dropdown
4. Click "Save"
5. Confirmation message appears

### Assignment Best Practices

✅ **Do**:

- Test provider before bulk assignments
- Document why vehicles are assigned
- Monitor assigned vehicle performance
- Keep assignments up to date

❌ **Don't**:

- Assign to disabled providers
- Create circular dependencies
- Assign all vehicles to one provider
- Forget to remove old assignments

---

## Common Tasks

### Task 1: Adding a New Provider

**Prerequisites**:

- Provider implementation exists
- Database configuration ready
- API credentials available

**Steps**:

1. **Execute Database Script**:

   ```sql
   INSERT INTO provider_configurations (
     provider_name, display_name, description,
     configuration_data, is_enabled, is_default, priority_order
   ) VALUES (
     'NewProvider', 'New Provider Name', 'Description',
     '{"ApiKey":"YOUR_KEY"}', 1, 0, 3
   );
   ```

2. **Reload Providers**:

   - Go to Dashboard
   - Click "Reload Providers"
   - Verify new provider appears

3. **Configure Provider**:

   - Go to Configuration tab
   - Find the new provider
   - Click gear icon
   - Update configuration JSON
   - Save changes

4. **Test Connection**:

   - Go to Dashboard
   - Click plug icon for new provider
   - Verify successful connection

5. **Enable Provider**:
   - Click "Disabled" badge if needed
   - Provider is now active

### Task 2: Troubleshooting Unhealthy Provider

**Symptoms**:

- Red "Unhealthy" status badge
- Failed requests in statistics
- Timeout errors

**Troubleshooting Steps**:

1. **Check Connection**:

   - Click plug icon to test
   - Review error message

2. **Verify Configuration**:

   - Go to Configuration tab
   - Click gear icon
   - Check API credentials
   - Verify URL is correct
   - Ensure no typos

3. **Test Manually**:

   - Use Postman or curl to test API
   - Verify credentials work outside FMS
   - Check network connectivity

4. **Review Logs**:

   - Check application logs
   - Look for initialization errors
   - Check for timeout messages

5. **Restart Provider**:

   - Disable provider
   - Wait 10 seconds
   - Enable provider
   - Click "Reload Providers"

6. **Contact Support**:
   - If issue persists
   - Provide error messages
   - Share configuration (without sensitive data)

### Task 3: Switching Default Provider

**Scenario**: Primary provider is having issues, need to switch to backup.

**Steps**:

1. **Verify Backup Provider**:

   - Go to Dashboard
   - Check backup provider is Healthy
   - Test connection with plug icon

2. **Set New Default**:

   - Go to Configuration tab
   - Find backup provider
   - Click star icon in Default column
   - Confirm change

3. **Disable Old Provider** (Optional):

   - Find old default provider
   - Click "Enabled" badge to disable
   - System now uses new default

4. **Monitor**:

   - Return to Dashboard
   - Watch statistics
   - Verify requests going to new provider

5. **Notify Team**:
   - Inform operations team
   - Document the change
   - Set reminder to re-enable if needed

### Task 4: Optimizing Provider Performance

**Goal**: Distribute load and improve response times

**Steps**:

1. **Analyze Statistics**:

   - Review Provider Statistics section
   - Identify slowest provider
   - Check success rates

2. **Adjust Priorities**:

   - Give faster providers higher priority
   - Set slower providers as backup

3. **Assign Vehicles**:

   - Distribute vehicles across providers
   - Balance load geographically if possible

4. **Monitor Results**:

   - Enable auto-refresh
   - Watch response times
   - Check for improvements

5. **Fine-tune**:
   - Adjust based on results
   - Re-test configurations
   - Document optimal settings

---

## Troubleshooting

### Common Issues

#### Issue 1: Provider Management Menu Not Visible

**Symptoms**:

- "Provider Management" not in navigation menu

**Possible Causes**:

- Insufficient permissions
- Navigation not configured in database
- Role assignment missing

**Solutions**:

1. **Check Permissions**:

   ```sql
   -- Verify navigation item exists
   SELECT * FROM navigationitems WHERE Path = '/providermanagement';
   ```

2. **Verify Role Assignment**:

   - Contact administrator
   - Request Provider Management permissions

3. **Clear Cache**:
   - Logout and login again
   - Clear browser cache
   - Hard refresh (Ctrl+F5)

#### Issue 2: Configuration Won't Save

**Symptoms**:

- "Failed to save configuration" error
- Changes revert after save

**Possible Causes**:

- Invalid JSON syntax
- Missing required fields
- Database connection issue
- Permissions problem

**Solutions**:

1. **Validate JSON**:

   - Use online JSON validator
   - Check for missing commas/quotes
   - Ensure proper formatting

2. **Check Required Fields**:

   ```json
   {
     "ApiKey": "required",
     "BaseUrl": "required",
     "ApplicationId": "required"
   }
   ```

3. **Check Browser Console**:

   - Press F12
   - Look for error messages
   - Check network tab for failed requests

4. **Try Again**:
   - Close and reopen popup
   - Refresh page
   - Copy configuration to text file
   - Re-enter carefully

#### Issue 3: Auto-Refresh Not Working

**Symptoms**:

- Dashboard doesn't update automatically
- Checkbox checked but no updates

**Solutions**:

1. **Re-enable Auto-Refresh**:

   - Uncheck the checkbox
   - Wait 2 seconds
   - Check it again

2. **Check Browser Console**:

   - Look for JavaScript errors
   - Check for network issues

3. **Manual Refresh**:

   - Use Refresh button instead
   - Reload page

4. **Clear Browser Data**:
   - Clear cache and cookies
   - Restart browser

#### Issue 4: Provider Shows as Unhealthy

**Symptoms**:

- Red status badge
- Connection test fails
- No location data

**Solutions**:

1. **Verify Configuration**:

   - Check API credentials
   - Verify URL is accessible
   - Test outside of FMS

2. **Check Network**:

   - Ping the provider server
   - Check firewall rules
   - Verify VPN if needed

3. **Review Logs**:

   ```
   Check logs for:
   - Connection timeout errors
   - Authentication failures
   - API response errors
   ```

4. **Contact Provider Support**:
   - Verify API key is valid
   - Check service status
   - Request support ticket

#### Issue 5: Statistics Not Updating

**Symptoms**:

- Request counts frozen
- Success rate shows 0%
- No provider statistics

**Solutions**:

1. **Reload Providers**:

   - Click "Reload Providers" button
   - Wait for confirmation

2. **Check Backend Logs**:

   - Verify API is running
   - Check for errors

3. **Test API Manually**:

   ```bash
   curl http://your-server/api/v1/providers/statistics
   ```

4. **Restart Application**:
   - Last resort
   - Contact administrator

---

## FAQs

### General Questions

**Q: How many providers can I have?**
A: No limit, but typically 2-3 providers is sufficient for redundancy.

**Q: Can I delete a provider?**
A: Currently, disable providers instead of deleting. Deletion feature coming soon.

**Q: What happens if all providers fail?**
A: System will log errors and continue attempting connections. No location data until provider recovers.

**Q: Do changes require a system restart?**
A: No, all changes apply immediately or after clicking "Reload Providers."

### Configuration Questions

**Q: Where do I get API credentials?**
A: Contact your GPS tracking provider (e.g., GPSGate administrator).

**Q: Can I test configuration before saving?**
A: Yes, use the "Test Connection" feature after saving.

**Q: What if I enter wrong credentials?**
A: Provider will show as Unhealthy. Edit configuration and correct the credentials.

**Q: Are API keys encrypted?**
A: Yes, stored securely in the database with encryption.

### Performance Questions

**Q: Why is my provider slow?**
A: Check network connectivity, server load, and provider API status.

**Q: How can I improve response times?**
A: Use multiple providers, optimize configurations, assign vehicles geographically.

**Q: What's a good response time?**
A: Under 200ms is excellent, 200-500ms is good, over 1000ms needs investigation.

**Q: How often does the system check health?**
A: Health checks run every 60 seconds automatically.

### Assignment Questions

**Q: Can a vehicle be assigned to multiple providers?**
A: Only one active assignment at a time, but system will failover automatically.

**Q: What if assigned provider is disabled?**
A: System uses default provider instead.

**Q: Can I bulk assign vehicles?**
A: Feature coming soon. Currently assign individually.

**Q: How do I remove an assignment?**
A: Feature coming soon. Workaround: Assign to default provider.

---

## Getting Help

### Support Resources

**Documentation**:

- This User Guide
- API Documentation: `Documentation/Features/VehicleTracking/`
- Technical Guide: `PHASE6-7_COMPLETE.md`

**Contact Support**:

- **Email**: support@yourcompany.com
- **Phone**: +1 (555) 123-4567
- **Portal**: https://support.yourcompany.com

**Best Practices**:

- Include screenshots when reporting issues
- Provide error messages from browser console
- Note steps to reproduce the problem
- Mention which provider is affected

---

## Appendix

### Keyboard Shortcuts

| Shortcut         | Action               |
| ---------------- | -------------------- |
| `Ctrl+R` or `F5` | Refresh dashboard    |
| `Esc`            | Close popup          |
| `Tab`            | Navigate form fields |

### Status Color Guide

| Color     | Meaning   | Action Required  |
| --------- | --------- | ---------------- |
| 🟢 Green  | Healthy   | None             |
| 🟡 Yellow | Degraded  | Monitor          |
| 🔴 Red    | Unhealthy | Investigate      |
| ⚫ Gray   | Disabled  | Enable if needed |
| 🔵 Blue   | Default   | None             |

### Glossary

- **Provider**: GPS tracking service (e.g., GPSGate)
- **Configuration**: Provider settings (API keys, URLs)
- **Health Status**: Current operational state
- **Failover**: Automatic switch to backup provider
- **Priority**: Order of provider selection
- **Assignment**: Vehicle-to-provider mapping

---

**Document Version**: 1.0
**Last Updated**: October 27, 2025
**Author**: FMS Development Team
