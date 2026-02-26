/**
 * File: UserListView.js
 * Purpose: M365-styled DataGrid list view for User Management
 * Dependencies: React, DevExtreme DataGrid, UserAvatar, UserStatusBadge, UserRoleBadgeList
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserListView(props): DataGrid with avatar+name, email, role badge, dept badge, status badge, actions
 */
import React, { useCallback } from 'react';
import DataGrid, {
  Column,
  Paging,
  Pager,
  Selection,
} from 'devextreme-react/data-grid';
import UserAvatar from './UserAvatar';
import UserStatusBadge from './UserStatusBadge';
import { UserRoleBadgeList } from './UserRoleBadge';

/**
 * @param {object}   props
 * @param {Array}    props.users           - Normalized users (from useUserNormalization)
 * @param {boolean}  props.loading
 * @param {Function} props.onViewDetails   - (userId) => void
 * @param {Function} props.onEditUser      - (user) => void
 * @param {Function} props.onManageSites   - (user) => void
 * @param {boolean}  props.canManageUsers
 */
const UserListView = ({
  users      = [],
  loading    = false,
  onViewDetails,
  onEditUser,
  onManageSites,
  canManageUsers = false,
}) => {
  // ── Cell renders ──────────────────────────────────────────────────────────

  const renderNameCell = useCallback((data) => {
    const user = data.data;
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserAvatar user={user} size={28} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#201f1e', lineHeight: 1.2 }}>
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: '#605e5c', lineHeight: 1.2 }}>
            @{user.userName}
          </div>
        </div>
      </div>
    );
  }, []);

  const renderRoleCell = useCallback((data) => (
    <UserRoleBadgeList roles={data.data.roleNames} maxVisible={2} />
  ), []);

  const renderDeptCell = useCallback((data) => {
    const dept = data.data.departmentDisplay;
    if (!dept || dept === 'Unassigned') {
      return <span style={{ fontSize: 12, color: '#a19f9d' }}>—</span>;
    }
    return (
      <span className="m365-badge m365-badge--neutral">
        <i className="fa-light fa-building" />
        {dept}
      </span>
    );
  }, []);

  const renderStatusCell = useCallback((data) => (
    <UserStatusBadge isDeleted={data.data.isDeleted} />
  ), []);

  const renderActionCell = useCallback((data) => {
    const user = data.data;
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          className="m365-icon-btn"
          onClick={() => onViewDetails?.(user.id)}
          title="View details"
        >
          <i className="fa-light fa-eye" />
        </button>
        {canManageUsers && (
          <button
            className="m365-icon-btn"
            onClick={() => onEditUser?.(user)}
            title="Edit user"
          >
            <i className="fa-light fa-pen" />
          </button>
        )}
        {canManageUsers && (
          <button
            className="m365-icon-btn"
            onClick={() => onManageSites?.(user)}
            title="Manage sites"
          >
            <i className="fa-light fa-map-location-dot" />
          </button>
        )}
      </div>
    );
  }, [canManageUsers, onViewDetails, onEditUser, onManageSites]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="m365-datagrid-wrap">
      <DataGrid
        dataSource={users}
        keyExpr="id"
        showBorders={false}
        showColumnLines={false}
        showRowLines={false}
        columnAutoWidth={false}
        wordWrapEnabled={false}
        rowAlternationEnabled={false}
        hoverStateEnabled={true}
        loadPanel={{ enabled: loading }}
        noDataText="No users match the selected filters."
        onRowClick={(e) => onViewDetails?.(e.data.id)}
      >
        <Selection mode="single" />
        <Paging defaultPageSize={20} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[10, 20, 50, 100]}
          showInfo={true}
          displayMode="compact"
        />

        <Column
          caption="User"
          cellRender={renderNameCell}
          width={220}
          allowSorting={true}
          dataField="userName"
        />
        <Column
          dataField="email"
          caption="Email"
          minWidth={160}
        />
        <Column
          caption="Role"
          cellRender={renderRoleCell}
          width={180}
          allowSorting={false}
        />
        <Column
          caption="Department"
          cellRender={renderDeptCell}
          width={160}
          dataField="departmentDisplay"
          allowSorting={true}
        />
        <Column
          caption="Status"
          cellRender={renderStatusCell}
          width={100}
          dataField="isDeleted"
          allowSorting={true}
        />
        <Column
          type="buttons"
          caption=""
          cellRender={renderActionCell}
          width={canManageUsers ? 110 : 50}
          allowSorting={false}
        />
      </DataGrid>
    </div>
  );
};

export default UserListView;
