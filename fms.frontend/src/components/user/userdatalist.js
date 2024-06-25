import React, { useCallback,useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Selection, Column, SearchPanel } from 'devextreme-react/data-grid';

const UserDataList = () => {
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.role.allUsers);
  const selectedUsers = useSelector((state) => state.role.users);

  const handleSelectionChanged = useCallback(({ selectedRowKeys }) => {
    dispatch({ type: 'SET_SELECTED_USERS', payload: selectedRowKeys });
  }, [allUsers, selectedUsers, dispatch]);

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
      >
        <Selection mode="multiple" />
        <SearchPanel showSearchButton={true} />
        <Column dataField="id" caption="ID" allowEditing={false} visible={false} defaultSortOrder="asc" />
        <Column dataField="userName" caption="Username" allowEditing={false} />
        <Column dataField="email" caption="Email" allowEditing={false} />
      </DataGrid>
    </div>
  );
};

export default UserDataList;
