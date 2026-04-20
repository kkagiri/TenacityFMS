/**
 * File: WarningLetterSignaturePanel.js
 * Purpose: Collects signature request recipients and CC members for a warning letter.
 * Dependencies: React, devextreme-react/select-box, devextreme-react/tag-box, SlidePanel
 * Last Modified: 2026-04-20
 *
 * Key Functions:
 * - WarningLetterSignaturePanel(): Renders the signature request picker UI.
 */
import React from "react";
import SelectBox from "devextreme-react/select-box";
import TagBox from "devextreme-react/tag-box";
import SlidePanel from "../../../../components/ui/SlidePanel";

const WarningLetterSignaturePanel = ({
    open,
    onClose,
    submitting,
    canSubmit,
    onSubmit,
    signatureRecipientOptions,
    signatureRecipients,
    signatureCcRecipients,
    availableSignatureCcRecipients,
    signatureRecipientsLoading,
    selectedSignatureRecipientId,
    selectedCcRecipientIds,
    onSignatureRecipientChanged,
    onCcRecipientsChanged,
    showSignatureGroupWarning,
    canEditSignatureRecipients,
    onEditRecipientGroup,
    siteId,
}) => (
    <SlidePanel
        open={open}
        onClose={() => !submitting && onClose()}
        title="Request Signature"
        width={520}
        panelClassName="warning-letter-preview__signature-panel"
    >
        <div className="warning-letter-preview__signature-picker">
            <div className="warning-letter-preview__signature-picker-header">
                <div>
                    <div className="warning-letter-preview__signature-picker-titlebar">
                        <h3>Select Site Representative</h3>
                    </div>
                    <p>Select from the site's warning-letter notification groups. In-app notification is only sent to configured site users.</p>

                </div>
            </div>

            <div className="warning-letter-preview__signature-picker-field">
                <div className="warning-letter-preview__signature-picker-label-row">
                    <span>
                        Site Representative
                        <strong className="warning-letter-preview__signature-picker-count">{signatureRecipients.length}</strong>
                    </span>
                    {canEditSignatureRecipients && (
                        <button
                            type="button"
                            className="m365-icon-btn"
                            title="Edit site representative group"
                            aria-label="Edit site representative group"
                            onClick={() => onEditRecipientGroup(signatureRecipientOptions.siteRepresentativeGroupName)}
                            disabled={!siteId || submitting}
                        >
                            <i className="fa-light fa-pen-to-square" />
                        </button>
                    )}
                </div>
                <small>
                    This list shows only direct user members of <strong>{signatureRecipientOptions.siteRepresentativeGroupName}</strong>.
                    Role-based group members are ignored here.
                </small>
                {showSignatureGroupWarning && (
                    <div className="warning-letter-preview__signature-picker-warning">
                        <i className="fa-light fa-triangle-exclamation" />
                        <span>
                            Site Representatives is empty, but Signature CC already has {signatureCcRecipients.length} member{signatureCcRecipients.length !== 1 ? "s" : ""}. Add at least one user to the Site Representatives group before sending a signature request.
                        </span>
                    </div>
                )}
                <SelectBox
                    dataSource={signatureRecipients}
                    value={selectedSignatureRecipientId}
                    onValueChanged={onSignatureRecipientChanged}
                    valueExpr="id"
                    displayExpr={(item) => item ? `${item.userName || "Unknown"}${item.email ? ` (${item.email})` : ""}` : ""}
                    searchEnabled={true}
                    searchExpr={["userName", "email"]}
                    placeholder={signatureRecipientsLoading ? "Loading site representatives..." : "Search and select a site representative"}
                    showClearButton={true}
                    disabled={signatureRecipientsLoading || submitting}
                    noDataText={`No user members configured in ${signatureRecipientOptions.siteRepresentativeGroupName}`}
                    stylingMode="outlined"
                />
            </div>

            <div className="warning-letter-preview__signature-picker-field">
                <div className="warning-letter-preview__signature-picker-label-row">
                    <span>
                        CC Recipients
                        <strong className="warning-letter-preview__signature-picker-count">{signatureCcRecipients.length}</strong>
                    </span>
                    {canEditSignatureRecipients && (
                        <button
                            type="button"
                            className="m365-icon-btn"
                            title="Edit signature CC group"
                            aria-label="Edit signature CC group"
                            onClick={() => onEditRecipientGroup(signatureRecipientOptions.signatureCcGroupName)}
                            disabled={!siteId || submitting}
                        >
                            <i className="fa-light fa-pen-to-square" />
                        </button>
                    )}
                </div>
                <small>
                    This list shows only direct user members of <strong>{signatureRecipientOptions.signatureCcGroupName}</strong>.
                    Add any site user to that group from Notification Recipient Management if they need CC access. The user sending this request is always CC'd automatically.
                </small>
                <TagBox
                    dataSource={availableSignatureCcRecipients}
                    value={selectedCcRecipientIds}
                    onValueChanged={(event) => onCcRecipientsChanged(Array.isArray(event.value) ? event.value : [])}
                    valueExpr="id"
                    displayExpr={(item) => item ? `${item.userName || "Unknown"}${item.email ? ` (${item.email})` : ""}` : ""}
                    searchEnabled={true}
                    searchExpr={["userName", "email"]}
                    placeholder={signatureRecipientsLoading ? "Loading additional recipients..." : "Optional CC recipients at this site"}
                    showClearButton={true}
                    noDataText={`No recipients configured in ${signatureRecipientOptions.signatureCcGroupName}`}
                    disabled={signatureRecipientsLoading || submitting}
                    stylingMode="outlined"
                />
            </div>

            <div className="warning-letter-preview__signature-picker-actions">
                <button type="button" className="m365-btn m365-btn--ghost" onClick={onClose} disabled={submitting}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="m365-btn m365-btn--primary"
                    onClick={onSubmit}
                    disabled={!canSubmit}
                >
                    <i className="fa-light fa-paper-plane-top" /> {submitting ? "Sending..." : "Send Request"}
                </button>
            </div>
        </div>
    </SlidePanel>
);

export default WarningLetterSignaturePanel;
