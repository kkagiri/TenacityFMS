/**
 * File: DiscardConfirmPanel.js
 * Purpose: Render dirty-close confirmation in a nested SlidePanel.
 * Dependencies: React, SlidePanel
 * Last Modified: 2026-04-23
 */
import React from 'react';
import SlidePanel from '../../../../components/ui/SlidePanel';

const DiscardConfirmPanel = ({ open, onKeepEditing, onDiscard }) => (
    <SlidePanel
        open={open}
        onClose={onKeepEditing}
        title="Discard unsaved workflow changes?"
        width={420}
    >
        <div className="issue-template-workflow-panel__panel-copy">
            <p>Your staged workflow changes have not been saved yet. Closing now will discard them.</p>
        </div>
        <div className="issue-template-workflow-panel__panel-actions">
            <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--ghost" onClick={onKeepEditing}>
                Keep editing
            </button>
            <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--danger" onClick={onDiscard}>
                Discard changes
            </button>
        </div>
    </SlidePanel>
);

export default DiscardConfirmPanel;