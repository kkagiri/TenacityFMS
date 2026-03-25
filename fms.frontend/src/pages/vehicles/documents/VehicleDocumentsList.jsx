/**
 * File: VehicleDocumentsList.jsx
 * Purpose: Container page for vehicle compliance documents, bulk assignment workflows, and reporting widgets.
 * Dependencies: React, Redux actions, page subcomponents.
 * Last Modified: 2026-03-25
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchVehicleTypes } from "../../../redux/actions/vehicleTypeActions";
import {
  bulkCreateVehicleComplianceRequirements,
  createVehicleDocument,
  deleteVehicleDocument,
  getVehicleComplianceDashboard,
  getVehicleComplianceRequirements,
  getVehicleDocuments,
  updateVehicleDocument,
} from "../../../redux/actions/vehicleDocumentActions";
import VehicleComplianceBulkPanel from "./components/VehicleComplianceBulkPanel";
import VehicleComplianceWidgets from "./components/VehicleComplianceWidgets";
import VehicleDocumentFormPanel from "./components/VehicleDocumentFormPanel";
import VehicleDocumentsFilterBar from "./components/VehicleDocumentsFilterBar";
import VehicleDocumentsGrid from "./components/VehicleDocumentsGrid";
import VehicleDocumentsSummaryCards from "./components/VehicleDocumentsSummaryCards";
import {
  EMPTY_DOCUMENT_FORM_STATE,
  EMPTY_REQUIREMENT_FORM_STATE,
  getStatusDescriptor,
  normalizeDocument,
  normalizeRequirement,
  normalizeSite,
  normalizeVehicle,
  normalizeVehicleType,
  toDateInputValue,
} from "./VehicleDocuments.shared";
import "./VehicleDocumentsList.scss";

const VehicleDocumentsList = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const fixedVehicleId = Number(vehicleId) > 0 ? Number(vehicleId) : null;

  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [sites, setSites] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(fixedVehicleId || "all");
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState("all");
  const [selectedComplianceCategory, setSelectedComplianceCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [documentPanelOpen, setDocumentPanelOpen] = useState(false);
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [documentFormState, setDocumentFormState] = useState({ ...EMPTY_DOCUMENT_FORM_STATE, vehicleId: fixedVehicleId || "" });
  const [requirementFormState, setRequirementFormState] = useState({ ...EMPTY_REQUIREMENT_FORM_STATE });

  const vehicleLookup = useMemo(
    () => Object.fromEntries(vehicles.map((vehicle) => [vehicle.vehicleId, vehicle])),
    [vehicles]
  );
  const siteLookup = useMemo(
    () => Object.fromEntries(sites.map((site) => [site.siteId, site])),
    [sites]
  );
  const vehicleTypeLookup = useMemo(
    () => Object.fromEntries(vehicleTypes.map((vehicleType) => [vehicleType.vehicleTypeId, vehicleType])),
    [vehicleTypes]
  );

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const response = await dispatch(getVehicleDocuments(fixedVehicleId || undefined));
      setDocuments(Array.isArray(response?.data) ? response.data.map(normalizeDocument) : []);
    } finally {
      setLoadingDocuments(false);
    }
  }, [dispatch, fixedVehicleId]);

  const loadLookups = useCallback(async () => {
    setLoadingLookups(true);
    try {
      const [vehicleResult, siteResult, vehicleTypeResult] = await Promise.all([
        dispatch(fetchVehicleList()),
        dispatch(fetchSiteList()),
        dispatch(fetchVehicleTypes()),
      ]);

      setVehicles(Array.isArray(vehicleResult) ? vehicleResult.map(normalizeVehicle) : []);
      setSites(siteResult?.success && Array.isArray(siteResult.data) ? siteResult.data.map(normalizeSite) : []);
      setVehicleTypes(vehicleTypeResult?.success && Array.isArray(vehicleTypeResult.data) ? vehicleTypeResult.data.map(normalizeVehicleType) : []);
    } catch (error) {
      notify(error?.message || "Failed to load vehicle document lookups", "error", 3000);
    } finally {
      setLoadingLookups(false);
    }
  }, [dispatch]);

  const loadCompliance = useCallback(async () => {
    if (fixedVehicleId) {
      return;
    }

    const [requirementsResponse, dashboardResponse] = await Promise.all([
      dispatch(getVehicleComplianceRequirements()),
      dispatch(getVehicleComplianceDashboard()),
    ]);

    setRequirements(Array.isArray(requirementsResponse?.data) ? requirementsResponse.data.map(normalizeRequirement) : []);
    setDashboard(dashboardResponse?.data || null);
  }, [dispatch, fixedVehicleId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadDocuments(), loadCompliance()]);
  }, [loadCompliance, loadDocuments]);

  useEffect(() => {
    setSelectedVehicleId(fixedVehicleId || "all");
    setDocumentFormState((currentState) => ({ ...currentState, vehicleId: fixedVehicleId || currentState.vehicleId }));
  }, [fixedVehicleId]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const enrichedDocuments = useMemo(
    () => documents.map((document) => {
      const vehicle = vehicleLookup[document.vehicleId];
      const site = vehicle?.workingSiteId ? siteLookup[vehicle.workingSiteId] : null;
      const vehicleType = vehicle?.vehicleTypeId ? vehicleTypeLookup[vehicle.vehicleTypeId] : null;
      const statusDescriptor = getStatusDescriptor(document.status, document.expiryDate);

      return {
        ...document,
        vehicleLabel: document.vehicleRegistration || vehicle?.label || `Vehicle ${document.vehicleId}`,
        siteId: vehicle?.workingSiteId || null,
        siteName: site?.label || "Unassigned",
        vehicleTypeId: vehicle?.vehicleTypeId || null,
        vehicleTypeName: vehicleType?.label || "Unspecified",
        statusKey: statusDescriptor.key,
        statusLabel: statusDescriptor.label,
        statusTone: statusDescriptor.tone,
      };
    }),
    [documents, siteLookup, vehicleLookup, vehicleTypeLookup]
  );

  const visibleDocuments = useMemo(
    () => enrichedDocuments.filter((document) => {
      if (fixedVehicleId && document.vehicleId !== fixedVehicleId) return false;
      if (selectedVehicleId !== "all" && document.vehicleId !== Number(selectedVehicleId)) return false;
      if (selectedSiteId !== "all" && document.siteId !== Number(selectedSiteId)) return false;
      if (selectedVehicleTypeId !== "all" && document.vehicleTypeId !== Number(selectedVehicleTypeId)) return false;
      if (selectedComplianceCategory !== "all" && document.complianceCategory !== Number(selectedComplianceCategory)) return false;
      if (selectedStatus !== "all" && document.statusKey !== selectedStatus) return false;
      return true;
    }),
    [enrichedDocuments, fixedVehicleId, selectedComplianceCategory, selectedSiteId, selectedStatus, selectedVehicleId, selectedVehicleTypeId]
  );

  const stats = useMemo(() => ({
    total: visibleDocuments.length,
    valid: visibleDocuments.filter((document) => document.statusKey === "valid").length,
    expiring: visibleDocuments.filter((document) => document.statusKey === "expiring").length,
    expired: visibleDocuments.filter((document) => document.statusKey === "expired").length,
    vehicles: new Set(visibleDocuments.map((document) => document.vehicleId)).size,
  }), [visibleDocuments]);

  const siteOptions = useMemo(() => {
    const siteIds = new Set(vehicles.map((vehicle) => vehicle.workingSiteId).filter(Boolean));
    return sites.filter((site) => siteIds.has(site.siteId));
  }, [sites, vehicles]);

  const vehicleTypeOptions = useMemo(() => {
    const vehicleTypeIds = new Set(vehicles.map((vehicle) => vehicle.vehicleTypeId).filter(Boolean));
    return vehicleTypes.filter((vehicleType) => vehicleTypeIds.has(vehicleType.vehicleTypeId));
  }, [vehicleTypes, vehicles]);

  const openCreatePanel = () => {
    setDocumentFormState({
      ...EMPTY_DOCUMENT_FORM_STATE,
      vehicleId: fixedVehicleId || (selectedVehicleId !== "all" ? Number(selectedVehicleId) : "") || "",
    });
    setDocumentPanelOpen(true);
  };

  const openEditPanel = (document) => {
    setDocumentFormState({
      id: document.id,
      vehicleId: document.vehicleId,
      documentType: document.documentType,
      complianceCategory: document.complianceCategory,
      documentNumber: document.documentNumber,
      issueDate: toDateInputValue(document.issueDate),
      expiryDate: toDateInputValue(document.expiryDate),
      alertLeadDays: document.alertLeadDays,
      issuingAuthority: document.issuingAuthority,
      notes: document.notes,
      file: null,
    });
    setDocumentPanelOpen(true);
  };

  const handleDelete = async (document) => {
    if (!window.confirm(`Delete ${document.complianceCategoryName} for ${document.vehicleLabel}?`)) {
      return;
    }

    const response = await dispatch(deleteVehicleDocument(document.id));
    if (response?.isSuccess) {
      notify("Vehicle document deleted", "success", 2500);
      await refreshAll();
      return;
    }

    notify(response?.message || "Failed to delete vehicle document", "error", 3500);
  };

  const handleDocumentSubmit = async (event) => {
    event.preventDefault();
    const resolvedVehicleId = Number(documentFormState.vehicleId || fixedVehicleId || 0);
    const resolvedDocumentType = Number(documentFormState.documentType || 0);
    const resolvedComplianceCategory = Number(documentFormState.complianceCategory || 0);
    const resolvedAlertLeadDays = Number(documentFormState.alertLeadDays || 0);
    const isEditing = Boolean(documentFormState.id);

    if (!resolvedVehicleId || !resolvedDocumentType || !resolvedComplianceCategory || !documentFormState.documentNumber.trim()) {
      notify("Complete the required document fields before saving", "warning", 3000);
      return;
    }
    if (!documentFormState.issueDate || !documentFormState.expiryDate) {
      notify("Provide both issue date and expiry date", "warning", 3000);
      return;
    }
    if (!isEditing && !documentFormState.file) {
      notify("Attach the source document file", "warning", 3000);
      return;
    }

    const payload = new FormData();
    if (isEditing) payload.append("Id", documentFormState.id);
    payload.append("VehicleId", String(resolvedVehicleId));
    payload.append("DocumentType", String(resolvedDocumentType));
    payload.append("ComplianceCategory", String(resolvedComplianceCategory));
    payload.append("DocumentNumber", documentFormState.documentNumber.trim());
    payload.append("IssueDate", new Date(documentFormState.issueDate).toISOString());
    payload.append("ExpiryDate", new Date(documentFormState.expiryDate).toISOString());
    payload.append("AlertLeadDays", String(resolvedAlertLeadDays));
    payload.append("IssuingAuthority", documentFormState.issuingAuthority.trim());
    payload.append("Notes", documentFormState.notes || "");
    if (documentFormState.file) payload.append("DocumentFile", documentFormState.file);

    setDocumentSubmitting(true);
    try {
      const response = isEditing
        ? await dispatch(updateVehicleDocument(documentFormState.id, payload))
        : await dispatch(createVehicleDocument(payload));

      if (response?.isSuccess) {
        notify(isEditing ? "Vehicle document updated" : "Vehicle document created", "success", 2500);
        setDocumentPanelOpen(false);
        setDocumentFormState({ ...EMPTY_DOCUMENT_FORM_STATE, vehicleId: fixedVehicleId || "" });
        await refreshAll();
        return;
      }

      notify(response?.message || "Failed to save vehicle document", "error", 3500);
    } finally {
      setDocumentSubmitting(false);
    }
  };

  const handleRequirementSubmit = async (event) => {
    event.preventDefault();
    if (!requirementFormState.name.trim() || !requirementFormState.documentType || !requirementFormState.complianceCategory || requirementFormState.targetIds.length === 0) {
      notify("Complete the requirement fields and select at least one target", "warning", 3000);
      return;
    }

    setBulkSubmitting(true);
    try {
      const response = await dispatch(bulkCreateVehicleComplianceRequirements({
        name: requirementFormState.name.trim(),
        targetType: Number(requirementFormState.targetType),
        targetIds: requirementFormState.targetIds,
        documentType: Number(requirementFormState.documentType),
        complianceCategory: Number(requirementFormState.complianceCategory),
        alertLeadDays: Number(requirementFormState.alertLeadDays || 0),
        defaultIssuingAuthority: requirementFormState.defaultIssuingAuthority?.trim() || "",
        notes: requirementFormState.notes || "",
      }));

      if (response?.isSuccess) {
        notify("Compliance assignments created", "success", 2500);
        setBulkPanelOpen(false);
        setRequirementFormState({ ...EMPTY_REQUIREMENT_FORM_STATE });
        await loadCompliance();
        return;
      }

      notify(response?.message || "Failed to create compliance assignments", "error", 3500);
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="vehicle-documents-page">
      <div className="vehicle-documents-page__header">
        <div>
          <p className="vehicle-documents-page__eyebrow">Vehicle compliance</p>
          <h1 className="vehicle-documents-page__title">Vehicle documents</h1>
          <p className="vehicle-documents-page__subtitle">Track uploaded compliance records, assign requirements by site or vehicle type, and review due versus completed coverage.</p>
        </div>
        <div className="vehicle-documents-page__header-actions">
          <button type="button" className="vehicle-documents-page__button vehicle-documents-page__button--ghost" onClick={refreshAll} disabled={loadingDocuments}>
            <i className="fa-light fa-rotate-right" />
            Refresh
          </button>
          {!fixedVehicleId ? (
            <button type="button" className="vehicle-documents-page__button vehicle-documents-page__button--ghost" onClick={() => setBulkPanelOpen(true)} disabled={loadingLookups}>
              <i className="fa-light fa-layer-group" />
              Bulk assign
            </button>
          ) : null}
          <button type="button" className="vehicle-documents-page__button vehicle-documents-page__button--primary" onClick={openCreatePanel} disabled={loadingLookups}>
            <i className="fa-light fa-plus" />
            Add document
          </button>
        </div>
      </div>

      <div className="vehicle-documents-page__note-grid">
        <div className="vehicle-documents-page__note-card">
          <span className="vehicle-documents-page__note-title">Current storage model</span>
          <p>Documents are stored under <strong>C:\FMSData\uploads\vehicle-documents\&lt;vehicleId&gt;</strong> so each vehicle keeps its own file folder.</p>
        </div>
        <div className="vehicle-documents-page__note-card vehicle-documents-page__note-card--warning">
          <span className="vehicle-documents-page__note-title">Compliance model</span>
          <p>Each document now carries a dedicated compliance category and alert lead days. Bulk requirement assignments compare site and vehicle-type expectations against the latest uploaded record.</p>
        </div>
      </div>

      {!fixedVehicleId ? <VehicleComplianceWidgets dashboard={dashboard} requirements={requirements} /> : null}

      <VehicleDocumentsSummaryCards stats={stats} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />

      <VehicleDocumentsFilterBar
        fixedVehicleId={fixedVehicleId}
        vehicles={vehicles}
        siteOptions={siteOptions}
        vehicleTypeOptions={vehicleTypeOptions}
        selectedVehicleId={selectedVehicleId}
        selectedSiteId={selectedSiteId}
        selectedVehicleTypeId={selectedVehicleTypeId}
        selectedComplianceCategory={selectedComplianceCategory}
        selectedStatus={selectedStatus}
        onVehicleChange={setSelectedVehicleId}
        onSiteChange={setSelectedSiteId}
        onVehicleTypeChange={setSelectedVehicleTypeId}
        onComplianceCategoryChange={setSelectedComplianceCategory}
        onStatusChange={setSelectedStatus}
      />

      <VehicleDocumentsGrid documents={visibleDocuments} loading={loadingDocuments} onEdit={openEditPanel} onDelete={handleDelete} />

      <VehicleDocumentFormPanel
        open={documentPanelOpen}
        onClose={() => !documentSubmitting && setDocumentPanelOpen(false)}
        onSubmit={handleDocumentSubmit}
        isSubmitting={documentSubmitting}
        formState={documentFormState}
        setFormState={setDocumentFormState}
        fixedVehicleId={fixedVehicleId}
        vehicles={vehicles}
      />

      {!fixedVehicleId ? (
        <VehicleComplianceBulkPanel
          open={bulkPanelOpen}
          onClose={() => !bulkSubmitting && setBulkPanelOpen(false)}
          onSubmit={handleRequirementSubmit}
          isSubmitting={bulkSubmitting}
          formState={requirementFormState}
          setFormState={setRequirementFormState}
          sites={sites}
          vehicleTypes={vehicleTypes}
        />
      ) : null}
    </div>
  );
};

export default VehicleDocumentsList;