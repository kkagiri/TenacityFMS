/**
 * File: IssueCompletionHelpPanel.js
 * Purpose: Technician-facing help side panel explaining how to complete an issue
 *          using the staged workflow (selection, root cause, device / camera
 *          capture, review and submit).
 * Dependencies: React, SlidePanel
 * Last Modified: 2026-04-23
 */
import React from 'react';
import SlidePanel from '../../../components/ui/SlidePanel';
import './IssueCompletionHelpPanel.scss';

const STEP_GUIDE = [
    {
        icon: 'fa-light fa-list-check',
        title: '1. Select the actions you performed',
        body: 'Tick every action that applies from the configured workflow. Actions are grouped by stage so you can scan the repair journey left-to-right. If the work you did is not listed, open "Add a custom action" at the bottom and type your own.'
    },
    {
        icon: 'fa-light fa-pen-to-square',
        title: '2. Capture details for each action',
        body: 'Every selected action expands into its own card. Fill in the root cause (always required) and any action-specific fields. Fields marked with an asterisk must be completed before you can submit.'
    },
    {
        icon: 'fa-light fa-circle-check',
        title: '3. Review and submit',
        body: 'Scroll to the "Review and submit" section. Cards marked "Ready" are complete. Cards marked "Needs attention" still have missing required fields — fix them before pressing Complete issue.'
    }
];

const ACTION_TYPES = [
    {
        icon: 'fa-light fa-wrench',
        tint: '#deecf9',
        color: '#0078d4',
        label: 'General',
        description: 'Use for inspections, adjustments, cleaning or any work without a device or camera change.',
        fields: ['Root cause (required)', 'Action notes (optional)']
    },
    {
        icon: 'fa-light fa-microchip',
        tint: '#fff4ce',
        color: '#ca5010',
        label: 'Device Change',
        description: 'Use when you swapped or installed a GPS / tracking device on the vehicle.',
        fields: [
            'Root cause (required)',
            'New device type (required)',
            'New IMEI (required)',
            'Old device type, old IMEI, SIM number (optional but recommended)',
            'Source vehicle — only when the device was moved from another vehicle'
        ]
    },
    {
        icon: 'fa-light fa-camera',
        tint: '#dff6dd',
        color: '#107c10',
        label: 'Camera Install',
        description: 'Use when you installed or replaced a camera on the vehicle.',
        fields: [
            'Root cause (required)',
            'Camera IMEI (required)',
            'Camera position (required — Front, Rear, Interior, etc.)',
            'Camera SIM number (optional)'
        ]
    }
];

const TIPS = [
    'Root cause should describe WHY the fault happened — not just what you did. Example: "Wiring harness chafed against the chassis and shorted the power line."',
    'You can select more than one action. Pick every task you performed so the completion record is accurate.',
    'If you cannot see any actions, the template administrator has not built a workflow yet. You can still complete the issue by adding a custom action.',
    'Once submitted the issue is marked as Completed and the captured details are stored in the issue history — they cannot be edited from this panel.'
];

const IssueCompletionHelpPanel = ({ open, onClose }) => {
    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="How to complete an issue"
            width={520}
            panelClassName="issue-completion-help-panel"
        >
            <div className="issue-completion-help">
                <div className="issue-completion-help__intro">
                    <div className="issue-completion-help__intro-icon" aria-hidden="true">
                        <i className="fa-light fa-circle-question"></i>
                    </div>
                    <div>
                        <h4>Completing an issue in three steps</h4>
                        <p>
                            This side panel walks you through the staged workflow your fleet
                            administrator configured for this issue type. Follow the three
                            steps below and the Complete button will light up once every
                            required field is filled.
                        </p>
                    </div>
                </div>

                <section className="issue-completion-help__section">
                    <h5 className="issue-completion-help__section-title">Workflow steps</h5>
                    <ol className="issue-completion-help__steps">
                        {STEP_GUIDE.map((step) => (
                            <li key={step.title} className="issue-completion-help__step">
                                <span className="issue-completion-help__step-icon" aria-hidden="true">
                                    <i className={step.icon}></i>
                                </span>
                                <div>
                                    <p className="issue-completion-help__step-title">{step.title}</p>
                                    <p className="issue-completion-help__step-body">{step.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="issue-completion-help__section">
                    <h5 className="issue-completion-help__section-title">Action types and required fields</h5>
                    <p className="issue-completion-help__section-text">
                        Different action types ask for different details. Use the right type so
                        downstream reports stay clean.
                    </p>
                    <div className="issue-completion-help__type-list">
                        {ACTION_TYPES.map((type) => (
                            <div key={type.label} className="issue-completion-help__type-card">
                                <div className="issue-completion-help__type-header">
                                    <span
                                        className="issue-completion-help__type-icon"
                                        style={{ backgroundColor: type.tint, color: type.color }}
                                        aria-hidden="true"
                                    >
                                        <i className={type.icon}></i>
                                    </span>
                                    <div>
                                        <span
                                            className="issue-completion-help__type-label"
                                            style={{ backgroundColor: type.tint, color: type.color }}
                                        >
                                            {type.label}
                                        </span>
                                        <p className="issue-completion-help__type-description">{type.description}</p>
                                    </div>
                                </div>
                                <ul className="issue-completion-help__field-list">
                                    {type.fields.map((field) => (
                                        <li key={field}>{field}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="issue-completion-help__section">
                    <h5 className="issue-completion-help__section-title">Tips for a clean completion</h5>
                    <ul className="issue-completion-help__tip-list">
                        {TIPS.map((tip) => (
                            <li key={tip} className="issue-completion-help__tip">
                                <i className="fa-light fa-lightbulb" aria-hidden="true"></i>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="issue-completion-help__footer">
                    <button type="button" className="issue-completion-help__close" onClick={onClose}>
                        <i className="fa-light fa-xmark" aria-hidden="true"></i>
                        <span>Close help</span>
                    </button>
                </div>
            </div>
        </SlidePanel>
    );
};

export default IssueCompletionHelpPanel;
