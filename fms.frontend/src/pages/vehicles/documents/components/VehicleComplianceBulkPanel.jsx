/**
 * File: VehicleComplianceBulkPanel.jsx
 * Purpose: Bulk assignment panel for compliance requirements by site or vehicle type.
 * Dependencies: React, SlidePanel.
 * Last Modified: 2026-03-25
 */

import React from "react";
import SlidePanel from "../../../../components/ui/SlidePanel";
import {
  COMPLIANCE_CATEGORY_OPTIONS,
  REQUIREMENT_TARGET_OPTIONS,
  getComplianceEntry,
} from "../VehicleDocuments.shared";

const VehicleComplianceBulkPanel = ({ open, onClose, onSubmit, isSubmitting, formState, setFormState, sites, vehicleTypes, documentCatalog }) => {
  const targets = Number(formState.targetType) === 1 ? sites : vehicleTypes;
  const selectedTargetIds = new Set(formState.targetIds);
  const selectedComplianceEntry = getComplianceEntry(documentCatalog, formState.complianceCategory);
  const documentTypeLabel = selectedComplianceEntry?.documentTypeName || "Auto-set from compliance category";

  const handleComplianceCategoryChange = (event) => {
    const nextComplianceCategory = event.target.value;
    const nextComplianceEntry = getComplianceEntry(documentCatalog, nextComplianceCategory);

    setFormState((currentState) => ({
      ...currentState,
      complianceCategory: nextComplianceCategory,
      documentType: nextComplianceEntry?.documentType ?? "",
      defaultIssuingAuthority: nextComplianceEntry?.defaultIssuingAuthority || currentState.defaultIssuingAuthority,
    }));
  };

  const toggleTarget = (targetId) => {
    setFormState((currentState) => {
      const nextTargetIds = currentState.targetIds.includes(targetId)
        ? currentState.targetIds.filter((value) => value !== targetId)
        : [...currentState.targetIds, targetId];
      return { ...currentState, targetIds: nextTargetIds };
    });
  };

  return (
    <SlidePanel open={open} onClose={onClose} title="Bulk assign compliance requirement" width="min(1000px, 100vw)" panelClassName="vehicle-documents-panel-shell">
      <div className="vehicle-documents-panel vehicle-compliance-panel">
        <div className="vehicle-documents-panel__summary">
          <div>
            <span className="vehicle-documents-panel__eyebrow">Bulk assignment</span>
            <h3>Assign requirements by site or vehicle type</h3>
            <p>Create reusable compliance expectations across the fleet. Reporting widgets compare these assignments against the latest uploaded documents.</p>
          </div>
          <div className="vehicle-documents-panel__mapping">
            <div><span>Target mode</span><strong>{Number(formState.targetType) === 1 ? "Site" : "Vehicle type"}</strong></div>
            <div><span>Selected targets</span><strong>{formState.targetIds.length}</strong></div>
            <div><span>Alert lead</span><strong>{formState.alertLeadDays} days</strong></div>
          </div>
        </div>

        <form className="vehicle-documents-panel__form" onSubmit={onSubmit}>
          <section className="vehicle-documents-panel__section">
            <div className="vehicle-documents-panel__section-header">
              <h4>Requirement definition</h4>
              <p>Define the compliance category, storage type, and default authority once.</p>
            </div>
            <div className="vehicle-documents-panel__field-grid">
              <label className="vehicle-documents-panel__field">
                <span>Requirement name</span>
                <input className="vehicle-documents-panel__input" type="text" value={formState.name} onChange={(event) => setFormState((currentState) => ({ ...currentState, name: event.target.value }))} placeholder="Example: NTSA annual inspection" maxLength={150} />
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Target type</span>
                <select className="vehicle-documents-panel__select" value={formState.targetType} onChange={(event) => setFormState((currentState) => ({ ...currentState, targetType: Number(event.target.value), targetIds: [] }))}>
                  {REQUIREMENT_TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Compliance category</span>
                <select className="vehicle-documents-panel__select" value={formState.complianceCategory} onChange={handleComplianceCategoryChange}>
                  <option value="">Select category</option>
                  {COMPLIANCE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Document type</span>
                <input className="vehicle-documents-panel__input" type="text" value={documentTypeLabel} readOnly disabled />
                <span className="vehicle-documents-panel__hint">Auto-linked from the selected compliance category.</span>
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Alert lead days</span>
                <input className="vehicle-documents-panel__input" type="number" min="0" max="365" value={formState.alertLeadDays} onChange={(event) => setFormState((currentState) => ({ ...currentState, alertLeadDays: event.target.value }))} />
              </label>

              <label className="vehicle-documents-panel__field">
                <span>Default issuing authority</span>
                <input className="vehicle-documents-panel__input" type="text" value={formState.defaultIssuingAuthority} onChange={(event) => setFormState((currentState) => ({ ...currentState, defaultIssuingAuthority: event.target.value }))} placeholder="Default authority for this requirement" maxLength={200} />
              </label>
            </div>
          </section>

          <section className="vehicle-documents-panel__section">
            <div className="vehicle-documents-panel__section-header">
              <h4>Assignment targets</h4>
              <p>Select one or more {Number(formState.targetType) === 1 ? "sites" : "vehicle types"} for this requirement.</p>
            </div>
            <div className="vehicle-compliance-panel__target-grid">
              {targets.map((target) => {
                const targetId = Number(target.siteId ?? target.vehicleTypeId);
                return (
                  <label key={targetId} className="vehicle-compliance-panel__target-option">
                    <input type="checkbox" checked={selectedTargetIds.has(targetId)} onChange={() => toggleTarget(targetId)} />
                    <span>{target.label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="vehicle-documents-panel__section">
            <div className="vehicle-documents-panel__section-header">
              <h4>Notes</h4>
              <p>Use notes to capture policy references or operational context.</p>
            </div>
            <label className="vehicle-documents-panel__field">
              <span>Assignment notes</span>
              <textarea className="vehicle-documents-panel__textarea" rows={4} value={formState.notes} onChange={(event) => setFormState((currentState) => ({ ...currentState, notes: event.target.value }))} placeholder="Optional notes for the assigned requirement" />
            </label>
          </section>

          <div className="vehicle-documents-panel__footer">
            <button type="button" className="vehicle-documents-panel__button vehicle-documents-panel__button--ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="vehicle-documents-panel__button vehicle-documents-panel__button--primary" disabled={isSubmitting}>{isSubmitting ? "Assigning..." : "Create assignments"}</button>
          </div>
        </form>
      </div>
    </SlidePanel>
  );
};

export default VehicleComplianceBulkPanel;
