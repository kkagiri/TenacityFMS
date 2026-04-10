/**
 * File: DepartmentCard.js
 * Purpose: M365 card for a single department with user count and action buttons
 * Dependencies: React
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - DepartmentCard(props): Renders m365-dept-card with icon, name, description, user count, actions
 */
import React from 'react';

/**
 * @param {object}   props
 * @param {object}   props.department   - { departmentId, name, description }
 * @param {number}   props.userCount    - Number of active users in this department
 * @param {Function} props.onEdit       - (department) => void
 * @param {Function} props.onDelete     - (department) => void
 * @param {boolean}  props.canManage
 */
const DepartmentCard = ({ department, userCount = 0, onEdit, onDelete, canManage = false }) => {
  const isActive = department?.isActive !== false;

  return (
    <div className={`m365-dept-card${isActive ? '' : ' m365-dept-card--inactive'}`}>
      {/* Icon */}
      <div className="m365-dept-card__icon">
        <i className="fa-light fa-building" />
      </div>

      {/* Body */}
      <div className="m365-dept-card__body">
        <div className="m365-dept-card__heading">
          <p className="m365-dept-card__name">{department.name}</p>
          <span className={`m365-badge ${isActive ? 'm365-badge--success' : 'm365-badge--neutral'}`}>
            <i className={`fa-light ${isActive ? 'fa-circle-check' : 'fa-circle-minus'}`} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        {department.code && (
          <p className="m365-dept-card__meta">Code: {department.code}</p>
        )}
        {department.description && (
          <p className="m365-dept-card__desc">{department.description}</p>
        )}
      </div>

      {/* User count */}
      <span className="m365-dept-card__count">
        <i className="fa-light fa-users" style={{ marginRight: 4 }} />
        {userCount} user{userCount !== 1 ? 's' : ''}
      </span>

      {/* Actions */}
      {canManage && (
        <div className="m365-dept-card__actions">
          <button
            className="m365-icon-btn"
            onClick={() => onEdit?.(department)}
            title="Edit department"
          >
            <i className="fa-light fa-pen" />
          </button>
          <button
            className="m365-icon-btn m365-icon-btn--danger"
            onClick={() => onDelete?.(department)}
            title="Delete department"
            disabled={userCount > 0}
            style={{ opacity: userCount > 0 ? 0.4 : 1, cursor: userCount > 0 ? 'not-allowed' : 'pointer' }}
          >
            <i className="fa-light fa-trash" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DepartmentCard;
