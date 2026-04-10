/**
 * File: VehicleDocumentsList.jsx
 * Purpose: Container page for vehicle compliance documents, filters, and reporting actions.
 * Dependencies: React, Redux actions, page subcomponents.
 * Last Modified: 2026-03-25
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import notify from "devextreme/ui/notify";
import { usePermissions } from "../../../hooks/usePermissions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchVehicleTypes } from "../../../redux/actions/vehicleTypeActions";
import {
  createVehicleDocumentIssuingAuthority,
  createVehicleDocument,
  deleteVehicleDocumentIssuingAuthority,
  deleteVehicleDocument,
  getVehicleDocumentIssuingAuthorities,
  getVehicleDocumentUserPreferences,
  getVehicleDocuments,
  renameVehicleDocumentIssuingAuthority,
  saveVehicleDocumentUserPreferences,
  updateVehicleDocument,
} from "../../../redux/actions/vehicleDocumentActions";
import VehicleDocumentFormPanel from "./components/VehicleDocumentFormPanel";
import VehicleDocumentSettingsPanel from "./components/VehicleDocumentSettingsPanel";
import VehicleDocumentsFilterBar from "./components/VehicleDocumentsFilterBar";
import VehicleDocumentsGrid from "./components/VehicleDocumentsGrid";
import VehicleDocumentsSummaryCards from "./components/VehicleDocumentsSummaryCards";
import {
  DEFAULT_NOTIFICATION_REMINDER_SETTINGS,
  buildDocumentComplianceCatalog,
  EMPTY_DOCUMENT_FORM_STATE,
  getDefaultReminderDays,
  getComplianceEntry,
  getPreferredIssuingAuthority,
  getResolvedDocumentType,
  getStatusDescriptor,
  normalizeDocument,
  parseNotificationReminderSettings,
  normalizeSite,
  normalizeVehicle,
  normalizeVehicleType,
  toDateInputValue,
} from "./VehicleDocuments.shared";
import "./VehicleDocumentsList.scss";

const STATUS_TO_REPORT_STATUS = {
  valid: 1,
  expiring: 2,
  expired: 3,
};

const VehicleDocumentsList = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('_Create_VehicleDocuments');
  const canEdit = hasPermission('_Edit_VehicleDocuments');
  const canDelete = hasPermission('_Delete_VehicleDocuments');
  const fixedVehicleId = Number(vehicleId) > 0 ? Number(vehicleId) : null;

  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [sites, setSites] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(fixedVehicleId || "all");
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState("all");
  const [selectedComplianceCategory, setSelectedComplianceCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [documentPanelOpen, setDocumentPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [authoritySaving, setAuthoritySaving] = useState(false);
  const [documentFormErrors, setDocumentFormErrors] = useState({});
  const [documentFormState, setDocumentFormState] = useState({ ...EMPTY_DOCUMENT_FORM_STATE, vehicleId: fixedVehicleId || "" });
  const [notificationDefaults, setNotificationDefaults] = useState({ ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS });
  const [issuingAuthorities, setIssuingAuthorities] = useState([]);

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
  const documentCatalog = useMemo(() => buildDocumentComplianceCatalog([], documents, issuingAuthorities), [documents, issuingAuthorities]);

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

  const loadVehicleDocumentSettings = useCallback(async () => {
    try {
      const [preferenceResult, authorityResult] = await Promise.all([
        dispatch(getVehicleDocumentUserPreferences()),
        dispatch(getVehicleDocumentIssuingAuthorities()),
      ]);

      setNotificationDefaults(parseNotificationReminderSettings(preferenceResult?.data));
      setIssuingAuthorities(Array.isArray(authorityResult?.data) ? authorityResult.data : []);
    } catch (error) {
      notify(error?.message || "Failed to load vehicle document settings", "error", 3000);
      setNotificationDefaults({ ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS });
      setIssuingAuthorities([]);
    }
  }, [dispatch]);

  const refreshAll = useCallback(async () => {
    await loadDocuments();
  }, [loadDocuments]);

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

  useEffect(() => {
    loadVehicleDocumentSettings();
  }, [loadVehicleDocumentSettings]);

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
    setDocumentFormErrors({});
    setDocumentFormState({
      ...EMPTY_DOCUMENT_FORM_STATE,
      alertLeadDays: getDefaultReminderDays(notificationDefaults, null),
      vehicleId: fixedVehicleId || (selectedVehicleId !== "all" ? Number(selectedVehicleId) : "") || "",
    });
    setDocumentPanelOpen(true);
  };

  const openEditPanel = (document) => {
    setDocumentFormErrors({});
    setDocumentFormState({
      id: document.id,
      vehicleId: document.vehicleId,
      documentType: document.documentType,
      complianceCategory: document.complianceCategory,
      documentNumber: document.documentNumber,
      issueDate: toDateInputValue(document.issueDate),
      expiryDate: toDateInputValue(document.expiryDate),
      notifyBeforeExpiry: document.alertLeadDays > 0,
      alertLeadDays: document.alertLeadDays,
      issuingAuthority: document.issuingAuthority,
      customAuthorityOptions: [],
      notes: document.notes,
      file: null,
    });
    setDocumentPanelOpen(true);
  };

  const closeDocumentPanel = useCallback(() => {
    if (documentSubmitting) {
      return;
    }

    setDocumentPanelOpen(false);
    setDocumentFormErrors({});
  }, [documentSubmitting]);

  const handleCreateIssuingAuthority = useCallback(async (payload) => {
    setAuthoritySaving(true);

    try {
      const response = await dispatch(createVehicleDocumentIssuingAuthority(payload));
      if (response?.isSuccess) {
        await loadVehicleDocumentSettings();
        notify("Issuing authority saved", "success", 2500);
      }

      return response;
    } catch (error) {
      return {
        isSuccess: false,
        message: error?.message || "Failed to save issuing authority",
      };
    } finally {
      setAuthoritySaving(false);
    }
  }, [dispatch, loadVehicleDocumentSettings]);

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
    const resolvedComplianceCategory = Number(documentFormState.complianceCategory || 0);
    const resolvedDocumentType = getResolvedDocumentType(documentCatalog, resolvedComplianceCategory, documentFormState.documentType);
    const selectedComplianceEntry = getComplianceEntry(documentCatalog, resolvedComplianceCategory);
    const resolvedIssuingAuthority = documentFormState.issuingAuthority.trim() || getPreferredIssuingAuthority(selectedComplianceEntry, documentFormState.customAuthorityOptions, documentFormState.issuingAuthority);
    const resolvedAlertLeadDays = documentFormState.notifyBeforeExpiry ? Number(documentFormState.alertLeadDays || 0) : 0;
    const isEditing = Boolean(documentFormState.id);

    const nextValidationErrors = {};
    if (!resolvedVehicleId) nextValidationErrors.vehicleId = "Vehicle is required.";
    if (!resolvedComplianceCategory) nextValidationErrors.complianceCategory = "Compliance category is required.";
    if (!resolvedDocumentType) nextValidationErrors.complianceCategory = nextValidationErrors.complianceCategory || "Select a supported compliance category.";
    if (!documentFormState.documentNumber.trim()) nextValidationErrors.documentNumber = "Document number is required.";
    if (!documentFormState.issueDate) nextValidationErrors.issueDate = "Issue date is required.";
    if (!documentFormState.expiryDate) nextValidationErrors.expiryDate = "Expiry date is required.";
    if (documentFormState.issueDate && documentFormState.expiryDate && new Date(documentFormState.expiryDate) < new Date(documentFormState.issueDate)) {
      nextValidationErrors.expiryDate = "Expiry date must be on or after the issue date.";
    }
    if (documentFormState.notifyBeforeExpiry && (!Number.isFinite(resolvedAlertLeadDays) || resolvedAlertLeadDays < 0 || resolvedAlertLeadDays > 365)) {
      nextValidationErrors.alertLeadDays = "Notify me days must be between 0 and 365.";
    }
    if (!resolvedIssuingAuthority) nextValidationErrors.issuingAuthority = "Issuing authority is required.";
    if (!isEditing && !documentFormState.file) nextValidationErrors.file = "Supporting document is required.";

    setDocumentFormErrors(nextValidationErrors);

    if (Object.keys(nextValidationErrors).length > 0) {
      notify("Correct the highlighted fields before saving", "warning", 3000);
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
    payload.append("IssuingAuthority", resolvedIssuingAuthority);
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
        setDocumentFormErrors({});
        setDocumentFormState({ ...EMPTY_DOCUMENT_FORM_STATE, vehicleId: fixedVehicleId || "" });
        await refreshAll();
        return;
      }

      notify(response?.message || "Failed to save vehicle document", "error", 3500);
    } finally {
      setDocumentSubmitting(false);
    }
  };

  const handleSaveNotificationDefaults = async (nextDefaults) => {
    const payload = {
      preferences: Object.entries({ ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS, ...(nextDefaults || {}) }).map(([complianceCategory, reminderLeadDays]) => ({
        complianceCategory: Number(complianceCategory),
        reminderLeadDays: Math.max(0, Math.min(365, Number(reminderLeadDays) || 0)),
      })),
    };

    setSettingsSaving(true);
    try {
      const response = await dispatch(saveVehicleDocumentUserPreferences(payload));
      if (!response?.isSuccess) {
        notify(response?.message || "Failed to save your reminder defaults", "error", 3500);
        return;
      }

      setNotificationDefaults({ ...nextDefaults });
      notify("Your vehicle document reminder defaults were saved", "success", 2500);
      await loadVehicleDocumentSettings();
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || "Failed to save your reminder defaults", "error", 3500);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleRenameAuthority = async (oldName, newName) => {
    setAuthoritySaving(true);
    try {
      const response = await dispatch(renameVehicleDocumentIssuingAuthority({ oldName, newName }));
      if (response?.isSuccess) {
        notify("Issuing authority updated", "success", 2500);
        await Promise.all([refreshAll(), loadVehicleDocumentSettings()]);
        return;
      }

      notify(response?.message || "Failed to update issuing authority", "error", 3500);
    } finally {
      setAuthoritySaving(false);
    }
  };

  const handleDeleteAuthority = async (name) => {
    if (!window.confirm(`Delete issuing authority \"${name}\" from stored documents and requirements?`)) {
      return;
    }

    setAuthoritySaving(true);
    try {
      const response = await dispatch(deleteVehicleDocumentIssuingAuthority({ name }));
      if (response?.isSuccess) {
        notify("Issuing authority deleted", "success", 2500);
        await Promise.all([refreshAll(), loadVehicleDocumentSettings()]);
        return;
      }

      notify(response?.message || "Failed to delete issuing authority", "error", 3500);
    } finally {
      setAuthoritySaving(false);
    }
  };

  const handleOpenReport = () => {
    const params = new URLSearchParams();

    if (fixedVehicleId) {
      params.set("vehicleId", String(fixedVehicleId));
    } else if (selectedVehicleId !== "all") {
      params.set("vehicleId", String(selectedVehicleId));
    }

    if (selectedSiteId !== "all") {
      params.set("siteId", String(selectedSiteId));
    }

    if (selectedVehicleTypeId !== "all") {
      params.set("vehicleTypeId", String(selectedVehicleTypeId));
    }

    if (selectedComplianceCategory !== "all") {
      params.set("complianceCategory", String(selectedComplianceCategory));
    }

    if (selectedStatus !== "all") {
      params.set("status", String(STATUS_TO_REPORT_STATUS[selectedStatus] || ""));
    }

    const queryString = params.toString();
    navigate(`/reports/engine/vehicle-document-compliance${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="vehicle-documents-page">
      <div className="vehicle-documents-page__header">
        <div>
          <p className="vehicle-documents-page__eyebrow">Vehicle compliance</p>
          <h1 className="vehicle-documents-page__title">Vehicle documents</h1>
          <p className="vehicle-documents-page__subtitle">Track uploaded compliance records, filter by vehicle, site, and status, and generate compliance reports from the current view.</p>
        </div>
        <div className="vehicle-documents-page__header-actions">
          <button type="button" className="vehicle-documents-page__button vehicle-documents-page__button--ghost" onClick={() => setSettingsPanelOpen(true)} disabled={settingsSaving || authoritySaving || !canEdit}>
            <i className="fa-light fa-sliders" />
            Settings
          </button>
          <button type="button" className="vehicle-documents-page__button vehicle-documents-page__button--ghost" onClick={handleOpenReport}>
            <i className="fa-light fa-file-chart-column" />
            Create report
          </button>
          <button type="button" className="vehicle-documents-page__button vehicle-documents-page__button--ghost" onClick={refreshAll} disabled={loadingDocuments}>
            <i className="fa-light fa-rotate-right" />
            Refresh
          </button>
          {canCreate && (
            <button type="button" className="vehicle-documents-page__button vehicle-documents-page__button--primary" onClick={openCreatePanel} disabled={loadingLookups}>
              <i className="fa-light fa-plus" />
              Add document
            </button>
          )}
        </div>
      </div>

      <div className="vehicle-documents-page__note-grid">

        <div className="vehicle-documents-page__note-card vehicle-documents-page__note-card--warning">
          <span className="vehicle-documents-page__note-title">Compliance tracking</span>
          <p>Each document carries its compliance category, issuing authority, expiry date, and reminder lead days so the page can focus on current validity and reporting.</p>
        </div>
      </div>

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

      <VehicleDocumentsGrid documents={visibleDocuments} loading={loadingDocuments} onEdit={canEdit ? openEditPanel : undefined} onDelete={canDelete ? handleDelete : undefined} canEdit={canEdit} canDelete={canDelete} />

      <VehicleDocumentFormPanel
        open={documentPanelOpen}
        onClose={closeDocumentPanel}
        onSubmit={handleDocumentSubmit}
        isSubmitting={documentSubmitting}
        formState={documentFormState}
        setFormState={setDocumentFormState}
        validationErrors={documentFormErrors}
        documentCatalog={documentCatalog}
        notificationDefaults={notificationDefaults}
        fixedVehicleId={fixedVehicleId}
        vehicles={vehicles}
        isAuthoritySaving={authoritySaving}
        onCreateIssuingAuthority={handleCreateIssuingAuthority}
      />

      <VehicleDocumentSettingsPanel
        open={settingsPanelOpen}
        onClose={() => !settingsSaving && !authoritySaving && setSettingsPanelOpen(false)}
        loading={loadingLookups}
        saving={settingsSaving}
        notificationDefaults={notificationDefaults}
        onSaveNotificationDefaults={handleSaveNotificationDefaults}
        issuingAuthorities={issuingAuthorities}
        authoritySaving={authoritySaving}
        onRenameAuthority={handleRenameAuthority}
        onDeleteAuthority={handleDeleteAuthority}
        canEdit={canEdit}
      />
    </div>
  );
};

export default VehicleDocumentsList;