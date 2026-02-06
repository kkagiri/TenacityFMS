/**
 * JWT Token Utilities
 * Provides functions to decode JWT tokens and extract claims including permissions
 */

/**
 * Decode JWT token without verification (for client-side use only)
 * @param {string} token - The JWT token to decode
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJwtToken = (token) => {
  try {
    if (!token) return null;

    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed (base64 requires length to be multiple of 4)
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);

    // Decode from base64
    const decodedPayload = atob(paddedPayload);

    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Extract permissions from JWT token
 * @param {string} token - The JWT token
 * @returns {string[]} - Array of permission strings
 */
export const getPermissionsFromToken = (token) => {
  const decoded = decodeJwtToken(token);
  if (!decoded) return [];

  // Permissions are stored as "permissions" claims (can be multiple)
  const permissions = [];

  // Extract all permission claims
  Object.keys(decoded).forEach(key => {
    if (key === 'permissions') {
      // Handle both single permission and array of permissions
      const value = decoded[key];
      if (Array.isArray(value)) {
        permissions.push(...value);
      } else if (typeof value === 'string') {
        permissions.push(value);
      }
    }
  });

  return [...new Set(permissions)]; // Remove duplicates
};

/**
 * Extract user information from JWT token
 * @param {string} token - The JWT token
 * @returns {object|null} - User info object or null if invalid
 */
export const getUserInfoFromToken = (token) => {
  const decoded = decodeJwtToken(token);
  if (!decoded) return null;

  return {
    id: decoded.sub || decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
    username: decoded.name || decoded.unique_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
    email: decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    roles: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || []
  };
};

/**
 * Check if user has a specific permission
 * @param {string} token - The JWT token
 * @param {string} permission - The permission to check
 * @returns {boolean} - True if user has the permission
 */
export const hasPermission = (token, permission) => {
  const permissions = getPermissionsFromToken(token);
  const permLower = permission.toLowerCase();
  return permissions.some(p => p.toLowerCase() === permLower);
};

/**
 * Check if user has any of the specified permissions
 * @param {string} token - The JWT token
 * @param {string[]} requiredPermissions - Array of permissions to check
 * @returns {boolean} - True if user has at least one of the permissions
 */
export const hasAnyPermission = (token, requiredPermissions) => {
  const permissions = getPermissionsFromToken(token);
  const permSet = new Set(permissions.map(p => p.toLowerCase()));
  return requiredPermissions.some(perm => permSet.has(perm.toLowerCase()));
};

/**
 * Check if user has all of the specified permissions
 * @param {string} token - The JWT token
 * @param {string[]} requiredPermissions - Array of permissions to check
 * @returns {boolean} - True if user has all of the permissions
 */
export const hasAllPermissions = (token, requiredPermissions) => {
  const permissions = getPermissionsFromToken(token);
  const permSet = new Set(permissions.map(p => p.toLowerCase()));
  return requiredPermissions.every(perm => permSet.has(perm.toLowerCase()));
};

/**
 * Check if user has a specific role
 * @param {string} token - The JWT token
 * @param {string} role - The role to check
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (token, role) => {
  const userInfo = getUserInfoFromToken(token);
  if (!userInfo || !userInfo.roles) return false;

  const roles = Array.isArray(userInfo.roles) ? userInfo.roles : [userInfo.roles];
  return roles.some(r =>
    r === role ||
    (typeof r === 'string' && r.toLowerCase() === role.toLowerCase())
  );
};

/**
 * Check if token is expired
 * @param {string} token - The JWT token
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJwtToken(token);
  if (!decoded || !decoded.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= decoded.exp * 1000;
};

/**
 * Get token expiration date
 * @param {string} token - The JWT token
 * @returns {Date|null} - Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeJwtToken(token);
  if (!decoded || !decoded.exp) return null;

  return new Date(decoded.exp * 1000);
};
