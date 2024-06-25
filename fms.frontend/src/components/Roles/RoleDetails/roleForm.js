import React from 'react';
import { Form, Item as FormItem, Label } from 'devextreme-react/form';

const RoleForm = ({ editData, setRoleDetails }) => {


  return (
    <Form
      formData={editData}
      labelMode='outside'
      onFieldDataChanged={setRoleDetails}
    >
      <FormItem dataField='name' isRequired={true}>
        <Label>Name</Label>
      </FormItem>
      <FormItem dataField='description' editorType='dxTextArea'>
        <Label>Description</Label>
      </FormItem>
    </Form>
  );
};

export default RoleForm;