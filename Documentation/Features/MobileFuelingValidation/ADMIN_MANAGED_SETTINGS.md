# Mobile Fueling Validation Settings - Admin-Managed Implementation

## Overview

This implementation moves the mobile fueling validation settings from local storage (in the mobile app) to admin-managed settings in the fms.frontend web portal. Administrators can now control validation behavior for all mobile app users through the PTS Automation Configuration page.

## Features

1. **Fuel Rules Check** - Warn mobile users if no fueling rules are assigned to the selected vehicle
2. **Fuel Capacity Validation** - Prevent issuing more fuel than the vehicle tank can hold
3. **GPS Fuel Level Check** - Use GPS-based fuel level readings to determine available tank space

## Files Modified

### Backend

#### Entity

- **FMS.Domain/Entities/AutomatedFuelingConfiguration.cs**
  - Added: `EnableFuelRulesCheck` (bool, default: true)
  - Added: `EnableFuelCapacityValidation` (bool, default: true)
  - Added: `EnableGPSFuelLevelCheck` (bool, default: true)

#### DTOs

- **FMS.Application/ModelsDTOs/Configuration/AutomatedFuelingConfigurationDto.cs**
  - Added new fields to main DTO
  - Added new fields to CreateAutomatedFuelingConfigurationDto
  - Added new fields to UpdateAutomatedFuelingConfigurationDto
  - Added new lightweight `MobileFuelingValidationSettingsDto` class

#### Entity Configuration

- **FMS.Persistence/EntityConfigurations/AutomatedFuelingConfigurationConfiguration.cs**
  - Added column configurations for the 3 new boolean fields

#### API Controller

- **FMS.WebClient/Controllers/FuelManagement/AutomatedFuelingConfigurationController.cs**
  - Added new endpoint: `GET /api/v1/automated-fueling-configuration/mobile-validation-settings`
  - Supports optional `siteId` query parameter for site-specific settings
  - Falls back to global configuration if no site-specific config exists

### Frontend (Web Admin)

- **fms.frontend/src/pages/PTSAutomationConfig/components/ConfigurationForm.js**
  - Added "Mobile Fueling Validation" section with 3 checkboxes
  - Added formData fields for the new settings
  - Added useEffect loading for existing configuration

### Mobile App

- **fms.mobile/src/services/fuelingValidationSettings.js**

  - Completely rewritten to fetch settings from backend API
  - Implements caching with 5-minute expiry
  - Falls back to cached values when offline or API unavailable
  - Uses auth token for API requests

- **fms.mobile/src/screens/SettingsScreen.js**
  - Removed local toggle functions (settings now read-only)
  - Added API-based loading of validation settings
  - Added "Admin" badge to indicate settings are admin-managed
  - Added loading indicator while fetching settings
  - Made switches disabled (read-only display)
  - Added informational text about admin management

## Database Migration

Create the following columns in the `automatedfuelingconfigurations` table:

```sql
ALTER TABLE automatedfuelingconfigurations
ADD COLUMN EnableFuelRulesCheck TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE automatedfuelingconfigurations
ADD COLUMN EnableFuelCapacityValidation TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE automatedfuelingconfigurations
ADD COLUMN EnableGPSFuelLevelCheck TINYINT(1) NOT NULL DEFAULT 1;
```

See: `Documentation/database_migrations/add_mobile_fueling_validation_settings.sql`

## API Endpoint

### Get Mobile Validation Settings

```
GET /api/v1/automated-fueling-configuration/mobile-validation-settings?siteId={optional}
```

**Response:**

```json
{
  "success": true,
  "message": "Validation settings retrieved",
  "data": {
    "enableFuelRulesCheck": true,
    "enableFuelCapacityValidation": true,
    "enableGPSFuelLevelCheck": true
  }
}
```

## Admin Configuration

1. Navigate to **Admin → PTS Automation Config** in the web portal
2. Edit or create a configuration
3. Scroll to **Mobile Fueling Validation** section
4. Configure the three validation settings:
   - **Enable Fuel Rules Check** - Warn if no fueling rules assigned
   - **Enable Fuel Capacity Validation** - Prevent tank overfilling
   - **Enable GPS Fuel Level Check** - Use GPS sensor data

## Mobile App Behavior

- Settings are fetched from the backend API when the app loads
- Settings are cached locally for 5 minutes to reduce API calls
- If offline, cached settings are used
- If no settings configured, defaults to all enabled (true)
- Settings display is read-only with "Admin" badge indicator
- Settings refresh when user changes their default site

## Testing

1. **Backend**: Run the database migration
2. **Web Admin**: Edit a PTS Automation Config and verify the new Mobile Fueling Validation section appears
3. **Mobile**: Navigate to Settings and verify:
   - Validation settings load from API
   - Toggles are disabled (read-only)
   - "Admin" badge displays next to section title
   - Info text shows "These settings are managed by your administrator"
