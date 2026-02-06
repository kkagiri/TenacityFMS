/**
 * Permission Utilities for Frontend
 *
 * Provides helper functions for checking user permissions in React components
 * Permissions are stored in the user object from Redux state
 */

/**
 * Check if current user has a specific permission
 * @param {Object} user - User object from Redux state
 * @param {string} permission - Permission name (e.g., "TankStock.Read", "_Read_TankStock")
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) {
    return false;
  }

  const permLower = permission.toLowerCase();
  return user.permissions.some(p => p.toLowerCase() === permLower);
};

/**
 * Check if current user has ANY of the specified permissions
 * @param {Object} user - User object from Redux state
 * @param {string[]} permissions - Array of permission names
 * @returns {boolean} - True if user has at least one permission
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user || !user.permissions || !Array.isArray(permissions)) {
    return false;
  }

  const userPermSet = new Set(user.permissions.map(p => p.toLowerCase()));
  return permissions.some(permission => userPermSet.has(permission.toLowerCase()));
};

/**
 * Check if current user has ALL of the specified permissions
 * @param {Object} user - User object from Redux state
 * @param {string[]} permissions - Array of permission names
 * @returns {boolean} - True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user || !user.permissions || !Array.isArray(permissions)) {
    return false;
  }

  const userPermSet = new Set(user.permissions.map(p => p.toLowerCase()));
  return permissions.every(permission => userPermSet.has(permission.toLowerCase()));
};

/**
 * Check if current user has a specific role
 * @param {Object} user - User object from Redux state
 * @param {string} role - Role name (e.g., "Admin", "Manager")
 * @returns {boolean} - True if user has role
 */
export const hasRole = (user, role) => {
  if (!user || !user.roles) {
    return false;
  }

  return user.roles.includes(role);
};

/**
 * Check if current user has ANY of the specified roles
 * @param {Object} user - User object from Redux state
 * @param {string[]} roles - Array of role names
 * @returns {boolean} - True if user has at least one role
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.roles || !Array.isArray(roles)) {
    return false;
  }

  return roles.some(role => user.roles.includes(role));
};

/**
 * Filter array based on user permission
 * Useful for filtering menu items, buttons, etc.
 *
 * @param {Array} items - Array of items to filter
 * @param {Object} user - User object from Redux state
 * @param {Function} getPermission - Function to extract permission from item
 * @returns {Array} - Filtered array
 *
 * @example
 * const menuItems = [
 *   { label: 'Tank Stock', permission: 'TankStock.Read' },
 *   { label: 'Employees', permission: 'Employee.Read' }
 * ];
 * const visibleItems = filterByPermission(menuItems, user, item => item.permission);
 */
export const filterByPermission = (items, user, getPermission) => {
  if (!Array.isArray(items) || !user) {
    return [];
  }

  return items.filter(item => {
    const permission = getPermission(item);
    return permission ? hasPermission(user, permission) : true;
  });
};

/**
 * Common permission constants for TankStock module
 * Use these instead of hardcoded strings
 */
export const TANKSTOCK_PERMISSIONS = {
  READ: '_Read_TankStock',
  CREATE: '_Create_TankStock',
  UPDATE: '_Update_TankStock',
  DELETE: '_Delete_TankStock',
};

/**
 * Common permission constants for Employee module
 */
export const EMPLOYEE_PERMISSIONS = {
  READ: '_Read_Employee',
  CREATE: '_Create_Employee',
  UPDATE: '_Edit_Employee',
  DELETE: '_Delete_Employee',
};

/**
 * Future-proof: Standardized permission constants (if you migrate to new naming)
 * Uncomment when ready to migrate
 */
/*
export const TANKSTOCK_PERMISSIONS_V2 = {
  READ: 'TankStock.Read',
  CREATE: 'TankStock.Create',
  UPDATE: 'TankStock.Update',
  DELETE: 'TankStock.Delete',
};

export const EMPLOYEE_PERMISSIONS_V2 = {
  READ: 'Employee.Read',
  CREATE: 'Employee.Create',
  UPDATE: 'Employee.Update',
  DELETE: 'Employee.Delete',
};
*/

/**
 * HOC (Higher Order Component) to protect routes/components with permissions
 *
 * @param {Component} Component - React component to wrap
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @param {Component} FallbackComponent - Component to show if no permission (optional)
 * @returns {Component} - Wrapped component
 *
 * @example
 * const ProtectedTankStock = withPermission(TankStockList, TANKSTOCK_PERMISSIONS.READ);
 *
 * // With multiple permissions (AND logic)
 * const ProtectedTankStock = withPermission(TankStockEdit,
 *   [TANKSTOCK_PERMISSIONS.READ, TANKSTOCK_PERMISSIONS.UPDATE]);
 */
export const withPermission = (Component, requiredPermissions, FallbackComponent = null) => {
  return (props) => {
    const { user } = props;

    const hasAccess = Array.isArray(requiredPermissions)
      ? hasAllPermissions(user, requiredPermissions)
      : hasPermission(user, requiredPermissions);

    if (!hasAccess) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return <div className="text-center p-4">
        <h3>Access Denied</h3>
        <p>You don't have permission to view this resource.</p>
      </div>;
    }

    return <Component {...props} />;
  };
};

/**
 * Custom React Hook for permission checking
 * Use this in functional components
 *
 * @param {string|string[]} requiredPermissions - Permission(s) to check
 * @returns {Object} - { hasAccess: boolean, user: Object }
 *
 * @example
 * function TankStockList() {
 *   const { hasAccess } = usePermission(TANKSTOCK_PERMISSIONS.READ);
 *
 *   if (!hasAccess) {
 *     return <div>Access Denied</div>;
 *   }
 *
 *   return <div>Tank Stock List</div>;
 * }
 */
export const usePermission = (requiredPermissions) => {
  // This would need to import useSelector from react-redux
  // For now, return a skeleton that you can implement
  //
  // import { useSelector } from 'react-redux';
  // const user = useSelector((state) => state.auth.user);
  //
  // const hasAccess = Array.isArray(requiredPermissions)
  //   ? hasAllPermissions(user, requiredPermissions)
  //   : hasPermission(user, requiredPermissions);
  //
  // return { hasAccess, user };

  return {
    hasAccess: true, // Placeholder - implement with actual Redux selector
    user: null
  };
};
