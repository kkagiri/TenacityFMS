import React from "react";
import {
  Popup,
  Form,
  TextBox,
  DateBox,
  SelectBox,
  Button,
  FileUploader,
} from "devextreme-react";
import { RequiredRule } from "devextreme-react/form";

const VehicleDocumentForm = ({
  visible,
  onHide,
  onSave,
  documentData,
  vehicles,
}) => {
  const documentTypes = [
    { id: 1, name: "Insurance" },
    { id: 2, name: "RoadPermit" },
    { id: 3, name: "NTSAInspection" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(documentData);
  };

  return (
    <Popup
      visible={visible}
      onHiding={onHide}
      dragEnabled={false}
      closeOnOutsideClick={true}
      showTitle={true}
      title={
        documentData?.id ? "Edit Vehicle Document" : "Add Vehicle Document"
      }
      width={600}
      height="auto"
    >
      <form onSubmit={handleSubmit}>
        <Form formData={documentData}>
          <SelectBox
            dataSource={vehicles}
            valueExpr="id"
            displayExpr="registrationNumber"
            name="vehicleId"
            label="Vehicle"
            searchEnabled={true}
          >
            <RequiredRule message="Vehicle is required" />
          </SelectBox>

          <SelectBox
            dataSource={documentTypes}
            valueExpr="id"
            displayExpr="name"
            name="documentType"
            label="Document Type"
          >
            <RequiredRule message="Document type is required" />
          </SelectBox>

          <TextBox name="documentNumber" label="Document Number">
            <RequiredRule message="Document number is required" />
          </TextBox>

          <DateBox name="issueDate" label="Issue Date" type="date">
            <RequiredRule message="Issue date is required" />
          </DateBox>

          <DateBox name="expiryDate" label="Expiry Date" type="date">
            <RequiredRule message="Expiry date is required" />
          </DateBox>

          <TextBox name="issuingAuthority" label="Issuing Authority" />

          <FileUploader
            selectButtonText="Select document"
            labelText=""
            accept="application/pdf,image/*"
            uploadMode="useForm"
            name="documentFile"
          />

          <TextBox name="notes" label="Notes" />

          <Button
            text="Save"
            type="success"
            useSubmitBehavior={true}
            className="tw-mt-4"
          />
        </Form>
      </form>
    </Popup>
  );
};

export default VehicleDocumentForm;
