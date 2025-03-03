//display form for role details
import React from 'react';
import {Form, SimpleItem, GroupItem, Label} from 'devextreme-react/form';



const RoleForm = ({ editData }) => {

  return (
    <Form>
        <GroupItem colCount={2}>
      <SimpleItem label="Name" dataField={editData.name} isRequired={true} />
      <SimpleItem label="Role Description" dataField={editData.description} />
      </GroupItem>
    </Form>


  );
};
 export default RoleForm;