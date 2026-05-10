/**
 * File: WorkflowHelpPanel.js
 * Purpose: Admin-facing help side panel explaining how to design the staged
 *          completion workflow (stages, actions, drag between lanes, save /
 *          reload behavior, action types and their technician fields).
 * Dependencies: React, SlidePanel
 * Last Modified: 2026-04-23
 */
import React from 'react';
import SlidePanel from '../../../../components/ui/SlidePanel';
import './WorkflowHelpPanel.scss';

const CONCEPTS = [
    {
        icon: 'fa-light fa-layer-group',
        title: 'Stages',
        body:
            'Stages are the horizontal swim lanes on the canvas. They represent the phases of a repair (for example: Diagnose → Repair → Verify). Use the sidebar to add, rename, recolor, reorder or remove a stage. Each stage must have a unique name.'
    },
    {
        icon: 'fa-light fa-diagram-project',
        title: 'Actions',
        body:
            'Actions are the cards that sit inside a stage. They are the concrete tasks a technician can tick when completing an issue. Add an action from the sidebar and then pick its stage. Drag a card between lanes to move it to another stage — the sidebar assignment follows automatically.'
    },
    {
        icon: 'fa-light fa-sliders',
        title: 'Action inspector',
        body:
            'Click any action node on the canvas to open the inspector panel on the right. From there you can rename the action, change its action type, edit the description, toggle Active, and adjust display order.'
    },
    {
        icon: 'fa-light fa-floppy-disk',
        title: 'Save and Reload',
        body:
            'Save workflow persists stage order, action order, stage assignment, active state and node positions in a single transaction. Reload discards in-progress edits and pulls the last saved version. Closing the editor with unsaved changes prompts a discard confirmation.'
    }
];

const ACTION_TYPES = [
    {
        icon: 'fa-light fa-wrench',
        tint: '#deecf9',
        color: '#0078d4',
        label: 'General',
        description: 'The default type. Technicians only capture root cause and notes.',
        capturedFields: ['Root cause (required)', 'Notes']
    },
    {
        icon: 'fa-light fa-microchip',
        tint: '#fff4ce',
        color: '#ca5010',
        label: 'Device Change',
        description:
            'Use for tracking device swaps. The technician panel unlocks device-specific fields and can bind the change to a source vehicle.',
        capturedFields: [
            'Root cause (required)',
            'New device type (required)',
            'New IMEI (required)',
            'Old device type, old IMEI, SIM number',
            'Source vehicle (optional)'
        ]
    },
    {
        icon: 'fa-light fa-camera',
        tint: '#dff6dd',
        color: '#107c10',
        label: 'Camera Install',
        description:
            'Use for camera installs and replacements. Captures camera hardware and mounting position.',
        capturedFields: [
            'Root cause (required)',
            'Camera IMEI (required)',
            'Camera position (required)',
            'Camera SIM number'
        ]
    }
];

const BEST_PRACTICES = [
    'Keep stage names short and process-oriented (Diagnose, Repair, Verify) — not work-order statuses.',
    'One action should equal one thing a technician did. Split "Replace device + update SIM" into two actions so reports stay granular.',
    'Only mark an action Inactive when you want it hidden from new completions — historical completions keep their reference.',
    'Use distinct stage colors so the technician completion panel is easy to scan.',
    'Drag nodes between lanes instead of deleting and recreating — history and references are preserved.'
];

const TROUBLESHOOTING = [
    {
        question: 'Why is Save disabled on mobile?',
        answer:
            'The canvas is read-only on small screens to prevent accidental drags. Open the editor on a desktop to make changes.'
    },
    {
        question: 'I get a concurrency error when I save — what happened?',
        answer:
            'Another admin saved the same workflow after you opened it. Press Reload, re-apply your changes, and save again. The workflow uses RowVersion concurrency to prevent overwrites.'
    },
    {
        question: 'The technician panel shows "No workflow actions configured". Why?',
        answer:
            'Either no actions exist yet, or every action is marked Inactive. Add at least one active action in any stage and save.'
    },
    {
        question: 'Where does the feature flag live?',
        answer:
            'IssueTrackerWorkflowsV2 in the systemconfigurations table. When disabled, the legacy flat action list is used at completion time.'
    }
];

