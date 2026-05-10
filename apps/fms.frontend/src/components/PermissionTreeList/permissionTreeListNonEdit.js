/**
 * File: permissionTreeListNonEdit.js
 * Purpose: Displays all permissions in a tree structure grouped by module for role assignment.
 *          Uses recursive selection so checking a module auto-checks all child permissions.
 * Dependencies: devextreme-react/tree-list, react-redux, roleActions
 * Last Modified: 2026-02-06
 *
 * Key Components:
 * - PermissionTreeListNonEdit: TreeList with module grouping, recursive multi-select,
 *   search, filter row, and proper scrolling to show all 217 permissions.
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPermissions } from '../../redux/actions/permissionActions';

import {
  TreeList,
  Selection,
  Column,
  SearchPanel,
  FilterRow,
  Scrolling,
  HeaderFilter,
} from 'devextreme-react/tree-list';

const PermissionTreeListNonEdit = () => {
  const dispatch = useDispatch();
  const rolePermissionsRaw = useSelector((state) => state.role.allPermissions);
  const standalonePermissions = useSelector((state) => state.permission.permissions);
  const selectedPermissions = useSelector((state) => state.role.rolePermissions);

  // Use role.allPermissions when inside RoleDetails, fall back to permission.permissions for standalone
  const rawPermissions = rolePermissionsRaw && rolePermissionsRaw.length > 0
    ? rolePermissionsRaw
    : standalonePermissions;

  // Auto-fetch when used standalone (no role selected)
  useEffect(() => {
    if (!rolePermissionsRaw || rolePermissionsRaw.length === 0) {
      dispatch(fetchPermissions());
    }
  }, [dispatch, rolePermissionsRaw]);

  // Sanitize data: fix self-referencing parentId (e.g., ID 1 has ParentId 1 → infinite loop)
  const allPermissions = useMemo(() => {
    if (!rawPermissions) return [];
    return rawPermissions.map((p) =>
      p.parentId === p.id ? { ...p, parentId: null } : p
    );
  }, [rawPermissions]);

  // Determine if a permission is a module (parent) node based on naming convention:
  // Modules don't start with "_" (e.g., "ATG", "TankStockModule", "Vehicle Module")
  // Child permissions start with "_" (e.g., "_Read_Vehicle", "_Create_Tank")
  const isModuleNode = useCallback((name) => {
    return name && !name.startsWith('_');
  }, []);

  // Custom cell render to visually distinguish modules from permissions
  const nameCellRender = useCallback((cellData) => {
    const { data } = cellData;
    if (!data) return cellData.value;

    const isModule = isModuleNode(data.name);

    if (isModule) {
      return (
        <span className="tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-folder-open tw-mr-2 tw-text-blue-500"></i>
          {data.name}
        </span>
      );
    }

    // Format permission name for readability: "_Read_Vehicle" → "Read Vehicle"
    const displayName = data.name
      .replace(/^_/, '')
      .replace(/_/g, ' ');

    return (
      <span className="tw-text-gray-600">
        <i className="fa-light fa-key tw-mr-2 tw-text-gray-400"></i>
        {displayName}
        <span className="tw-text-xs tw-text-gray-400 tw-ml-2">({data.name})</span>
      </span>
    );
  }, [isModuleNode]);

  const handleSelectionChanged = useCallback(({ selectedRowKeys }) => {
    dispatch({ type: 'SET_ROLE_PERMISSIONS', payload: selectedRowKeys });
  }, [dispatch]);

  // Count child permissions per module for the summary column
  const permissionCountMap = useMemo(() => {
    if (!allPermissions) return {};
    const counts = {};
    allPermissions.forEach((p) => {
      if (p.parentId) {
        counts[p.parentId] = (counts[p.parentId] || 0) + 1;
      }
    });
    return counts;
  }, [allPermissions]);

  // Count selected children per module
  const selectedCountMap = useMemo(() => {
    if (!allPermissions || !selectedPermissions) return {};
    const selectedSet = new Set(selectedPermissions);
    const counts = {};
    allPermissions.forEach((p) => {
      if (p.parentId && selectedSet.has(p.id)) {
        counts[p.parentId] = (counts[p.parentId] || 0) + 1;
      }
    });
    return counts;
  }, [allPermissions, selectedPermissions]);

  // Render count column — shows "X / Y" for module rows
  const countCellRender = useCallback((cellData) => {
    const { data } = cellData;
    if (!data) return '';

    const totalChildren = permissionCountMap[data.id];
    if (!totalChildren) return ''; // Not a module or no children

    const selectedChildren = selectedCountMap[data.id] || 0;
    const allSelected = selectedChildren === totalChildren;
    const someSelected = selectedChildren > 0 && !allSelected;

    return (
      <span className={`tw-text-sm tw-font-medium ${allSelected ? 'tw-text-green-600' : someSelected ? 'tw-text-orange-500' : 'tw-text-gray-400'}`}>
        {selectedChildren} / {totalChildren}
      </span>
    );
  }, [permissionCountMap, selectedCountMap]);

  return (
    <TreeList
      dataSource={allPermissions}
      parentIdExpr="parentId"
      keyExpr="id"
      selectedRowKeys={selectedPermissions}
      onSelectionChanged={handleSelectionChanged}
      showBorders={true}
      showRowLines={true}
      autoExpandAll={true}
      height={600}
      columnAutoWidth={true}
      wordWrapEnabled={false}
      className="tw-bg-white"
    >
      <Scrolling mode="standard" />
      <SearchPanel visible={true} width={250} placeholder="Search permissions..." />
      <FilterRow visible={true} />
      <HeaderFilter visible={true} />
      <Selection mode="multiple" recursive={true} allowSelectAll={true} />
      <Column
        dataField="name"
        caption="Permission"
        cellRender={nameCellRender}
        minWidth={300}
      />
      <Column
        caption="Assigned"
        width={100}
        alignment="center"
        cellRender={countCellRender}
        allowFiltering={false}
        allowSorting={false}
      />
    </TreeList>
  );
};

export default PermissionTreeListNonEdit;
