/**
 * File: VehicleDocumentsList.jsx
 * Purpose: Comprehensive vehicle documents management with dashboard tiles and CRUD operations
 * Dependencies: DevExtreme, Redux, vehicleDocumentActions
 * Last Modified: 2025-10-21
 *
 * Key Features:
 * - Dashboard tiles showing document status counts
 * - Add/Edit/Delete document functionality
 * - Mobile-friendly popup form
 * - Tabbed filtering (All, Active, Upcoming, Expired)
 * - Document grid with actions
 */

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getVehicleDocuments,
  createVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument,
} from "../../../redux/actions/vehicleDocumentActions";
import { DataGrid, Column, FilterRow, Pager, Paging, Button as GridButton } from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import { TextBox } from "devextreme-react/text-box";
import { DateBox } from "devextreme-react/date-box";
import { SelectBox } from "devextreme-react/select-box";
import { FileUploader } from "devextreme-react/file-uploader";
import { TextArea } from "devextreme-react/text-area";
import notify from "devextreme/ui/notify";
import "devextreme/dist/css/dx.light.css";

const VehicleDocumentsList = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const { documents, loading, error } = useSelector((state) => state.vehicleDocument);

  // State management
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicleDocumentId: null,
    documentType: "",
    documentNo: "",
    issueDate: null,
    expiryDate: null,
    issuingAuthority: "",
    notes: "",
    file: null,
  });

  // Document types
  const documentTypes = [
    { id: 1, name: "Insurance" },
    { id: 2, name: "Registration" },
    { id: 3, name: "Inspection" },
    { id: 4, name: "Road Tax" },
    { id: 5, name: "Other" },
  ];

  // Fetch documents on mount
  useEffect(() => {
    if (vehicleId) {
      dispatch(getVehicleDocuments(vehicleId));
    }
  }, [dispatch, vehicleId]);

  // Calculate document statistics
  const calculateStats = useCallback(() => {
    if (!documents || documents.length === 0) {
      return {
        total: 0,
        active: 0,
        upcoming: 0,
        expired: 0,
      };
    }

    const today = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(today.getDate() + 30);

    return {
      total: documents.length,
      active: documents.filter((doc) => new Date(doc.expiryDate) > upcomingDate).length,
      upcoming: documents.filter((doc) => {
        const expiry = new Date(doc.expiryDate);
        return expiry >= today && expiry <= upcomingDate;
      }).length,
      expired: documents.filter((doc) => new Date(doc.expiryDate) < today).length,
    };
  }, [documents]);

  const stats = calculateStats();

  // Filter documents based on selected tab
  const filterDocuments = useCallback(
    (status) => {
      if (!documents) return [];

      if (status === "all") {
        return documents;
      }

      const today = new Date();
      const upcomingDate = new Date();
      upcomingDate.setDate(today.getDate() + 30);

      return documents.filter((doc) => {
        const expiryDate = new Date(doc.expiryDate);

        if (status === "expired") {
          return expiryDate < today;
        }
        if (status === "upcoming") {
          return expiryDate >= today && expiryDate <= upcomingDate;
        }
        if (status === "active") {
          return expiryDate > upcomingDate;
        }
        return false;
      });
    },
    [documents]
  );

  // Update filtered documents when tab or documents change
  useEffect(() => {
    setFilteredDocuments(filterDocuments(selectedTab));
  }, [documents, selectedTab, filterDocuments]);

  // Handle tab selection
  const handleTabClick = (status) => {
    setSelectedTab(status);
  };

  // Handle add document
  const handleAddDocument = () => {
    setIsEditMode(false);
    setFormData({
      vehicleDocumentId: null,
      documentType: "",
      documentNo: "",
      issueDate: null,
      expiryDate: null,
      issuingAuthority: "",
      notes: "",
      file: null,
    });
    setIsPopupVisible(true);
  };

  // Handle edit document
  const handleEditDocument = (data) => {
    setIsEditMode(true);
    setFormData({
      vehicleDocumentId: data.vehicleDocumentId,
      documentType: data.documentType,
      documentNo: data.documentNo,
      issueDate: new Date(data.issueDate),
      expiryDate: new Date(data.expiryDate),
      issuingAuthority: data.issuingAuthority || "",
      notes: data.notes || "",
      file: null,
    });
    setIsPopupVisible(true);
  };

  // Handle delete document
  const handleDeleteDocument = async (id) => {
    const result = await dispatch(deleteVehicleDocument(id));
    if (result.isSuccess) {
      notify("Document deleted successfully", "success", 2000);
      dispatch(getVehicleDocuments(vehicleId));
    } else {
      notify(result.message || "Failed to delete document", "error", 2000);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    // Basic validation
    if (
      !formData.documentType ||
      !formData.documentNo ||
      !formData.issueDate ||
      !formData.expiryDate ||
      !formData.issuingAuthority
    ) {
      notify("Please fill all required fields", "warning", 2000);
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append("VehicleId", vehicleId);
    submitFormData.append("DocumentType", formData.documentType);
    submitFormData.append("DocumentNumber", formData.documentNo);
    submitFormData.append("IssueDate", formData.issueDate.toISOString());
    submitFormData.append("ExpiryDate", formData.expiryDate.toISOString());
    submitFormData.append("IssuingAuthority", formData.issuingAuthority);
    submitFormData.append("Notes", formData.notes);

    if (formData.file) {
      submitFormData.append("DocumentFile", formData.file);
    }

    let result;
    if (isEditMode) {
      result = await dispatch(updateVehicleDocument(formData.vehicleDocumentId, submitFormData));
    } else {
      result = await dispatch(createVehicleDocument(submitFormData));
    }

    if (result.isSuccess) {
      notify(`Document ${isEditMode ? "updated" : "created"} successfully`, "success", 2000);
      setIsPopupVisible(false);
      dispatch(getVehicleDocuments(vehicleId));
    } else {
      notify(result.message || `Failed to ${isEditMode ? "update" : "create"} document`, "error", 2000);
    }
  };

  // Render status cell with color coding
  const renderStatusCell = (cellData) => {
    const expiryDate = new Date(cellData.data.expiryDate);
    const today = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(today.getDate() + 30);

    let statusText = "";
    let statusClass = "";

    if (expiryDate < today) {
      statusText = "Expired";
      statusClass = "tw-text-red-600 tw-font-semibold";
    } else if (expiryDate >= today && expiryDate <= upcomingDate) {
      statusText = "Expiring Soon";
      statusClass = "tw-text-yellow-600 tw-font-semibold";
    } else {
      statusText = "Active";
      statusClass = "tw-text-green-600 tw-font-semibold";
    }

    return <span className={statusClass}>{statusText}</span>;
  };

  if (loading && !documents) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
        <div className="tw-text-gray-500">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="tw-p-4 tw-space-y-6">
      {/* Header with Add Button */}
      <div className="tw-flex tw-justify-between tw-items-center tw-flex-wrap tw-gap-4">
        <h2 className="tw-text-xl tw-font-bold tw-text-gray-800">Vehicle Documents</h2>
        <Button
          text="Add Document"
          icon="fa-light fa-plus"
          type="default"
          stylingMode="contained"
          onClick={handleAddDocument}
        />
      </div>

      {/* Dashboard Tiles */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
        {/* Total Documents */}
        <div
          className={`tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-cursor-pointer tw-transition-all hover:tw-shadow-md ${
            selectedTab === "all" ? "tw-ring-2 tw-ring-blue-500" : ""
          }`}
          onClick={() => handleTabClick("all")}
        >
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-gray-600">Total</p>
              <p className="tw-text-3xl tw-font-bold tw-text-blue-600">{stats.total}</p>
            </div>
            <i className="fa-light fa-file-lines tw-text-4xl tw-text-blue-400"></i>
          </div>
        </div>

        {/* Active Documents */}
        <div
          className={`tw-bg-green-50 tw-rounded-lg tw-p-4 tw-cursor-pointer tw-transition-all hover:tw-shadow-md ${
            selectedTab === "active" ? "tw-ring-2 tw-ring-green-500" : ""
          }`}
          onClick={() => handleTabClick("active")}
        >
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-gray-600">Active</p>
              <p className="tw-text-3xl tw-font-bold tw-text-green-600">{stats.active}</p>
            </div>
            <i className="fa-light fa-circle-check tw-text-4xl tw-text-green-400"></i>
          </div>
        </div>

        {/* Upcoming Expiry */}
        <div
          className={`tw-bg-yellow-50 tw-rounded-lg tw-p-4 tw-cursor-pointer tw-transition-all hover:tw-shadow-md ${
            selectedTab === "upcoming" ? "tw-ring-2 tw-ring-yellow-500" : ""
          }`}
          onClick={() => handleTabClick("upcoming")}
        >
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-gray-600">Expiring Soon</p>
              <p className="tw-text-3xl tw-font-bold tw-text-yellow-600">{stats.upcoming}</p>
            </div>
            <i className="fa-light fa-clock tw-text-4xl tw-text-yellow-400"></i>
          </div>
        </div>

        {/* Expired Documents */}
        <div
          className={`tw-bg-red-50 tw-rounded-lg tw-p-4 tw-cursor-pointer tw-transition-all hover:tw-shadow-md ${
            selectedTab === "expired" ? "tw-ring-2 tw-ring-red-500" : ""
          }`}
          onClick={() => handleTabClick("expired")}
        >
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-gray-600">Expired</p>
              <p className="tw-text-3xl tw-font-bold tw-text-red-600">{stats.expired}</p>
            </div>
            <i className="fa-light fa-circle-xmark tw-text-4xl tw-text-red-400"></i>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <DataGrid
          dataSource={filteredDocuments}
          keyExpr="vehicleDocumentId"
          showBorders={true}
          hoverStateEnabled={true}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
        >
          <FilterRow visible={true} />
          <Paging defaultPageSize={10} />
          <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} showInfo={true} />

          <Column dataField="documentType" caption="Document Type" />
          <Column dataField="documentNo" caption="Document No" />
          <Column dataField="issuingAuthority" caption="Issuing Authority" />
          <Column dataField="issueDate" caption="Issue Date" dataType="date" format="dd/MM/yyyy" />
          <Column dataField="expiryDate" caption="Expiry Date" dataType="date" format="dd/MM/yyyy" />
          <Column caption="Status" cellRender={renderStatusCell} alignment="center" />
          <Column type="buttons" width={150} caption="Actions">
            <GridButton
              icon="edit"
              hint="Edit"
              onClick={(e) => handleEditDocument(e.row.data)}
            />
            <GridButton
              icon="trash"
              hint="Delete"
              onClick={(e) => handleDeleteDocument(e.row.data.vehicleDocumentId)}
            />
          </Column>
        </DataGrid>
      </div>

      {/* Add/Edit Document Popup */}
      <Popup
        visible={isPopupVisible}
        onHiding={() => setIsPopupVisible(false)}
        dragEnabled={false}
        showCloseButton={true}
        showTitle={true}
        title={isEditMode ? "Edit Document" : "Add New Document"}
        width="auto"
        height="auto"
        maxWidth={600}
      >
        <div className="tw-p-4 tw-space-y-4">
          {/* Document Type */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Document Type <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              dataSource={documentTypes}
              displayExpr="name"
              valueExpr="name"
              value={formData.documentType}
              onValueChanged={(e) => setFormData({ ...formData, documentType: e.value })}
              placeholder="Select document type"
            />
          </div>

          {/* Document Number */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Document Number <span className="tw-text-red-500">*</span>
            </label>
            <TextBox
              value={formData.documentNo}
              onValueChanged={(e) => setFormData({ ...formData, documentNo: e.value })}
              placeholder="Enter document number"
            />
          </div>

          {/* Issuing Authority */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Issuing Authority <span className="tw-text-red-500">*</span>
            </label>
            <TextBox
              value={formData.issuingAuthority}
              onValueChanged={(e) => setFormData({ ...formData, issuingAuthority: e.value })}
              placeholder="Enter issuing authority"
            />
          </div>

          {/* Issue Date */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Issue Date <span className="tw-text-red-500">*</span>
            </label>
            <DateBox
              value={formData.issueDate}
              onValueChanged={(e) => setFormData({ ...formData, issueDate: e.value })}
              displayFormat="dd/MM/yyyy"
              type="date"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Expiry Date <span className="tw-text-red-500">*</span>
            </label>
            <DateBox
              value={formData.expiryDate}
              onValueChanged={(e) => setFormData({ ...formData, expiryDate: e.value })}
              displayFormat="dd/MM/yyyy"
              type="date"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Notes
            </label>
            <TextArea
              value={formData.notes}
              onValueChanged={(e) => setFormData({ ...formData, notes: e.value })}
              placeholder="Enter any notes"
              height={90}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Upload Document {!isEditMode && <span className="tw-text-red-500">*</span>}
            </label>
            <FileUploader
              selectButtonText="Choose File"
              accept="image/*,.pdf"
              uploadMode="useForm"
              onValueChanged={(e) => setFormData({ ...formData, file: e.value[0] })}
            />
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Accepted formats: Images, PDF (Max 5MB)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="tw-flex tw-gap-3 tw-justify-end tw-pt-4 tw-border-t">
            <Button
              text="Cancel"
              onClick={() => setIsPopupVisible(false)}
              stylingMode="outlined"
            />
            <Button
              text={isEditMode ? "Update" : "Create"}
              type="default"
              stylingMode="contained"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default VehicleDocumentsList;