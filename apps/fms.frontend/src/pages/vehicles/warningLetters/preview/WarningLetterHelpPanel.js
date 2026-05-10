/**
 * File: WarningLetterHelpPanel.js
 * Purpose: Renders the warning letter workflow help content in a slide panel.
 * Dependencies: React, SlidePanel
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - WarningLetterHelpPanel(): Displays the document workflow checklist and notes.
 */
import React from "react";
import SlidePanel from "../../../../components/ui/SlidePanel";

const WarningLetterHelpPanel = ({ open, onClose }) => (
    <SlidePanel
        open={open}
        onClose={onClose}
        title="Document Procedure"
        width={440}
        panelClassName="warning-letter-preview__help-panel"
    >
        <div className="warning-letter-preview__help-panel-body">
            <div className="warning-letter-preview__help-panel-intro">
                <i className="fa-light fa-circle-info" />
                <span>Use this checklist on the preview page to keep the issued document consistent through approval, signature, and acknowledgement.</span>
            </div>

            <div className="warning-letter-preview__help-section">
                <h3>Procedure</h3>
                <ol className="warning-letter-preview__help-list">
                    <li>Review the PDF preview on the right and confirm the employee, vehicle, site, and violation details are correct.</li>
                    <li>If you changed document content, use Regenerate PDF before uploading any workflow documents.</li>
                    <li>Upload the approved letter once management confirms the final version. After signature is requested, the approved copy should not be changed.</li>
                    <li>Send Request Signature to the site representative only after the approved letter is in place.</li>
                    <li>When the signed document comes back, upload the signed copy to lock the issued workflow record.</li>
                    <li>Use Acknowledge only after the signed copy is complete and the employee response has been captured.</li>
                </ol>
            </div>

            <div className="warning-letter-preview__help-section">
                <h3>Important Notes</h3>
                <ul className="warning-letter-preview__help-list warning-letter-preview__help-list--unordered">
                    <li>Regenerating the PDF after a signed copy exists is disabled to preserve the issued document.</li>
                    <li>The Approved Letter and Signed Copy sections on the left show the current workflow status for quick checking.</li>
                    <li>If anything is wrong in the PDF, go back to Edit before continuing with approval or signature steps.</li>
                </ul>
            </div>
        </div>
    </SlidePanel>
);

export default WarningLetterHelpPanel;
