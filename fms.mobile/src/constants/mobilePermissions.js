/**
 * File: mobilePermissions.js
 * Purpose: Centralized mobile app permission constants.
 *          Values MUST match the 'Name' column in the 'permissions' database table exactly.
 *          These permissions control feature visibility in the mobile app.
 * Dependencies: None (pure constants)
 * Last Modified: 2026-02-28
 *
 * Key Permissions:
 * - _Mobile_Fueling: Access fueling / device list
 * - _Mobile_TransactionHub: Access tank transaction hub
 * - _Mobile_Transactions: Access transaction history
 * - _Mobile_Stocks: Access stock management
 * - _Mobile_Vehicles: Access vehicle details
 * - _Mobile_Issues: Access issue tracker
 * - _Mobile_Location: Access location settings
 * - _Mobile_TankLevels: Access tank levels / site overview
 */

export const MOBILE_PERMISSIONS = {
  FUELING: '_Mobile_Fueling',
  TRANSACTION_HUB: '_Mobile_TransactionHub',
  TRANSACTIONS: '_Mobile_Transactions',
  STOCKS: '_Mobile_Stocks',
  VEHICLES: '_Mobile_Vehicles',
  ISSUES: '_Mobile_Issues',
  LOCATION: '_Mobile_Location',
  TANK_LEVELS: '_Mobile_TankLevels',
};

/**
 * Permission groups for quick checks.
 * e.g., "all fuel-related mobile permissions"
 */
export const MOBILE_PERMISSION_GROUPS = {
  FUEL_ACTIVITY: [
    MOBILE_PERMISSIONS.FUELING,
    MOBILE_PERMISSIONS.TRANSACTION_HUB,
    MOBILE_PERMISSIONS.TRANSACTIONS,
    MOBILE_PERMISSIONS.STOCKS,
  ],
  APPS: [
    MOBILE_PERMISSIONS.VEHICLES,
    MOBILE_PERMISSIONS.ISSUES,
    MOBILE_PERMISSIONS.LOCATION,
  ],
  TANK: [
    MOBILE_PERMISSIONS.TANK_LEVELS,
  ],
};

export default MOBILE_PERMISSIONS;
