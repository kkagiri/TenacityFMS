/**
 * File: EmployeeDocumentsWorkspace.jsx
 * Purpose: Employee document workspace for managing licenses and compliance records.
 * Dependencies: React, axiosInstance, DevExtreme DataGrid, SlidePanel form.
 * Last Modified: 2026-03-25
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, { Column, Paging, Pager } from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../../api/axiosInstance";
import EmployeeDocumentFormPanel from "./EmployeeDocumentFormPanel";
import {
  EMPTY_EMPLOYEE_DOCUMENT_FORM_STATE,
  formatDisplayDate,
  getStatusDescriptor,
  normalizeEmployeeDocument,
  toDateInputValue,
} from "./EmployeeDocuments.shared";
import "./EmployeeDocumentsWorkspace.scss";

const unwrapPayload = (payload) => payload?.data ?? payload?.Data ?? payload;

const EmployeeDocumentsWorkspace = ({ employeeId, employee }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [formState, setFormState] = useState(EMPTY_EMPLOYEE_DOCUMENT_FORM_STATE);

  const loadDocuments = useCallback(async () => {
    if (!employeeId) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/employee/${employeeId}/documents`);
      const payload = unwrapPayload(response.data);
      const items = Array.isArray(payload) ? payload : [];
      setDocuments(items.map(normalizeEmployeeDocument));
    } catch (error) {
      setDocuments([]);
      notify(error?.response?.data?.message || "Failed to load employee documents.", "error", 3200);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const stats = useMemo(() => {
    const totals = {
      total: documents.length,
      valid: 0,
      expiring: 0,
      expired: 0,
    };

    documents.forEach((document) => {
      const descriptor = getStatusDescriptor(document.status, document.expiryDate);
      if (descriptor.key === "expired") totals.expired += 1;
      else if (descriptor.key === "expiring") totals.expiring += 1;
      else totals.valid += 1;
    });

    return totals;
  }, [documents]);

  const openCreatePanel = useCallback(() => {
    setFormState({
      ...EMPTY_EMPLOYEE_DOCUMENT_FORM_STATE,
      issueDate: toDateInputValue(new Date()),
    });
    setPanelOpen(true);
  }, []);

  const openEditPanel = useCallback((document) => {
    setFormState({
      id: document.id,
      documentType: String(document.documentType),
      documentNumber: document.documentNumber,
      issueDate: toDateInputValue(document.issueDate),
      expiryDate: toDateInputValue(document.expiryDate),
      alertLeadDays: document.alertLeadDays,
      issuingAuthority: document.issuingAuthority,
      notes: document.notes,
      file: null,
    });
    setPanelOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (document) => {
      if (!window.confirm(`Delete ${document.documentTypeName} document ${document.documentNumber}?`)) {
        return;
      }

      try {
        const response = await axiosInstance.delete(`/employee/${employeeId}/documents/${document.id}`);
        const payload = response.data;
        const success = payload?.success ?? payload?.Success ?? true;

        if (!success) {
          throw new Error(payload?.message || payload?.Message || "Failed to delete document.");
        }

        notify("Employee document deleted.", "success", 2600);
        await loadDocuments();
      } catch (error) {
        notify(error?.message || error?.response?.data?.message || "Failed to delete employee document.", "error", 3200);
      }
    },
    [employeeId, loadDocuments]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!formState.documentType || !formState.documentNumber.trim() || !formState.issueDate || !formState.expiryDate) {
        notify("Document type, number, issue date, and expiry date are required.", "warning", 2800);
        return;
      }

      if (!formState.id && !formState.file) {
        notify("Please attach a file for the new document.", "warning", 2800);
        return;
      }

      const payload = new FormData();
      payload.append("DocumentType", String(formState.documentType));
      payload.append("DocumentNumber", formState.documentNumber.trim());
      payload.append("IssueDate", formState.issueDate);
      payload.append("ExpiryDate", formState.expiryDate);
      payload.append("AlertLeadDays", String(formState.alertLeadDays || 30));
      payload.append("IssuingAuthority", formState.issuingAuthority || "");
      payload.append("Notes", formState.notes || "");
      if (formState.file) {
        payload.append("DocumentFile", formState.file);
      }
      if (formState.id) {
        payload.append("Id", formState.id);
      }

      setSaving(true);
      try {
        const response = formState.id
          ? await axiosInstance.put(`/employee/${employeeId}/documents/${formState.id}`, payload, { headers: { "Content-Type": "multipart/form-data" } })
          : await axiosInstance.post(`/employee/${employeeId}/documents`, payload, { headers: { "Content-Type": "multipart/form-data" } });

        const result = response.data;
        const success = result?.success ?? result?.Success ?? true;
        if (!success) {
          throw new Error(result?.message || result?.Message || "Failed to save employee document.");
        }

        notify(formState.id ? "Employee document updated." : "Employee document created.", "success", 2600);
        setPanelOpen(false);
        setFormState(EMPTY_EMPLOYEE_DOCUMENT_FORM_STATE);
        await loadDocuments();
      } catch (error) {
        notify(error?.message || error?.response?.data?.message || "Failed to save employee document.", "error", 3200);
      } finally {
        setSaving(false);
      }
    },
    [employeeId, formState, loadDocuments]
  );

  return (
    <div className="employee-documents-workspace">
      <div className="employee-documents-workspace__header">
        <div>
          <span className="employee-documents-workspace__eyebrow">Employee compliance</span>
          <h3>Documents for {employee?.fullName || "employee"}</h3>
          <p>Keep driving licenses and supporting employee compliance files attached to the employee profile.</p>
        </div>
        <button className="employee-documents-workspace__button employee-documents-workspace__button--primary" onClick={openCreatePanel}>
          <i className="fa-light fa-plus" /> Add document
        </button>
      </div>

      <div className="employee-documents-workspace__stats">
        <div className="employee-documents-workspace__stat-card">
          <span className="employee-documents-workspace__stat-value">{stats.total}</span>
          <span className="employee-documents-workspace__stat-label">Total documents</span>
        </div>
        <div className="employee-documents-workspace__stat-card">
          <span className="employee-documents-workspace__stat-value">{stats.valid}</span>
          <span className="employee-documents-workspace__stat-label">Valid</span>
        </div>
        <div className="employee-documents-workspace__stat-card">
          <span className="employee-documents-workspace__stat-value">{stats.expiring}</span>
          <span className="employee-documents-workspace__stat-label">Due soon</span>
        </div>
        <div className="employee-documents-workspace__stat-card">
          <span className="employee-documents-workspace__stat-value">{stats.expired}</span>
          <span className="employee-documents-workspace__stat-label">Expired</span>
        </div>
      </div>

      <div className="employee-documents-workspace__grid-shell">
        <DataGrid
          className="employee-documents-workspace__grid"
          dataSource={documents}
          keyExpr="id"
          showBorders={false}
          showColumnLines={false}
          showRowLines={true}
          rowAlternationEnabled={false}
          columnAutoWidth={true}
          noDataText={loading ? "Loading documents..." : "No employee documents found."}
        >
          <Column dataField="documentTypeName" caption="Type" minWidth={140} />
          <Column dataField="documentNumber" caption="Number" minWidth={140} />
          <Column caption="Issue date" minWidth={110} cellRender={({ data }) => formatDisplayDate(data.issueDate)} />
          <Column caption="Expiry date" minWidth={110} cellRender={({ data }) => formatDisplayDate(data.expiryDate)} />
          <Column dataField="alertLeadDays" caption="Alert days" width={95} alignment="center" />
          <Column caption="Status" width={110} alignment="center" cellRender={({ data }) => {
            const descriptor = getStatusDescriptor(data.status, data.expiryDate);
            return <span className={`m365-badge m365-badge--${descriptor.tone}`}>{descriptor.label}</span>;
          }} />
          <Column caption="File" width={120} alignment="center" cellRender={({ data }) => (
            data.documentFileUrl ? (
              <button type="button" className="employee-documents-workspace__action-link" onClick={() => window.open(data.documentFileUrl, "_blank", "noopener,noreferrer")}>Open</button>
            ) : <span className="employee-documents-workspace__muted">No file</span>
          )} />
          <Column caption="Actions" width={140} alignment="center" cellRender={({ data }) => (
            <div className="employee-documents-workspace__actions">
              <button type="button" className="employee-documents-workspace__action-link" onClick={() => openEditPanel(data)}>Edit</button>
              <button type="button" className="employee-documents-workspace__action-link employee-documents-workspace__action-link--danger" onClick={() => handleDelete(data)}>Delete</button>
            </div>
          )} />
          <Paging defaultPageSize={10} />
          <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 40]} showInfo={true} />
        </DataGrid>
      </div>

      <EmployeeDocumentFormPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={saving}
        formState={formState}
        setFormState={setFormState}
        employee={employee}
      />
    </div>
  );
};

export default EmployeeDocumentsWorkspace;