/**
 * File: UserStatusBadge.js
 * Purpose: M365-styled badge showing user Active/Inactive status
 * Dependencies: React
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserStatusBadge(props): Renders m365-badge--success or m365-badge--error chip
 */
import React from 'react';

/**
 * @param {object} props
 * @param {boolean} props.isDeleted  - True → Inactive, False → Active
 * @param {boolean} [props.showIcon=true]
 */
const UserStatusBadge = ({ isDeleted, showIcon = true }) => {
  const isActive = !isDeleted;
  const variant  = isActive ? 'success' : 'error';
  const label    = isActive ? 'Active' : 'Inactive';
  const icon     = isActive ? 'fa-light fa-circle-check' : 'fa-light fa-circle-xmark';

  return (
    <span className={`m365-badge m365-badge--${variant}`}>
      {showIcon && <i className={icon} />}
      {label}
    </span>
  );
};

export default UserStatusBadge;
