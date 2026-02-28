/**
 * File: TransferStepApproval.js
 * Purpose: Step 3 of Vehicle Transfer wizard - Signatures, Document Upload, Options, Remarks
 * Dependencies: DevExtreme (SelectBox, TextBox, TextArea, FileUploader)
 * Last Modified: 2026-02-26
 *
 * Key Sections:
 * - Approval flow visual indicator (4-step dot progress)
 * - Signatures (Workshop Manager, Approved By, Sender, Receiver)
 * - Document Upload (PDF/images)
 * - Options (odometer update, maintenance entry, email)
 * - Remarks
 */

import React from "react";
import { SelectBox } from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { TextArea } from "devextreme-react/text-area";
import { FileUploader } from "devextreme-react/file-uploader";

const TransferStepApproval = ({
  formData,
  workshopManagerUsers = [],
  receiverUsers = [],
  documentFile,
  onFieldChange,
  onDocumentChange,
  onWorkshopManagerChange,
  onReceiverUserChange,
}) => {
  return (
    <div className="vtf-step">
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-5">
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-signature m365-section-group__icon" />
            <h3 className="m365-section-group__title">Signatures & Approval</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="vtf-approval-flow tw-mb-5">
              <div className="vtf-approval-flow__step">
                <div className={`vtf-approval-flow__dot ${formData.workshopManagerSign ? "vtf-approval-flow__dot--done" : ""}`}>
                  {formData.workshopManagerSign ? <i className="fa-light fa-check" /> : "1"}
                </div>
                <span className="vtf-approval-flow__label">Workshop Manager</span>
              </div>
              <span className="vtf-approval-flow__line" />
              <div className="vtf-approval-flow__step">
                <div className={`vtf-approval-flow__dot ${formData.approvedBy ? "vtf-approval-flow__dot--done" : ""}`}>
                  {formData.approvedBy ? <i className="fa-light fa-check" /> : "2"}
                </div>
                <span className="vtf-approval-flow__label">Approved By</span>
              </div>
              <span className="vtf-approval-flow__line" />
              <div className="vtf-approval-flow__step">
                <div className={`vtf-approval-flow__dot ${formData.senderName ? "vtf-approval-flow__dot--done" : ""}`}>
                  {formData.senderName ? <i className="fa-light fa-check" /> : "3"}
                </div>
                <span className="vtf-approval-flow__label">Sender</span>
              </div>
              <span className="vtf-approval-flow__line" />
              <div className="vtf-approval-flow__step">
                <div className={`vtf-approval-flow__dot ${formData.receiverName ? "vtf-approval-flow__dot--done" : ""}`}>
                  {formData.receiverName ? <i className="fa-light fa-check" /> : "4"}
                </div>
                <span className="vtf-approval-flow__label">Receiver</span>
              </div>
            </div>

            <div className="m365-field">
              <label className="m365-field__label">
                <i className="fa-light fa-user-gear tw-mr-1" style={{ color: "#0078d4" }} />
                Workshop Manager
              </label>
              <SelectBox
                dataSource={workshopManagerUsers}
                valueExpr="id"
                displayExpr="displayName"
                value={formData.workshopManagerId}
                onValueChanged={onWorkshopManagerChange}
                searchEnabled={true}
                searchExpr={["displayName", "email", "userName", "username"]}
                showClearButton={true}
                placeholder="Search workshop manager user by name or email"
              />
              {formData.workshopManagerSign && (
                <span className="m365-field__hint">Selected: {formData.workshopManagerSign}</span>
              )}
            </div>

            <div className="m365-field">
              <label className="m365-field__label">
                <i className="fa-light fa-badge-check tw-mr-1" style={{ color: "#107c10" }} />
                Approved By
              </label>
              <TextBox
                value={formData.approvedBy}
                onValueChanged={(event) => onFieldChange("approvedBy", event.value)}
                placeholder="Approver name"
              />
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="m365-field">
                <label className="m365-field__label">Sender Name</label>
                <TextBox
                  value={formData.senderName}
                  onValueChanged={(event) => onFieldChange("senderName", event.value)}
                  placeholder="Person sending the vehicle"
                />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Sender Designation</label>
                <TextBox
                  value={formData.senderFunction}
                  onValueChanged={(event) => onFieldChange("senderFunction", event.value)}
                  placeholder="e.g., Site Supervisor"
                />
              </div>
            </div>

            <div className="m365-field">
              <label className="m365-field__label">
                <i className="fa-light fa-user-check tw-mr-1" style={{ color: "#0078d4" }} />
                Receiver User (for notifications)
              </label>
              <SelectBox
                dataSource={receiverUsers}
                valueExpr="id"
                displayExpr="displayName"
                value={formData.receiverUserId}
                onValueChanged={onReceiverUserChange}
                searchEnabled={true}
                searchExpr={["displayName", "email", "userName", "username"]}
                showClearButton={true}
                placeholder="Search receiver user by name or email"
              />
              {formData.receiverUserId && (
                <span className="m365-field__hint">This user will receive dispatch & in-transit notifications</span>
              )}
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="m365-field">
                <label className="m365-field__label">Receiver Name</label>
                <TextBox
                  value={formData.receiverName}
                  onValueChanged={(event) => onFieldChange("receiverName", event.value)}
                  placeholder="Person receiving the vehicle"
                />
              </div>
              <div className="m365-field">
                <label className="m365-field__label">Receiver Designation</label>
                <TextBox
                  value={formData.receiverFunction}
                  onValueChanged={(event) => onFieldChange("receiverFunction", event.value)}
                  placeholder="e.g., Logistics Manager"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="tw-space-y-5">
          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-upload m365-section-group__icon" />
              <h3 className="m365-section-group__title">Document Upload</h3>
            </div>
            <div className="m365-section-group__body">
              <FileUploader
                selectButtonText="Select Transfer Document"
                labelText="or drop file here"
                accept=".pdf,.jpg,.jpeg,.png"
                uploadMode="useForm"
                onValueChanged={(event) => onDocumentChange(event.value?.[0] || null)}
              />
              {documentFile && (
                <p className="tw-mt-2 tw-text-sm" style={{ color: "#107c10" }}>
                  <i className="fa-light fa-check tw-mr-1" />
                  {documentFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-sliders m365-section-group__icon" />
              <h3 className="m365-section-group__title">Options</h3>
            </div>
            <div className="m365-section-group__body">
              <div className="tw-space-y-3">
                <label className="m365-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.updateOdometer}
                    onChange={(event) => onFieldChange("updateOdometer", event.target.checked)}
                  />
                  <span className="m365-checkbox__label">Update vehicle odometer / hour reading</span>
                </label>
                <label className="m365-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.createMaintenanceEntry}
                    onChange={(event) => onFieldChange("createMaintenanceEntry", event.target.checked)}
                  />
                  <span className="m365-checkbox__label">Create maintenance entry for this transfer inspection</span>
                </label>
                <label className="m365-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(event) => onFieldChange("sendEmail", event.target.checked)}
                  />
                  <span className="m365-checkbox__label">Send email notification</span>
                </label>
              </div>
            </div>
          </div>

          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-comment m365-section-group__icon" />
              <h3 className="m365-section-group__title">Remarks</h3>
            </div>
            <div className="m365-section-group__body">
              <TextArea
                value={formData.remarks}
                onValueChanged={(event) => onFieldChange("remarks", event.value)}
                height={100}
                placeholder="Enter any additional remarks..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferStepApproval;
