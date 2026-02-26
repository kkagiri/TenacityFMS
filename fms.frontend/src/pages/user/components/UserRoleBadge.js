/**
 * File: UserRoleBadge.js
 * Purpose: M365-styled badge displaying a user's role name
 * Dependencies: React
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserRoleBadge(props): Renders m365-badge--primary chip for a role
 * - UserRoleBadgeList(props): Renders up to maxVisible badges + overflow count
 */
import React from 'react';

/**
 * Single role badge.
 * @param {object} props
 * @param {string} props.role  - Role name string
 */
export const UserRoleBadge = ({ role }) => {
  if (!role) return null;

  return (
    <span className="m365-badge m365-badge--primary" title={role}>
      <i className="fa-light fa-shield-halved" />
      {role}
    </span>
  );
};

/**
 * Renders up to `maxVisible` role badges with a "+N more" overflow indicator.
 * @param {object} props
 * @param {string[]} props.roles       - Array of role name strings
 * @param {number}  [props.maxVisible=2] - Maximum badges shown before overflow
 */
export const UserRoleBadgeList = ({ roles = [], maxVisible = 2 }) => {
  if (!roles || roles.length === 0) {
    return (
      <span className="m365-badge m365-badge--neutral">
        <i className="fa-light fa-ban" />
        Unassigned
      </span>
    );
  }

  const visible   = roles.slice(0, maxVisible);
  const overflow  = roles.length - maxVisible;

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
      {visible.map((role) => (
        <UserRoleBadge key={role} role={role} />
      ))}
      {overflow > 0 && (
        <span
          className="m365-badge m365-badge--neutral"
          title={roles.slice(maxVisible).join(', ')}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
};

export default UserRoleBadge;
