import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataGrid,
  Selection,
  Column,
  SearchPanel,
} from "devextreme-react/data-grid";

const UserDataList = () => {
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.role.allUsers);
  const selectedUsers = useSelector((state) => state.role.selectedUsers);

  // Debug: Log the data to verify
  console.log("allUsers:", allUsers);
  console.log("selectedUsers:", selectedUsers);

  const handleSelectionChanged = useCallback(
    ({ selectedRowKeys }) => {
      console.log("selectedRowKeys from DataGrid:", selectedRowKeys); // Debug
      dispatch({ type: "SET_SELECTED_USERS", payload: selectedRowKeys });
    },
    [dispatch]
  );

  return (
    <div>
      <DataGrid
        dataSource={allUsers}
        showBorders={true}
        showColumnLines={true}
        showRowLines={true}
        allowColumnResizing={true}
        showColumnHeaders={true}
        selectedRowKeys={selectedUsers}
        onSelectionChanged={handleSelectionChanged}
        keyExpr="id"
      >
        <Selection mode="multiple" />
        <SearchPanel showSearchButton={true} />
        <Column
          dataField="id"
          caption="ID"
          allowEditing={false}
          visible={false}
          defaultSortOrder="asc"
        />
        <Column dataField="userName" caption="Username" allowEditing={false} />
        <Column dataField="email" caption="Email" allowEditing={false} />
      </DataGrid>
    </div>
  );
};

export default UserDataList;
