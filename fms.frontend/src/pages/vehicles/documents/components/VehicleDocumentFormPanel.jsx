/**
 * File: VehicleDocumentFormPanel.jsx
 * Purpose: Slide-panel form for creating and editing vehicle compliance documents.
 * Dependencies: React, SlidePanel, shared document metadata.
 * Last Modified: 2026-03-25
 */

import React from "react";
import SlidePanel from "../../../../components/ui/SlidePanel";
import { COMPLIANCE_CATEGORY_OPTIONS, DOCUMENT_TYPE_OPTIONS } from "../VehicleDocuments.shared";

const VehicleDocumentFormPanel = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  formState,
  setFormState,
  fixedVehicleId,
  vehicles,
}) => (
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
          <p>Capture the operational compliance category, the legacy storage type, and the alert lead days that should trigger expiry monitoring.</p>
        </div>
        <div className="vehicle-documents-panel__mapping">
          <div><span>NTSA inspection</span><strong>NTSA Inspection Certificate</strong></div>
          <div><span>KENHA permit / exemption</span><strong>Road Permit or Permit Exemption</strong></div>
          <div><span>Driver compliance</span><strong>Driving License</strong></div>
        </div>
      </div>

      <form className="vehicle-documents-panel__form" onSubmit={onSubmit}>
        <section className="vehicle-documents-panel__section">
          <div className="vehicle-documents-panel__section-header">
            <h4>Scope</h4>
            <p>Select the vehicle and classify the document properly for reporting and alerts.</p>
          </div>
          <div className="vehicle-documents-panel__field-grid">
            <label className="vehicle-documents-panel__field">
              <span>Vehicle</span>
              <select className="vehicle-documents-panel__select" value={formState.vehicleId} onChange={(event) => setFormState((currentState) => ({ ...currentState, vehicleId: event.target.value }))} disabled={fixedVehicleId !== null}>
                <option value="">Select vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.label}</option>
                ))}
              </select>
            </label>

            <label className="vehicle-documents-panel__field">
              <span>Compliance category</span>
              <select className="vehicle-documents-panel__select" value={formState.complianceCategory} onChange={(event) => setFormState((currentState) => ({ ...currentState, complianceCategory: event.target.value }))}>
                <option value="">Select category</option>
                {COMPLIANCE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="vehicle-documents-panel__field">
              <span>Document type</span>
              <select className="vehicle-documents-panel__select" value={formState.documentType} onChange={(event) => setFormState((currentState) => ({ ...currentState, documentType: event.target.value }))}>
                <option value="">Select type</option>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="vehicle-documents-panel__field">
              <span>Document number</span>
              <input className="vehicle-documents-panel__input" type="text" value={formState.documentNumber} onChange={(event) => setFormState((currentState) => ({ ...currentState, documentNumber: event.target.value }))} placeholder="Enter document number" maxLength={100} />
            </label>
          </div>
        </section>

        <section className="vehicle-documents-panel__section">
          <div className="vehicle-documents-panel__section-header">
            <h4>Dates and alert window</h4>
            <p>Alert lead days control when the compliance notifier treats the document as due soon.</p>
          </div>
          <div className="vehicle-documents-panel__field-grid">
            <label className="vehicle-documents-panel__field">
              <span>Issue date</span>
              <input className="vehicle-documents-panel__input" type="date" value={formState.issueDate} onChange={(event) => setFormState((currentState) => ({ ...currentState, issueDate: event.target.value }))} />
            </label>

            <label className="vehicle-documents-panel__field">
              <span>Expiry date</span>
              <input className="vehicle-documents-panel__input" type="date" value={formState.expiryDate} onChange={(event) => setFormState((currentState) => ({ ...currentState, expiryDate: event.target.value }))} />
            </label>

            <label className="vehicle-documents-panel__field">
              <span>Alert lead days</span>
              <input className="vehicle-documents-panel__input" type="number" min="0" max="365" value={formState.alertLeadDays} onChange={(event) => setFormState((currentState) => ({ ...currentState, alertLeadDays: event.target.value }))} />
            </label>

            <label className="vehicle-documents-panel__field">
              <span>Issuing authority</span>
              <input className="vehicle-documents-panel__input" type="text" value={formState.issuingAuthority} onChange={(event) => setFormState((currentState) => ({ ...currentState, issuingAuthority: event.target.value }))} placeholder="NTSA, KENHA, insurer, broker..." maxLength={200} />
            </label>

            <label className="vehicle-documents-panel__field vehicle-documents-panel__field--wide">
              <span>Document file</span>
              <input className="vehicle-documents-panel__file" type="file" accept="application/pdf,image/*" onChange={(event) => setFormState((currentState) => ({ ...currentState, file: event.target.files?.[0] || null }))} />
              <span className="vehicle-documents-panel__hint">Accepted formats: PDF and images. {formState.id ? "Leave empty to keep the current file." : "A file is required for new documents."}</span>
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
  </SlidePanel>
);

export default VehicleDocumentFormPanel;