const WorkflowHelpPanel = ({ open, onClose }) => {
    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="Designing the completion workflow"
            width={560}
            panelClassName="workflow-help-panel"
        >
            <div className="workflow-help">
                <div className="workflow-help__intro">
                    <div className="workflow-help__intro-icon" aria-hidden="true">
                        <i className="fa-light fa-circle-question"></i>
                    </div>
                    <div>
                        <h4>Build the staged completion workflow</h4>
                        <p>
                            This editor configures the actions a technician sees when closing an
                            issue for this template. Lay out stages left-to-right, drop the right
                            actions into each lane, and save. The technician side panel reads the
                            same structure in real time — no deploy required.
                        </p>
                    </div>
                </div>

                <section className="workflow-help__section">
                    <h5 className="workflow-help__section-title">Core concepts</h5>
                    <div className="workflow-help__concept-list">
                        {CONCEPTS.map((concept) => (
                            <div key={concept.title} className="workflow-help__concept">
                                <span className="workflow-help__concept-icon" aria-hidden="true">
                                    <i className={concept.icon}></i>
                                </span>
                                <div>
                                    <p className="workflow-help__concept-title">{concept.title}</p>
                                    <p className="workflow-help__concept-body">{concept.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="workflow-help__section">
                    <h5 className="workflow-help__section-title">Action types</h5>
                    <p className="workflow-help__section-text">
                        The action type you pick determines which fields the technician must fill
                        in. Choose the type that matches the task — otherwise completion records
                        will be missing data.
                    </p>
                    <div className="workflow-help__type-list">
                        {ACTION_TYPES.map((type) => (
                            <div key={type.label} className="workflow-help__type-card">
                                <div className="workflow-help__type-header">
                                    <span
                                        className="workflow-help__type-icon"
                                        style={{ backgroundColor: type.tint, color: type.color }}
                                        aria-hidden="true"
                                    >
                                        <i className={type.icon}></i>
                                    </span>
                                    <div>
                                        <span
                                            className="workflow-help__type-label"
                                            style={{ backgroundColor: type.tint, color: type.color }}
                                        >
                                            {type.label}
                                        </span>
                                        <p className="workflow-help__type-description">{type.description}</p>
                                    </div>
                                </div>
                                <p className="workflow-help__type-capture-label">Technician captures:</p>
                                <ul className="workflow-help__field-list">
                                    {type.capturedFields.map((field) => (
                                        <li key={field}>{field}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="workflow-help__section">
                    <h5 className="workflow-help__section-title">Best practices</h5>
                    <ul className="workflow-help__tip-list">
                        {BEST_PRACTICES.map((tip) => (
                            <li key={tip} className="workflow-help__tip">
                                <i className="fa-light fa-lightbulb" aria-hidden="true"></i>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="workflow-help__section">
                    <h5 className="workflow-help__section-title">Troubleshooting</h5>
                    <div className="workflow-help__faq-list">
                        {TROUBLESHOOTING.map((item) => (
                            <div key={item.question} className="workflow-help__faq">
                                <p className="workflow-help__faq-question">
                                    <i className="fa-light fa-circle-question" aria-hidden="true"></i>
                                    <span>{item.question}</span>
                                </p>
                                <p className="workflow-help__faq-answer">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="workflow-help__footer">
                    <button type="button" className="workflow-help__close" onClick={onClose}>
                        <i className="fa-light fa-xmark" aria-hidden="true"></i>
                        <span>Close help</span>
                    </button>
                </div>
            </div>
        </SlidePanel>
    );
};

export default WorkflowHelpPanel;
