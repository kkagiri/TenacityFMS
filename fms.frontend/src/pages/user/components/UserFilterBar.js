/**
 * File: UserFilterBar.js
 * Purpose: M365 flat filter bar for User Management — search, role, department, status, view toggle
 * Dependencies: React, useUserFilters hook, roleOptions/departmentOptions/statusOptions
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserFilterBar(props): Renders filter bar with native M365 controls
 */
import React from 'react';

/**
 * @param {object}   props
 * @param {string}   props.searchText
 * @param {Function} props.setSearchText
 * @param {string}   props.selectedRole
 * @param {Function} props.setSelectedRole
 * @param {string}   props.selectedDepartment
 * @param {Function} props.setSelectedDepartment
 * @param {string}   props.selectedStatus
 * @param {Function} props.setSelectedStatus
 * @param {string}   props.viewMode              - 'list' | 'cards'
 * @param {Function} props.setViewMode
 * @param {Array}    props.roleOptions
 * @param {Array}    props.departmentOptions
 * @param {Array}    props.statusOptions
 * @param {boolean}  props.hasActiveFilters
 * @param {Function} props.handleClearFilters
 */
const UserFilterBar = ({
  searchText,
  setSearchText,
  selectedRole,
  setSelectedRole,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  roleOptions       = [],
  departmentOptions = [],
  statusOptions     = [],
  hasActiveFilters  = false,
  handleClearFilters,
}) => {
  return (
    <div className="m365-filters">
      {/* Search */}
      <div className="m365-search" style={{ minWidth: 220 }}>
        <i className="fa-light fa-magnifying-glass m365-search__icon" />
        <input
          className="m365-search__input"
          placeholder="Search by name or email…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {searchText && (
          <button
            className="m365-icon-btn"
            style={{ position: 'absolute', right: 2, width: 28, height: 28 }}
            onClick={() => setSearchText('')}
            title="Clear search"
          >
            <i className="fa-light fa-xmark" />
          </button>
        )}
      </div>

      {/* Role */}
      <select
        className="m365-select"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        style={{ minWidth: 140 }}
        aria-label="Filter by role"
      >
        {roleOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.text}</option>
        ))}
      </select>

      {/* Department */}
      <select
        className="m365-select"
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
        style={{ minWidth: 160 }}
        aria-label="Filter by department"
      >
        {departmentOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.text}</option>
        ))}
      </select>

      {/* Status */}
      <select
        className="m365-select"
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        style={{ minWidth: 120 }}
        aria-label="Filter by status"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.text}</option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button className="m365-btn m365-btn--text" onClick={handleClearFilters} title="Clear all filters">
          <i className="fa-light fa-filter-slash" />
          Clear
        </button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* View toggle */}
      <div className="m365-btn-group" role="group" aria-label="View mode">
        <button
          className={`m365-btn-group__item${viewMode === 'list' ? ' m365-btn-group__item--active' : ''}`}
          onClick={() => setViewMode('list')}
          title="List view"
        >
          <i className="fa-light fa-list" />
          <span style={{ marginLeft: 4 }}>List</span>
        </button>
        <button
          className={`m365-btn-group__item${viewMode === 'cards' ? ' m365-btn-group__item--active' : ''}`}
          onClick={() => setViewMode('cards')}
          title="Card view"
        >
          <i className="fa-light fa-table-cells" />
          <span style={{ marginLeft: 4 }}>Cards</span>
        </button>
      </div>
    </div>
  );
};

export default UserFilterBar;
