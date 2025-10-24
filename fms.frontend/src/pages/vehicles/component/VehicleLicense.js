import React, { useState, useEffect, useCallback } from "react";
import { DataGrid } from "devextreme-react/data-grid";
import { Column } from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import { TextBox } from "devextreme-react/text-box";
import { FileUploader } from "devextreme-react/file-uploader";
import notify from "devextreme/ui/notify";
import {
  getVehicleDocuments,
  createVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument,
} from "../../../redux/actions/vehicleDocumentActions";
import { DateBox } from "devextreme-react/date-box";
import { SelectBox } from "devextreme-react/select-box";

const VehicleLicense = ({ vehicleId }) => {
  const [licenseData, setLicenseData] = useState([]);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadLicenseData = useCallback(
    async (forceReload = false) => {
      if ((dataLoaded && !forceReload) || !vehicleId) return;

      setLoading(true);
      try {
        const response = await getVehicleDocuments(vehicleId, 2); // 2 for License
        if (response.isSuccess) {
          setLicenseData(response.data);
          setDataLoaded(true);
        } else {
          notify(
            response.message || "Failed to load license data",
            "error",
            3000
          );
        }
      } catch (error) {
        console.error("Error loading license data:", error);
        notify("Failed to load license data", "error", 3000);
      } finally {
        setLoading(false);
      }
    },
    [vehicleId, dataLoaded]
  );

  useEffect(() => {
    if (vehicleId) {
      loadLicenseData();
    }
  }, [vehicleId, loadLicenseData]);

  const handleAddLicense = () => {
    setEditingLicense({
      documentType: 2, // License
      issueDate: new Date(),
      expiryDate: new Date(),
      vehicleId: vehicleId,
    });
    setShowLicenseForm(true);
  };

  const handleEditLicense = (data) => {
    setEditingLicense({ ...data });
    setShowLicenseForm(true);
  };

  const handleDeleteLicense = async (documentId) => {
    try {
      const response = await deleteVehicleDocument(documentId);
      if (response.isSuccess) {
        notify("License deleted successfully", "success", 3000);
        loadLicenseData(true);
      } else {
        notify(response.message || "Failed to delete license", "error", 3000);
      }
    } catch (error) {
      notify("Failed to delete license", "error", 3000);
    }
  };

  const saveLicense = async (formData) => {
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "documentFile" && formData[key]) {
        data.append(key, formData[key]);
      } else if (key !== "documentFile") {
        data.append(key, formData[key]);
      }
    });

    try {
      let response;
      if (formData.vehicleDocumentId) {
        response = await updateVehicleDocument(
          formData.vehicleDocumentId,
          data
        );
      } else {
        response = await createVehicleDocument(data);
      }

      if (response.isSuccess) {
        notify(
          `License ${
            formData.vehicleDocumentId ? "updated" : "added"
          } successfully`,
          "success",
          3000
        );
        setShowLicenseForm(false);
        setEditingLicense(null);
        loadLicenseData(true);
      } else {
        notify(response.message || "Failed to save license", "error", 3000);
      }
    } catch (error) {
      notify("Failed to save license", "error", 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Valid":
        return "tw-text-green-600 tw-bg-green-50";
      case "Expired":
        return "tw-text-red-600 tw-bg-red-50";
      case "Expires Soon":
        return "tw-text-yellow-600 tw-bg-yellow-50";
      default:
        return "tw-text-gray-600 tw-bg-gray-50";
    }
  };

  const StatusCell = ({ data }) => (
    <span
      className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusColor(
        data.status
      )}`}
    >
      {data.status}
    </span>
  );

  const ActionsCell = ({ data }) => (
    <div className="tw-flex tw-gap-2">
      <Button
        icon="fa-light fa-edit"
        hint="Edit"
        onClick={() => handleEditLicense(data)}
        stylingMode="text"
        type="default"
      />
      <Button
        icon="fa-light fa-trash"
        hint="Delete"
        onClick={() => handleDeleteLicense(data.vehicleDocumentId)}
        stylingMode="text"
        type="danger"
      />
      {data.documentFileUrl && (
        <Button
          icon="fa-light fa-download"
          hint="Download Document"
          onClick={() => window.open(data.documentFileUrl, "_blank")}
          stylingMode="text"
          type="default"
        />
      )}
    </div>
  );

  return (
    <div className="tw-space-y-6">
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-id-card tw-mr-2 tw-text-green-500"></i>
            Licenses & Registrations
          </h3>
          <Button
            text="Add License"
            icon="fa-light fa-plus"
            onClick={handleAddLicense}
            type="default"
            stylingMode="contained"
          />
        </div>

        <DataGrid
          dataSource={licenseData}
          keyExpr="vehicleDocumentId"
          showBorders={true}
          columnAutoWidth={true}
          noDataText="No licenses found"
          loading={loading}
        >
          <Column dataField="issuer" caption="Issuing Authority" />
          <Column dataField="policyNumber" caption="License Number" />
          <Column dataField="issueDate" caption="Issue Date" dataType="date" />
          <Column
            dataField="expiryDate"
            caption="Expiry Date"
            dataType="date"
          />
          <Column dataField="status" caption="Status" cellRender={StatusCell} />
          <Column
            caption="Actions"
            width={120}
            cellRender={(cellData) => <ActionsCell data={cellData.data} />}
          />
        </DataGrid>
      </div>

      <Popup
        visible={showLicenseForm}
        onHiding={() => setShowLicenseForm(false)}
        dragEnabled={false}
        showTitle={true}
        title={
          editingLicense?.vehicleDocumentId ? "Edit License" : "Add License"
        }
        width={"50%"}
        height={"auto"}
        showCloseButton={true}
      >
        <LicenseForm
          data={editingLicense}
          onSave={saveLicense}
          onCancel={() => setShowLicenseForm(false)}
        />
      </Popup>
    </div>
  );
};

const LicenseForm = ({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState(data || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileChange = (e) => {
    if (e.value && e.value.length > 0) {
      setFormData({ ...formData, documentFile: e.value[0] });
    } else {
      setFormData({ ...formData, documentFile: null });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="tw-p-4">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Issuing Authority *
          </label>
          <TextBox
            value={formData.issuer || ""}
            onValueChanged={(e) =>
              setFormData({ ...formData, issuer: e.value })
            }
            placeholder="Enter issuing authority"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            License Number *
          </label>
          <TextBox
            value={formData.policyNumber || ""}
            onValueChanged={(e) =>
              setFormData({ ...formData, policyNumber: e.value })
            }
            placeholder="Enter license number"
          />
        </div>

        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Issue Date
            </label>
            <DateBox
              value={formData.issueDate}
              onValueChanged={(e) =>
                setFormData({ ...formData, issueDate: e.value })
              }
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Expiry Date
            </label>
            <DateBox
              value={formData.expiryDate}
              onValueChanged={(e) =>
                setFormData({ ...formData, expiryDate: e.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Upload Document
          </label>
          <FileUploader
            multiple={false}
            accept=".pdf,.jpg,.png,.doc,.docx"
            uploadMode="useButtons"
            onValueChanged={handleFileChange}
          />
        </div>

        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
          <Button text="Cancel" onClick={onCancel} stylingMode="outlined" />
          <Button
            text="Save"
            type="default"
            stylingMode="contained"
            useSubmitBehavior={true}
          />
        </div>
      </div>
    </form>
  );
};

export default VehicleLicense;
