/**
 * File: VehicleDocumentFormPanel.jsx
 * Purpose: Slide-panel form for creating and editing vehicle compliance documents.
 * Dependencies: React, DevExtreme Popup, SlidePanel, shared document metadata.
 * Last Modified: 2026-03-25
 */

import React, { useMemo, useState } from "react";
import DateBox from "devextreme-react/date-box";
import { Popup } from "devextreme-react/popup";
import VehicleSearchableSelector from "../../../../components/selectors/VehicleSearchableSelector";
import SlidePanel from "../../../../components/ui/SlidePanel";
import {
  getDefaultReminderDays,
  getAuthorityOptionsForEntry,
  getComplianceEntry,
  getPreferredIssuingAuthority,
  normalizeAuthorityValue,
  toDateInputValue,
} from "../VehicleDocuments.shared";

const resolveDateBoxValue = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const VehicleDocumentFormPanel = ({
  open,
  onClose,
  onSubmit,
  onCreateIssuingAuthority,
  isSubmitting,
  isAuthoritySaving = false,
  formState,
  setFormState,
  validationErrors = {},
  documentCatalog = [],
  notificationDefaults = {},
  fixedVehicleId,
  vehicles,
}) => {
  const [authorityPopupOpen, setAuthorityPopupOpen] = useState(false);
  const [newAuthorityName, setNewAuthorityName] = useState("");
  const [authorityPopupError, setAuthorityPopupError] = useState("");

  const selectedComplianceEntry = useMemo(
    () => getComplianceEntry(documentCatalog, formState.complianceCategory),
    [documentCatalog, formState.complianceCategory]
  );

  const authorityOptions = useMemo(
    () => getAuthorityOptionsForEntry(selectedComplianceEntry, formState.customAuthorityOptions, formState.issuingAuthority),
    [formState.customAuthorityOptions, formState.issuingAuthority, selectedComplianceEntry]
  );

  const selectedVehicleLabel = useMemo(() => {
    const resolvedVehicleId = Number(formState.vehicleId || fixedVehicleId || 0);
    return vehicles.find((vehicle) => vehicle.vehicleId === resolvedVehicleId)?.label || "";
  }, [fixedVehicleId, formState.vehicleId, vehicles]);

  const documentTypeLabel = selectedComplianceEntry?.documentTypeName || "Auto-set from compliance category";

  const renderValidationMessage = (fieldName) =>
    validationErrors[fieldName] ? (
      <span className="vehicle-documents-panel__validation">{validationErrors[fieldName]}</span>
    ) : null;

  const handleComplianceCategoryChange = (event) => {
    const nextComplianceCategory = event.target.value;
    const nextComplianceEntry = getComplianceEntry(documentCatalog, nextComplianceCategory);
    const reminderLeadDays = getDefaultReminderDays(notificationDefaults, nextComplianceCategory);

    setFormState((currentState) => ({
      ...currentState,
      complianceCategory: nextComplianceCategory,
      documentType: nextComplianceEntry?.documentType ?? "",
      notifyBeforeExpiry: reminderLeadDays > 0,
      alertLeadDays: reminderLeadDays,
      issuingAuthority: getPreferredIssuingAuthority(nextComplianceEntry, currentState.customAuthorityOptions, currentState.issuingAuthority),
    }));
  };

  const handleAuthoritySave = async () => {
    const normalizedAuthority = normalizeAuthorityValue(newAuthorityName);

    if (!normalizedAuthority) {
      setAuthorityPopupError("Issuing authority is required.");
      return;
    }

    if (!formState.complianceCategory) {
      setAuthorityPopupError("Select a compliance category before adding an issuing authority.");
      return;
    }

    if (typeof onCreateIssuingAuthority === "function") {
      const response = await onCreateIssuingAuthority({
        name: normalizedAuthority,
        complianceCategory: Number(formState.complianceCategory || 0),
      });

      if (!response?.isSuccess) {
        setAuthorityPopupError(response?.message || "Failed to save issuing authority.");
        return;
      }
    }

    setFormState((currentState) => ({
      ...currentState,
      issuingAuthority: normalizedAuthority,
      customAuthorityOptions: currentState.customAuthorityOptions.includes(normalizedAuthority)
        ? currentState.customAuthorityOptions
        : [...currentState.customAuthorityOptions, normalizedAuthority],
    }));

    setAuthorityPopupError("");
    setNewAuthorityName("");
    setAuthorityPopupOpen(false);
  };

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={formState.id ? "Edit vehicle document" : "Add vehicle document"}
      width="min(1000px, 100vw)"
      panelClassName="vehicle-documents-panel-shell"
    >
      <div className="vehicle-documents-panel">
        <div className="vehicle-documents-panel__summary">
          <div>
            <span className="vehicle-documents-panel__eyebrow">Document intake</span>
            <h3>{formState.id ? "Edit vehicle document" : "Add vehicle document"}</h3>
            <p>Select the vehicle, choose the compliance category, and let the system lock the linked document type and preferred issuing authority for a cleaner compliance flow.</p>
          </div>
          <div className="vehicle-documents-panel__mapping">
            {documentCatalog.slice(0, 3).map((entry) => (
              <div key={entry.complianceCategory}>
                <span>{entry.documentTypeName}</span>
                <strong>{entry.complianceCategoryName}</strong>
              </div>
            ))}
          </div>
        </div>

        <form className="vehicle-documents-panel__form" onSubmit={onSubmit}>
          <section className="vehicle-documents-panel__section">
            <div className="vehicle-documents-panel__section-header">
              <h4>Scope</h4>
              <p>Select the vehicle, then choose the compliance category. Document type and issuing authority options stay aligned to that category.</p>
            </div>
            <div className="vehicle-documents-panel__field-grid">
              <label className="vehicle-documents-panel__field vehicle-documents-panel__field--wide">
                <span>Vehicle</span>
                {fixedVehicleId !== null ? (
                  <input className="vehicle-documents-panel__input" type="text" value={selectedVehicleLabel} disabled />
                ) : (
                  <VehicleSearchableSelector
                    value={formState.vehicleId || null}
                    onValueChanged={(event) => setFormState((currentState) => ({ ...currentState, vehicleId: event?.value || "" }))}
                    placeholder="Search and select vehicle..."
                    isValid={!validationErrors.vehicleId}
                  />
                )}
                {renderValidationMessage("vehicleId")}
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Compliance category</span>
                <select className={`vehicle-documents-panel__select${validationErrors.complianceCategory ? " vehicle-documents-panel__control--invalid" : ""}`} value={formState.complianceCategory} onChange={handleComplianceCategoryChange}>
                  <option value="">Select category</option>
                  {documentCatalog.map((entry) => (
                    <option key={entry.complianceCategory} value={entry.complianceCategory}>{entry.complianceCategoryName}</option>
                  ))}
                </select>
                {renderValidationMessage("complianceCategory")}
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Document type</span>
                <input className="vehicle-documents-panel__input" type="text" value={documentTypeLabel} readOnly disabled />
                <span className="vehicle-documents-panel__hint">Auto-linked from the selected compliance category.</span>
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Document number</span>
                <input className={`vehicle-documents-panel__input${validationErrors.documentNumber ? " vehicle-documents-panel__control--invalid" : ""}`} type="text" value={formState.documentNumber} onChange={(event) => setFormState((currentState) => ({ ...currentState, documentNumber: event.target.value }))} placeholder="Enter document number" maxLength={100} />
                {renderValidationMessage("documentNumber")}
              </label>
            </div>
          </section>

          <section className="vehicle-documents-panel__section">
            <div className="vehicle-documents-panel__section-header">
              <h4>Dates and notifications</h4>
              <p>Use the expiry dates for compliance tracking and choose whether the document should trigger reminders before it expires.</p>
            </div>
            <div className="vehicle-documents-panel__field-grid">
              <label className="vehicle-documents-panel__field">
                <span>Issue date</span>
                <DateBox
                  className={`vehicle-documents-panel__datebox${validationErrors.issueDate ? " vehicle-documents-panel__datebox--invalid" : ""}`}
                  type="date"
                  stylingMode="outlined"
                  displayFormat="dd/MM/yyyy"
                  value={resolveDateBoxValue(formState.issueDate)}
                  onValueChanged={(event) => setFormState((currentState) => ({ ...currentState, issueDate: toDateInputValue(event.value) }))}
                />
                {renderValidationMessage("issueDate")}
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Expiry date</span>
                <DateBox
                  className={`vehicle-documents-panel__datebox${validationErrors.expiryDate ? " vehicle-documents-panel__datebox--invalid" : ""}`}
                  type="date"
                  stylingMode="outlined"
                  displayFormat="dd/MM/yyyy"
                  value={resolveDateBoxValue(formState.expiryDate)}
                  onValueChanged={(event) => setFormState((currentState) => ({ ...currentState, expiryDate: toDateInputValue(event.value) }))}
                />
                {renderValidationMessage("expiryDate")}
              </label>

              <div className="vehicle-documents-panel__field vehicle-documents-panel__field--wide">
                <span>Notify me when document is nearing expiry</span>
                <label className="vehicle-documents-panel__checkbox">
                  <input type="checkbox" checked={Boolean(formState.notifyBeforeExpiry)} onChange={(event) => setFormState((currentState) => ({ ...currentState, notifyBeforeExpiry: event.target.checked, alertLeadDays: event.target.checked ? currentState.alertLeadDays || 30 : 0 }))} />
                  <span>Send reminders before expiry</span>
                </label>
                {formState.notifyBeforeExpiry ? (
                  <div className="vehicle-documents-panel__inline-field">
                    <input className={`vehicle-documents-panel__input${validationErrors.alertLeadDays ? " vehicle-documents-panel__control--invalid" : ""}`} type="number" min="0" max="365" value={formState.alertLeadDays} onChange={(event) => setFormState((currentState) => ({ ...currentState, alertLeadDays: event.target.value }))} />
                    <span className="vehicle-documents-panel__inline-label">days before expiry</span>
                  </div>
                ) : (
                  <span className="vehicle-documents-panel__hint">Reminder notifications are currently turned off for this document.</span>
                )}
                {renderValidationMessage("alertLeadDays")}
              </div>
            </div>
          </section>

          <section className="vehicle-documents-panel__section">
            <div className="vehicle-documents-panel__section-header">
              <h4>Authority and support document</h4>
              <p>Issuing authority is tied to the selected compliance category. Use the add button if you need a new authority option for the current category.</p>
            </div>
            <div className="vehicle-documents-panel__field-grid">
              <div className="vehicle-documents-panel__field">
                <span>Issuing authority</span>
                <div className="vehicle-documents-panel__authority-row">
                  <select className={`vehicle-documents-panel__select${validationErrors.issuingAuthority ? " vehicle-documents-panel__control--invalid" : ""}`} value={formState.issuingAuthority} onChange={(event) => setFormState((currentState) => ({ ...currentState, issuingAuthority: event.target.value }))}>
                    <option value="">Select authority</option>
                    {authorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button type="button" className="vehicle-documents-panel__mini-button" onClick={() => setAuthorityPopupOpen(true)} disabled={!formState.complianceCategory}>
                    <i className="fa-light fa-plus" />
                    Add
                  </button>
                </div>
                {renderValidationMessage("issuingAuthority")}
              </div>

              <label className="vehicle-documents-panel__field vehicle-documents-panel__field--wide">
                <span>Supporting document</span>
                <input className={`vehicle-documents-panel__file${validationErrors.file ? " vehicle-documents-panel__control--invalid" : ""}`} type="file" accept="application/pdf,image/*" onChange={(event) => setFormState((currentState) => ({ ...currentState, file: event.target.files?.[0] || null }))} />
                <span className="vehicle-documents-panel__hint">Accepted formats: PDF and images. {formState.id ? "Leave empty to keep the current file." : "A supporting file is required for new documents."}</span>
                {renderValidationMessage("file")}
              </label>
            </div>
          </section>

          <section className="vehicle-documents-panel__section">
            <div className="vehicle-documents-panel__section-header">
              <h4>Notes</h4>
              <p>Add context for reviewers, auditors, or transport coordinators.</p>
            </div>
            <label className="vehicle-documents-panel__field">
              <span>Internal notes</span>
              <textarea className="vehicle-documents-panel__textarea" rows={5} value={formState.notes} onChange={(event) => setFormState((currentState) => ({ ...currentState, notes: event.target.value }))} placeholder="Optional operational notes" />
            </label>
          </section>

          <div className="vehicle-documents-panel__footer">
            <button type="button" className="vehicle-documents-panel__button vehicle-documents-panel__button--ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="vehicle-documents-panel__button vehicle-documents-panel__button--primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : formState.id ? "Update document" : "Create document"}</button>
          </div>
        </form>
      </div>

      <Popup
        visible={authorityPopupOpen}
        onHiding={() => {
          setAuthorityPopupOpen(false);
          setAuthorityPopupError("");
          setNewAuthorityName("");
        }}
        showTitle
        dragEnabled={false}
        title="Add issuing authority"
        width={420}
        height="auto"
        className="vehicle-documents-panel__popup"
      >
        <div className="vehicle-documents-panel__popup-content">
          <p className="vehicle-documents-panel__popup-copy">
            Add an authority for {selectedComplianceEntry?.complianceCategoryName || "the selected compliance category"}.
            {selectedComplianceEntry?.documentTypeName ? ` This will stay linked to ${selectedComplianceEntry.documentTypeName}.` : ""}
          </p>
          <label className="vehicle-documents-panel__field">
            <span>Issuing authority</span>
            <input className={`vehicle-documents-panel__input${authorityPopupError ? " vehicle-documents-panel__control--invalid" : ""}`} type="text" value={newAuthorityName} onChange={(event) => setNewAuthorityName(event.target.value)} placeholder="Enter authority name" maxLength={200} />
            {authorityPopupError ? <span className="vehicle-documents-panel__validation">{authorityPopupError}</span> : null}
          </label>
          <div className="vehicle-documents-panel__popup-actions">
            <button type="button" className="vehicle-documents-panel__button vehicle-documents-panel__button--ghost" onClick={() => {
              setAuthorityPopupOpen(false);
              setAuthorityPopupError("");
              setNewAuthorityName("");
            }} disabled={isAuthoritySaving}>
              Cancel
            </button>
            <button type="button" className="vehicle-documents-panel__button vehicle-documents-panel__button--primary" onClick={handleAuthoritySave} disabled={isAuthoritySaving}>
              {isAuthoritySaving ? "Saving..." : "Save authority"}
            </button>
          </div>
        </div>
      </Popup>
    </SlidePanel>
  );
};

export default VehicleDocumentFormPanel;
