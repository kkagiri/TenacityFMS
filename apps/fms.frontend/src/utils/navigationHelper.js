/**
 * Navigation Helper
 *
 * This file provides utilities and documentation for setting up navigation in the FMS application.
 *
 * IMPORTANT: Each navigation item created in the database must have a corresponding:
 * 1. Page component in the application
 * 2. Route definition in your router configuration
 *
 * Example workflow:
 * 1. Create navigation item in Navigation Management page
 * 2. Create corresponding page component
 * 3. Add route to your router configuration
 */

/**
 * Example of creating a page component for a navigation item:
 *
 * // src/pages/Reports/ReportsPage.js
 * import React from 'react';
 *
 * const ReportsPage = () => {
 *   return (
 *     <div className="content-block">
 *       <div className="content">
 *         <h1>Reports</h1>
 *         // Your page content here
 *       </div>
 *     </div>
 *   );
 * };
 *
 * export default ReportsPage;
 */

/**
 * Example of adding route to router configuration:
 *
 * // In your main router file
 * import ReportsPage from './pages/Reports/ReportsPage';
 *
 * const routes = [
 *   {
 *     path: '/reports',
 *     component: ReportsPage,
 *     // Add any route-specific configuration
 *   },
 *   // ... other routes
 * ];
 */

/**
 * Builds navigation menu from navigation items
 * @param {Array} navigationItems - Array of navigation items from the backend
 * @param {Array} userRoles - Current user's roles
 * @returns {Array} Filtered and structured navigation menu
 */
export const buildNavigationMenu = (navigationItems, userRoles) => {
  if (!navigationItems || !userRoles) return [];

  // Filter items based on user roles
  const accessibleItems = navigationItems.filter(item => {
    if (!item.rolenavigations || item.rolenavigations.length === 0) return false;

    return item.rolenavigations.some(rn =>
      userRoles.includes(rn.roleId) || userRoles.includes(rn.roleName)
    );
  });

  // Build hierarchical structure
  const rootItems = accessibleItems.filter(item => !item.parentId);

  const buildTree = (parentId) => {
    return accessibleItems
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(item.id)
      }));
  };

  return rootItems.map(item => ({
    ...item,
    children: buildTree(item.id)
  }));
};

/**
 * Validates if a navigation link exists in the application routes
 * @param {string} link - The navigation link to validate
 * @param {Array} routes - Array of defined routes in the application
 * @returns {boolean} True if route exists
 */
export const validateNavigationLink = (link, routes) => {
  return routes.some(route => route.path === link);
};

/**
 * Navigation item structure expected from backend:
 * {
 *   id: number,
 *   page: string,           // Display name
 *   link: string,           // Route path
 *   parentId: number|null,  // Parent navigation item ID
 *   icon: string,           // Font Awesome icon class
 *   rolenavigations: [{     // Roles that can access this item
 *     roleId: string,
 *     roleName: string
 *   }]
 * }
 */

export default {
  buildNavigationMenu,
  validateNavigationLink
};