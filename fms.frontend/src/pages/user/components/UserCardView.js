/**
 * File: UserCardView.js
 * Purpose: Responsive card grid view for User Management listing
 * Dependencies: React, UserCard
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserCardView(props): Renders responsive 1/2/3-col grid of UserCard items
 */
import React from 'react';
import UserCard from './UserCard';

/**
 * @param {object}   props
 * @param {Array}    props.users
 * @param {Function} props.onViewDetails
 * @param {Function} props.onEditUser
 * @param {Function} props.onManageSites
 * @param {boolean}  props.canManageUsers
 */
const UserCardView = ({ users = [], onViewDetails, onEditUser, onManageSites, canManageUsers = false }) => {
  if (users.length === 0) {
    return (
      <div className="m365-empty">
        <i className="fa-light fa-users m365-empty__icon" />
        <p className="m365-empty__title">No users found</p>
        <p className="m365-empty__subtitle">Adjust your filters to see more users.</p>
      </div>
    );
  }

  return (
    <div className="m365-card-grid">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onViewDetails={onViewDetails}
          onEditUser={onEditUser}
          onManageSites={onManageSites}
          canManageUsers={canManageUsers}
        />
      ))}
    </div>
  );
};

export default UserCardView;
