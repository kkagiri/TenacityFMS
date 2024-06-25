import React, { useEffect, useState,useCallback ,useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TreeList, Selection, Column, SearchPanel } from 'devextreme-react/tree-list';

const PermissionTreeListNonEdit = () => {
  const dispatch = useDispatch();
  const allPermissions = useSelector((state) => state.role.allPermissions);
  const selectedPermissions = useSelector((state) => state.role.rolePermissions);
 //const highlightedPermissions = useMemo(() => selectedPermissions, [selectedPermissions]);
   const handleSelectionChanged = ({ selectedRowKeys }) => {
   // console.log('selected perminsion keysKeys:', selectedRowKeys);
    dispatch({ type: 'SET_ROLE_PERMISSIONS', payload: selectedRowKeys });
   };

  return (
    <TreeList
      dataSource={allPermissions}
      parentIdExpr="parentId"
      keyExpr="id"
            // Highlight selected permissions
      selectedRowKeys={selectedPermissions}
      onSelectionChanged={handleSelectionChanged}
      showBorders={true}
      height={'auto'}

    >
      <SearchPanel visible={true} />
      <Selection mode="multiple"  />
      <Column dataField="name" caption="Name" />
    </TreeList>
  );
};

export default PermissionTreeListNonEdit;
