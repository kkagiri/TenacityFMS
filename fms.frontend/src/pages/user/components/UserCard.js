/**
 * File: UserCard.js
 * Purpose: M365-styled card for a single user in the card grid view
 * Dependencies: React, UserAvatar, UserStatusBadge, UserRoleBadgeList
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserCard(props): Renders m365-user-card with avatar, name, email, role, dept, status badges + actions
 */
import React from 'react';
import UserAvatar from './UserAvatar';
import UserStatusBadge from './UserStatusBadge';
import { UserRoleBadgeList } from './UserRoleBadge';

/**
 * @param {object}   props
 * @param {object}   props.user
 * @param {Function} props.onViewDetails    - (userId) => void
 * @param {Function} props.onEditUser       - (user) => void
 * @param {Function} props.onManageSites    - (user) => void
 * @param {boolean}  props.canManageUsers
 */
const UserCard = ({ user, onViewDetails, onEditUser, onManageSites, canManageUsers = false }) => {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName;

  return (
    <div
      className={`m365-user-card${user.isDeleted ? ' m365-user-card--inactive' : ''}`}
      onClick={() => onViewDetails?.(user.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onViewDetails?.(user.id)}
      aria-label={`View details for ${displayName}`}
    >
      {/* Header row: avatar + name/email + status */}
      <div className="m365-user-card__header">
        <UserAvatar user={user} size={36} />
        <div className="m365-user-card__info">
          <p className="m365-user-card__name">{displayName}</p>
          <p className="m365-user-card__email">{user.email}</p>
        </div>
        <UserStatusBadge isDeleted={user.isDeleted} showIcon={false} />
      </div>

      {/* Meta: role + department */}
      <div className="m365-user-card__meta">
        <UserRoleBadgeList roles={user.roleNames} maxVisible={2} />
        {user.departmentDisplay && user.departmentDisplay !== 'Unassigned' && (
          <span className="m365-badge m365-badge--neutral">
            <i className="fa-light fa-building" />
            {user.departmentDisplay}
          </span>
        )}
      </div>

      {/* Footer actions */}
      {canManageUsers && (
        <div
          className="m365-user-card__footer"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="m365-icon-btn"
            onClick={() => onEditUser?.(user)}
            title="Edit user"
          >
            <i className="fa-light fa-pen" />
          </button>
          <button
            className="m365-icon-btn"
            onClick={() => onManageSites?.(user)}
            title="Manage sites"
          >
            <i className="fa-light fa-map-location-dot" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserCard;
