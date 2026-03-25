/**
 * File: EmployeeDocumentFormPanel.jsx
 * Purpose: Slide-panel form for creating and editing employee documents.
 * Dependencies: React, SlidePanel, employee document shared metadata.
 * Last Modified: 2026-03-25
 */

import React from "react";
import SlidePanel from "../../../../components/ui/SlidePanel";
import { EMPLOYEE_DOCUMENT_TYPE_OPTIONS } from "./EmployeeDocuments.shared";

const EmployeeDocumentFormPanel = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  formState,
  setFormState,
  employee,
}) => (
  <SlidePanel
    open={open}
    onClose={onClose}
    title={formState.id ? "Edit employee document" : "Add employee document"}
    width="min(1000px, 100vw)"
    panelClassName="employee-documents-panel-shell"
  >
    <div className="employee-documents-panel">
      <div className="employee-documents-panel__summary">
        <div>
          <span className="employee-documents-panel__eyebrow">Document intake</span>
          <h3>{formState.id ? "Edit employee document" : "Add employee document"}</h3>
          <p>Store driver licenses and other employee compliance records directly on the employee profile so operational follow-up does not depend on a vehicle assignment.</p>
        </div>
        <div className="employee-documents-panel__mapping">
          <div><span>Primary compliance</span><strong>Driving License</strong></div>
          <div><span>Health and onboarding</span><strong>Medical / Contract</strong></div>
          <div><span>Identity support</span><strong>National ID and other files</strong></div>
        </div>
      </div>

      <form className="employee-documents-panel__form" onSubmit={onSubmit}>
        <section className="employee-documents-panel__section">
          <div className="employee-documents-panel__section-header">
            <h4>Employee scope</h4>
            <p>All files are saved under the employee document folder for {employee?.fullName || "this employee"}.</p>
          </div>
          <div className="employee-documents-panel__field-grid">
            <label className="employee-documents-panel__field">
              <span>Document type</span>
              <select className="employee-documents-panel__select" value={formState.documentType} onChange={(event) => setFormState((currentState) => ({ ...currentState, documentType: event.target.value }))}>
                {EMPLOYEE_DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="employee-documents-panel__field">
              <span>Document number</span>
              <input className="employee-documents-panel__input" type="text" value={formState.documentNumber} onChange={(event) => setFormState((currentState) => ({ ...currentState, documentNumber: event.target.value }))} placeholder="Enter document number" maxLength={100} />
            </label>

            <label className="employee-documents-panel__field">
              <span>Issue date</span>
              <input className="employee-documents-panel__input" type="date" value={formState.issueDate} onChange={(event) => setFormState((currentState) => ({ ...currentState, issueDate: event.target.value }))} />
            </label>

            <label className="employee-documents-panel__field">
              <span>Expiry date</span>
              <input className="employee-documents-panel__input" type="date" value={formState.expiryDate} onChange={(event) => setFormState((currentState) => ({ ...currentState, expiryDate: event.target.value }))} />
            </label>

            <label className="employee-documents-panel__field">
              <span>Alert lead days</span>
              <input className="employee-documents-panel__input" type="number" min="0" max="365" value={formState.alertLeadDays} onChange={(event) => setFormState((currentState) => ({ ...currentState, alertLeadDays: event.target.value }))} />
            </label>

            <label className="employee-documents-panel__field">
              <span>Issuing authority</span>
              <input className="employee-documents-panel__input" type="text" value={formState.issuingAuthority} onChange={(event) => setFormState((currentState) => ({ ...currentState, issuingAuthority: event.target.value }))} placeholder="NTSA, HR, clinic, training provider..." maxLength={200} />
            </label>

            <label className="employee-documents-panel__field employee-documents-panel__field--wide">
              <span>Document file</span>
              <input className="employee-documents-panel__file" type="file" accept="application/pdf,image/*" onChange={(event) => setFormState((currentState) => ({ ...currentState, file: event.target.files?.[0] || null }))} />
              <span className="employee-documents-panel__hint">Accepted formats: PDF and images. {formState.id ? "Leave empty to keep the current file." : "A file is required for new documents."}</span>
            </label>
          </div>
        </section>

        <section className="employee-documents-panel__section">
          <div className="employee-documents-panel__section-header">
            <h4>Notes</h4>
            <p>Add any operational context for dispatch, compliance, or HR reviewers.</p>
          </div>
          <label className="employee-documents-panel__field">
            <span>Internal notes</span>
            <textarea className="employee-documents-panel__textarea" rows={5} value={formState.notes} onChange={(event) => setFormState((currentState) => ({ ...currentState, notes: event.target.value }))} placeholder="Optional internal notes" />
          </label>
        </section>

        <div className="employee-documents-panel__footer">
          <button type="button" className="employee-documents-panel__button employee-documents-panel__button--ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="employee-documents-panel__button employee-documents-panel__button--primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : formState.id ? "Update document" : "Create document"}</button>
        </div>
      </form>
    </div>
  </SlidePanel>
);

export default EmployeeDocumentFormPanel;