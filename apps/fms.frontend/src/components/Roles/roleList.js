//this should display list of role and pass rolename and roleID selection to parent component

/**
 * File: roleList.js
 * Purpose: Render the role directory list with search and user counts
 * Dependencies: react, DevExtreme List
 * Last Modified: 2026-04-13
 *
 * Key Functions:
 * - RoleList(): Displays roles with selection, search, and user totals
 */
import React from 'react';
import { List } from 'devextreme-react/list';

const RoleList = ({ roles, onRoleSelect, roleUserCounts = {}, countsLoading = false, selectedRoleId = null }) => {
    const renderRoleItem = (role) => {
        const count = roleUserCounts[role.id];
        const isSelected = selectedRoleId === role.id;
        const showCountLoading = countsLoading && count === undefined;

        return (
            <div className={`role-list-item${isSelected ? ' role-list-item--selected' : ''}`}>
                <div className="role-list-item__main">
                    <span className="role-list-item__name">{role.name}</span>
                    {role.description && (
                        <span className="role-list-item__description">{role.description}</span>
                    )}
                </div>
                <div className="role-list-item__meta">
                    <span className="role-list-item__count">
                        {showCountLoading ? 'Loading users...' : `${count ?? 0} user${count === 1 ? '' : 's'}`}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <List
            dataSource={roles}
            selectionMode="single"
            searchEnabled={true}
            searchExpr={["name", "description"]}
            itemRender={renderRoleItem}
            onSelectionChanged={(e) => {
                if (e.addedItems.length > 0) {
                    onRoleSelect(e.addedItems[0]);
                }
            }}
        />
    );
};

export default RoleList;