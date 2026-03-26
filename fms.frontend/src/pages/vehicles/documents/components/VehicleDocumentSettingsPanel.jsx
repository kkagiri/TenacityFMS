/**
 * File: VehicleDocumentSettingsPanel.jsx
 * Purpose: Side-panel editor for vehicle document reminder defaults and issuing authority management.
 * Dependencies: React, react-router-dom, SlidePanel, shared vehicle document metadata.
 * Last Modified: 2026-03-25
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SlidePanel from "../../../../components/ui/SlidePanel";
import {
  COMPLIANCE_CATEGORY_OPTIONS,
  DEFAULT_NOTIFICATION_REMINDER_SETTINGS,
} from "../VehicleDocuments.shared";

const VehicleDocumentSettingsPanel = ({
  open,
  onClose,
  loading,
  saving,
  notificationDefaults,
  onSaveNotificationDefaults,
  issuingAuthorities,
  authoritySaving,
  onRenameAuthority,
  onDeleteAuthority,
  canEdit = true,
}) => {
  const navigate = useNavigate();
  const [draftDefaults, setDraftDefaults] = useState({ ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS });
  const [editingAuthorityName, setEditingAuthorityName] = useState("");
  const [editingAuthorityValue, setEditingAuthorityValue] = useState("");

  useEffect(() => {
    if (open) {
      setDraftDefaults({ ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS, ...(notificationDefaults || {}) });
      setEditingAuthorityName("");
      setEditingAuthorityValue("");
    }
  }, [notificationDefaults, open]);

  const changedCount = useMemo(
    () => COMPLIANCE_CATEGORY_OPTIONS.filter((option) => Number(draftDefaults[option.value]) !== Number(notificationDefaults?.[option.value] ?? DEFAULT_NOTIFICATION_REMINDER_SETTINGS[option.value] ?? 30)).length,
    [draftDefaults, notificationDefaults]
  );

  const handleSave = async () => {
    await onSaveNotificationDefaults(draftDefaults);
  };

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Vehicle document settings"
      width="min(1080px, 100vw)"
      panelClassName="vehicle-documents-panel-shell"
    >
      <div className="vehicle-documents-panel vehicle-document-settings-panel">
        <div className="vehicle-documents-panel__summary">
          <div>
            <span className="vehicle-documents-panel__eyebrow">Advanced settings</span>
            <h3>Your reminder defaults and issuing authorities</h3>
            <p>Set the reminder lead days that should prefill the add-document form for your account and maintain the issuing authority names used across compliance requirements and uploaded records.</p>
          </div>
          <div className="vehicle-documents-panel__mapping">
            <div><span>Changed defaults</span><strong>{changedCount}</strong></div>
            <div><span>Known authorities</span><strong>{issuingAuthorities.length}</strong></div>
            <div><span>Reminder scope</span><strong>Per user</strong></div>
          </div>
        </div>

        <section className="vehicle-documents-panel__section">
          <div className="vehicle-documents-panel__section-header">
            <h4>Reminder defaults</h4>
            <p>These values prefill the add-document form for you. Set a value to 0 if a category should not enable reminders by default.</p>
          </div>

          <div className="vehicle-document-settings-panel__reminder-grid">
            {COMPLIANCE_CATEGORY_OPTIONS.map((option) => (
              <label key={option.value} className="vehicle-document-settings-panel__reminder-card">
                <span>{option.label}</span>
                <div className="vehicle-document-settings-panel__reminder-input-row">
                  <input
                    className="vehicle-documents-panel__input"
                    type="number"
                    min="0"
                    max="365"
                    value={draftDefaults[option.value] ?? 30}
                    onChange={(event) => setDraftDefaults((currentState) => ({
                      ...currentState,
                      [option.value]: Math.max(0, Math.min(365, Number(event.target.value || 0))),
                    }))}
                  />
                  <span className="vehicle-documents-panel__inline-label">days</span>
                </div>
              </label>
            ))}
          </div>

          <div className="vehicle-documents-panel__footer vehicle-documents-panel__footer--inline">
            <button type="button" className="vehicle-documents-panel__button vehicle-documents-panel__button--ghost" onClick={() => setDraftDefaults({ ...DEFAULT_NOTIFICATION_REMINDER_SETTINGS, ...(notificationDefaults || {}) })} disabled={saving || loading || !canEdit}>Reset</button>
            <button type="button" className="vehicle-documents-panel__button vehicle-documents-panel__button--primary" onClick={handleSave} disabled={saving || loading || !canEdit}>{saving ? "Saving..." : "Save my reminder defaults"}</button>
          </div>
        </section>

        <section className="vehicle-documents-panel__section">
          <div className="vehicle-documents-panel__section-header">
            <h4>Notification template path</h4>
            <p>Vehicle document expiry alerts now flow through event expressions. Use the event expression editor to scope alerts by site, vehicle, or vehicle type and override the quick-start template when needed.</p>
          </div>
          <div className="vehicle-document-settings-panel__callout">
            <div>
              <strong>Current delivery flow</strong>
              <p>The background service raises a dedicated vehicle document compliance event. The default email uses a clean Microsoft 365 style card and includes a document download button when the record has a stored file.</p>
            </div>
            <button type="button" className="vehicle-documents-panel__button vehicle-documents-panel__button--ghost" onClick={() => navigate("/event-expressions")}>Open event expressions</button>
          </div>
        </section>

        <section className="vehicle-documents-panel__section">
          <div className="vehicle-documents-panel__section-header">
            <h4>Issuing authority management</h4>
            <p>Rename or clear persisted authority labels across existing compliance requirements and vehicle documents.</p>
          </div>

          <div className="vehicle-document-settings-panel__authority-table">
            <div className="vehicle-document-settings-panel__authority-head">
              <span>Name</span>
              <span>Documents</span>
              <span>Requirements</span>
              <span>Actions</span>
            </div>
            {issuingAuthorities.map((authority) => {
              const isEditing = editingAuthorityName === authority.name;

              return (
                <div key={authority.name} className="vehicle-document-settings-panel__authority-row">
                  <div>
                    {isEditing ? (
                      <input className="vehicle-documents-panel__input" type="text" value={editingAuthorityValue} onChange={(event) => setEditingAuthorityValue(event.target.value)} maxLength={200} />
                    ) : (
                      <strong>{authority.name}</strong>
                    )}
                  </div>
                  <span>{authority.documentUsageCount}</span>
                  <span>{authority.requirementUsageCount}</span>
                  <div className="vehicle-document-settings-panel__authority-actions">
                    {isEditing ? (
                      <>
                        <button type="button" className="vehicle-documents-panel__mini-button" onClick={() => onRenameAuthority(authority.name, editingAuthorityValue)} disabled={authoritySaving || !canEdit}>Save</button>
                        <button type="button" className="vehicle-documents-panel__mini-button" onClick={() => { setEditingAuthorityName(""); setEditingAuthorityValue(""); }} disabled={authoritySaving}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="vehicle-documents-panel__mini-button" onClick={() => { setEditingAuthorityName(authority.name); setEditingAuthorityValue(authority.name); }} disabled={authoritySaving || !canEdit}>Edit</button>
                        <button type="button" className="vehicle-documents-panel__mini-button vehicle-documents-panel__mini-button--danger" onClick={() => onDeleteAuthority(authority.name)} disabled={authoritySaving || !canEdit}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {issuingAuthorities.length === 0 ? (
              <div className="vehicle-document-settings-panel__empty">No issuing authorities are stored yet.</div>
            ) : null}
          </div>
        </section>
      </div>
    </SlidePanel>
  );
};

export default VehicleDocumentSettingsPanel;