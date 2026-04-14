/**
 * File: userdatalist.js
 * Purpose: Renders the role user selection grid and keeps selected user IDs in Redux state.
 * Dependencies: react, react-redux, devextreme-react/data-grid
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - UserDataList: Displays users and manages stable multi-select behavior.
 */

import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataGrid,
  Selection,
  Column,
  SearchPanel,
  FilterRow,
  HeaderFilter,
} from "devextreme-react/data-grid";

const UserDataList = () => {
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.role.allUsers);
  const selectedUsers = useSelector((state) => state.role.selectedUsers);

  const normalizedUsers = useMemo(() => {
    if (!Array.isArray(allUsers)) {
      return [];
    }

    return allUsers.map((user) => ({
      ...user,
      id: String(user?.id ?? user?.Id ?? user?.userId ?? ""),
    }));
  }, [allUsers]);

  const normalizedSelectedUsers = useMemo(() => {
    if (!Array.isArray(selectedUsers)) {
      return [];
    }

    return selectedUsers.map((userId) => String(userId));
  }, [selectedUsers]);

  const userIdLookup = useMemo(() => {
    const idLookup = new Map();

    normalizedUsers.forEach((user) => {
      const normalizedId = String(user?.id ?? "");
      const rawId = user?.Id ?? user?.userId ?? user?.id;
      idLookup.set(normalizedId, rawId);
    });

    return idLookup;
  }, [normalizedUsers]);

  const handleSelectionChanged = useCallback(
    ({ selectedRowKeys }) => {
      dispatch({
        type: "SET_SELECTED_USERS",
        payload: selectedRowKeys.map((userId) => {
          const normalizedId = String(userId);
          return userIdLookup.has(normalizedId)
            ? userIdLookup.get(normalizedId)
            : userId;
        }),
      });
    },
    [dispatch, userIdLookup]
  );

  return (
    <div>
      <DataGrid
        dataSource={normalizedUsers}
        showBorders={true}
        showColumnLines={true}
        showRowLines={true}
        allowColumnResizing={true}
        showColumnHeaders={true}
        columnAutoWidth={true}
        hoverStateEnabled={true}
        selectedRowKeys={normalizedSelectedUsers}
        onSelectionChanged={handleSelectionChanged}
        keyExpr="id"
      >
        <Selection mode="multiple" showCheckBoxesMode="always" selectByClick={false} />
        <SearchPanel visible={true} width={260} placeholder="Search users..." highlightCaseSensitive={false} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Column
          dataField="id"
          caption="ID"
          allowEditing={false}
          visible={false}
          defaultSortOrder="asc"
        />
        <Column dataField="userName" caption="Username" allowEditing={false} minWidth={180} />
        <Column dataField="email" caption="Email" allowEditing={false} minWidth={220} />
      </DataGrid>
    </div>
  );
};

export default UserDataList;
