import React, { useState } from "react";
import { Popup, ScrollView } from "devextreme-react";
import { Form, SimpleItem, Label, RequiredRule, GroupItem } from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";
import VehicleSearchableSelector from "../../../components/selectors/VehicleSearchableSelector";
import { extractDocumentData } from "../../../dataservice/vehicleDocumentOcrApi";

const VehicleDocumentForm = ({
  visible,
  onHide,
  onSave,
  documentData,
  vehicles,
}) => {
  const [formData, setFormData] = useState(documentData || {});
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const documentTypes = [
    { id: 0, name: "Insurance" },
    { id: 1, name: "RoadPermit" },
    { id: 2, name: "NTSAInspection" },
  ];

  const handleFieldChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.value && e.value.length > 0 ? e.value[0] : null;
    setFile(selectedFile);
    handleFieldChange('documentFile', selectedFile);
  };

  const handleExtractData = async () => {
    if (!file) {
      notify("Please select a document file first.", "warning", 3000);
      return;
    }
    setExtracting(true);
    try {
      const result = await extractDocumentData(file);
      if (result.isSuccess && result.data) {
        const ocr = result.data;
        const updates = { ...formData };
        if (ocr.certificateNumber) updates.documentNumber = ocr.certificateNumber;
        if (ocr.issuedBy) updates.issuingAuthority = ocr.issuedBy;
        if (ocr.commencingDate) updates.issueDate = new Date(ocr.commencingDate);
        if (ocr.expiryDate) updates.expiryDate = new Date(ocr.expiryDate);
        if (ocr.matchedVehicleId) updates.vehicleId = ocr.matchedVehicleId;
        if (!updates.documentType && updates.documentType !== 0) updates.documentType = 0; // Insurance
        setFormData(updates);
        const confidence = Math.round((ocr.confidenceScore || 0) * 100);
        notify(`Data extracted (${confidence}% confidence). Please verify before saving.`, "success", 4000);
        if (ocr.warnings && ocr.warnings.length > 0) {
          notify(`Warnings: ${ocr.warnings.join(", ")}`, "warning", 5000);
        }
      } else {
        notify(result.message || "Failed to extract document data.", "error", 4000);
      }
    } catch (err) {
      notify(err?.response?.data?.message || "OCR extraction failed.", "error", 4000);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      documentFile: file ? [file] : null,
    };
    onSave(submitData);
  };

  return (
    <Popup
      visible={visible}
      onHiding={onHide}
      dragEnabled={false}
      closeOnOutsideClick={false}
      showTitle={true}
      title={
        documentData?.id ? "Edit Vehicle Document" : "Add Vehicle Document"
      }
      width="95%"
      height="95%"
      maxWidth={800}
      showCloseButton={true}
    >
      <ScrollView width="100%" height="100%">
        <div className="tw-p-4">
          <Form
            formData={formData}
            onFieldDataChanged={(e) => handleFieldChange(e.dataField, e.value)}
            labelLocation="top"
            colCount={1}
          >
            <GroupItem caption="Vehicle Information" colSpan={1}>
              <SimpleItem
                dataField="vehicleId"
                editorType="dxSelectBox"
                render={() => (
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                      Vehicle <span className="tw-text-red-500">*</span>
                    </label>
                    <VehicleSearchableSelector
                      value={formData.vehicleId}
                      onValueChanged={(e) => handleFieldChange('vehicleId', e.value)}
                      placeholder="Search and select vehicle..."
                      width="100%"
                    />
                  </div>
                )}
              />
            </GroupItem>

            <GroupItem caption="Document Details" colSpan={1}>
              <SimpleItem
                dataField="documentType"
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: documentTypes,
                  valueExpr: 'id',
                  displayExpr: 'name',
                  placeholder: 'Select document type',
                }}
              >
                <Label text="Document Type" />
                <RequiredRule message="Document type is required" />
              </SimpleItem>

              <SimpleItem
                dataField="documentNumber"
                editorType="dxTextBox"
                editorOptions={{
                  placeholder: 'Enter document number',
                  maxLength: 100,
                }}
              >
                <Label text="Document Number" />
                <RequiredRule message="Document number is required" />
              </SimpleItem>

              <SimpleItem
                dataField="issuingAuthority"
                editorType="dxTextBox"
                editorOptions={{
                  placeholder: 'Enter issuing authority',
                  maxLength: 200,
                }}
              >
                <Label text="Issuing Authority" />
                <RequiredRule message="Issuing authority is required" />
              </SimpleItem>
            </GroupItem>

            <GroupItem caption="Dates" colSpan={1}>
              <SimpleItem
                dataField="issueDate"
                editorType="dxDateBox"
                editorOptions={{
                  displayFormat: 'dd/MM/yyyy',
                  placeholder: 'Select issue date',
                }}
              >
                <Label text="Issue Date" />
                <RequiredRule message="Issue date is required" />
              </SimpleItem>

              <SimpleItem
                dataField="expiryDate"
                editorType="dxDateBox"
                editorOptions={{
                  displayFormat: 'dd/MM/yyyy',
                  placeholder: 'Select expiry date',
                }}
              >
                <Label text="Expiry Date" />
                <RequiredRule message="Expiry date is required" />
              </SimpleItem>
            </GroupItem>

            <GroupItem caption="Document File" colSpan={1}>
              <SimpleItem
                dataField="documentFile"
                editorType="dxFileUploader"
                editorOptions={{
                  selectButtonText: 'Select Document',
                  labelText: '',
                  accept: 'application/pdf,image/*',
                  uploadMode: 'useForm',
                  onValueChanged: handleFileChange,
                }}
              >
                <Label text="Upload Document" />
                <RequiredRule message="Document file is required" />
              </SimpleItem>
              <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Accepted formats: PDF, Images (JPG, PNG). Max size: 10MB
              </div>
              <div className="tw-mt-3">
                <Button
                  text={extracting ? "Extracting..." : "Extract Data"}
                  icon="fa fa-light fa-wand-magic-sparkles"
                  onClick={handleExtractData}
                  disabled={!file || extracting}
                  stylingMode="outlined"
                  type="default"
                />
                <div className="tw-text-xs tw-text-gray-400 tw-mt-1">
                  Use OCR to auto-fill document fields from the uploaded file
                </div>
              </div>
            </GroupItem>

            <GroupItem caption="Additional Information" colSpan={1}>
              <SimpleItem
                dataField="notes"
                editorType="dxTextArea"
                editorOptions={{
                  height: 100,
                  placeholder: 'Enter any additional notes',
                  maxLength: 1000,
                }}
              >
                <Label text="Notes" />
              </SimpleItem>
            </GroupItem>
          </Form>

          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pb-4 tw-border-t tw-border-gray-200 tw-pt-4">
            <Button
              text="Cancel"
              onClick={onHide}
              stylingMode="outlined"
            />
            <Button
              text="Save Document"
              icon="save"
              onClick={handleSubmit}
              type="success"
              stylingMode="contained"
            />
          </div>
        </div>
      </ScrollView>
    </Popup>
  );
};

export default VehicleDocumentForm;
