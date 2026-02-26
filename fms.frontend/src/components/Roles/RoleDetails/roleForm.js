/**
 * File: roleForm.js
 * Purpose: Renders the DevExtreme Form for editing role name and description.
 *          Uses a local mutable ref copy of editData to prevent DevExtreme from
 *          directly mutating Redux state (which triggers immutability warnings).
 * Dependencies: devextreme-react/form
 * Last Modified: 2026-02-25
 *
 * Key Components:
 * - RoleForm: Controlled form that isolates DevExtreme mutations from Redux state
 */
import React, { useRef, useEffect } from 'react';
import { Form, Item as FormItem, Label } from 'devextreme-react/form';

const RoleForm = ({ editData, setRoleDetails }) => {
  // DevExtreme Form mutates `formData` directly before firing onFieldDataChanged.
  // Using a local ref copy prevents direct mutation of the Redux state object.
  const localDataRef = useRef({ ...editData });

  // Re-initialize when a different role is loaded (id changes)
  useEffect(() => {
    localDataRef.current = { ...editData };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData?.id]);

  return (
    <Form
      formData={localDataRef.current}
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