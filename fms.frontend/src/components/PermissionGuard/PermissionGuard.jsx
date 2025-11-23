import React from 'react';
import { useSelector } from 'react-redux';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../utils/permissions';

/**
 * PermissionGuard Component
 *
 * Conditionally renders children based on user permissions
 * Can check for single permission, multiple permissions (AND/OR logic), or roles
 *
 * @example
 * // Single permission (default AND logic)
 * <PermissionGuard requires="TankStock.Read">
 *   <button>View Tank Stock</button>
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions - user needs ALL (AND logic)
 * <PermissionGuard requires={["TankStock.Read", "TankStock.Update"]}>
 *   <button>Edit Tank Stock</button>
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions - user needs ANY (OR logic)
 * <PermissionGuard requires={["TankStock.Read", "TankStock.Update"]} mode="any">
 *   <button>View or Edit Tank Stock</button>
 * </PermissionGuard>
 *
 * @example
 * // Custom fallback when no permission
 * <PermissionGuard requires="TankStock.Delete" fallback={<span>Access Denied</span>}>
 *   <button>Delete Tank Stock</button>
 * </PermissionGuard>
 *
 * @example
 * // Show warning instead of hiding
 * <PermissionGuard
 *   requires="TankStock.Update"
 *   fallback={<button disabled>Edit (No Permission)</button>}
 * >
 *   <button>Edit Tank Stock</button>
 * </PermissionGuard>
 */
const PermissionGuard = ({
  children,
  requires,
  mode = 'all',  // 'all' (AND logic) or 'any' (OR logic)
  fallback = null,  // What to show when permission denied
  showFallback = false,  // Whether to show fallback or hide completely
}) => {
  const user = useSelector((state) => state.auth.user);

  // No user = no permission
  if (!user) {
    return showFallback ? fallback : null;
  }

  // Determine if user has required permission(s)
  let hasAccess = false;

  if (typeof requires === 'string') {
    // Single permission
    hasAccess = hasPermission(user, requires);
  } else if (Array.isArray(requires)) {
    // Multiple permissions
    if (mode === 'any') {
      // OR logic - user needs at least one permission
      hasAccess = hasAnyPermission(user, requires);
    } else {
      // AND logic - user needs all permissions
      hasAccess = hasAllPermissions(user, requires);
    }
  } else {
    // Invalid requires prop
    console.error('PermissionGuard: "requires" must be a string or array of strings');
    return null;
  }

  // Render based on permission check
  if (hasAccess) {
    return <>{children}</>;
  }

  // No permission
  return showFallback ? fallback : null;
};

/**
 * PermissionBadge Component
 *
 * Shows different content based on permission (useful for conditional styling)
 *
 * @example
 * <PermissionBadge
 *   requires="TankStock.Update"
 *   granted={<Badge color="success">Editable</Badge>}
 *   denied={<Badge color="secondary">Read-Only</Badge>}
 * />
 */
export const PermissionBadge = ({ requires, granted, denied = null }) => {
  const user = useSelector((state) => state.auth.user);

  const hasAccess = typeof requires === 'string'
    ? hasPermission(user, requires)
    : hasAllPermissions(user, requires);

  return hasAccess ? granted : denied;
};

/**
 * PermissionButton Component
 *
 * Button that automatically disables when user lacks permission
 *
 * @example
 * <PermissionButton
 *   requires="TankStock.Delete"
 *   onClick={handleDelete}
 *   className="btn btn-danger"
 * >
 *   Delete Tank Stock
 * </PermissionButton>
 */
export const PermissionButton = ({
  children,
  requires,
  onClick,
  disabledText = null,
  ...props
}) => {
  const user = useSelector((state) => state.auth.user);

  const hasAccess = typeof requires === 'string'
    ? hasPermission(user, requires)
    : hasAllPermissions(user, requires);

  return (
    <button
      {...props}
      onClick={hasAccess ? onClick : undefined}
      disabled={!hasAccess}
      title={hasAccess ? props.title : (disabledText || 'No permission')}
    >
      {children}
    </button>
  );
};

export default PermissionGuard;
