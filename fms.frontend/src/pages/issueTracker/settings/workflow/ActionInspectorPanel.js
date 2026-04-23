/**
 * File: ActionInspectorPanel.js
 * Purpose: Render the nested action inspector side panel for workflow nodes.
 * Dependencies: React, SlidePanel, workflow editor constants
 * Last Modified: 2026-04-23
 */
import React from 'react';
import SlidePanel from '../../../../components/ui/SlidePanel';
import { ACTION_TYPE_OPTIONS } from './useWorkflowEditor';

const ActionInspectorPanel = ({ open, node, stages, onClose, onNodeChange }) => (
    <SlidePanel
        open={open}
        onClose={onClose}
        title={node ? `Edit action: ${node.data.name}` : 'Action inspector'}
        width={420}
    >
        {node ? (
            <div
                className="issue-template-workflow-panel__stack"
                style={{ padding: '20px 24px 28px' }}
            >
                <label className="issue-template-workflow-panel__field">
                    <span>Name</span>
                    <input
                        type="text"
                        value={node.data.name}
                        onChange={(event) => onNodeChange('name', event.target.value)}
                        className="issue-template-workflow-panel__input"
                    />
                </label>

                <label className="issue-template-workflow-panel__field">
                    <span>Action type</span>
                    <select
                        value={node.data.actionType}
                        onChange={(event) => onNodeChange('actionType', event.target.value)}
                        className="issue-template-workflow-panel__select"
                    >
                        {ACTION_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.text}</option>
                        ))}
                    </select>
                </label>

                <label className="issue-template-workflow-panel__field">
                    <span>Stage</span>
                    <select
                        value={node.data.stageId}
                        onChange={(event) => onNodeChange('stageId', event.target.value)}
                        className="issue-template-workflow-panel__select"
                    >
                        {stages.map((stage) => (
                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                        ))}
                    </select>
                </label>

                <label className="issue-template-workflow-panel__field issue-template-workflow-panel__field--full">
                    <span>Description</span>
                    <textarea
                        rows={5}
                        value={node.data.description}
                        onChange={(event) => onNodeChange('description', event.target.value)}
                        className="issue-template-workflow-panel__textarea"
                    />
                </label>

                <label className="issue-template-workflow-panel__checkbox">
                    <input
                        type="checkbox"
                        checked={node.data.isActive}
                        onChange={(event) => onNodeChange('isActive', event.target.checked)}
                    />
                    <span>Active in technician completion panel</span>
                </label>

                <div className="issue-template-workflow-panel__info-card">
                    <strong>Field visibility</strong>
                    <p>
                        {node.data.actionType === 'DeviceChange' && 'Technicians will capture device IMEIs, device type, phone number, and source vehicle.'}
                        {node.data.actionType === 'CameraInstall' && 'Technicians will capture camera IMEI, position, and SIM number.'}
                        {node.data.actionType === 'General' && 'Technicians will capture root cause and action notes only.'}
                    </p>
                </div>
            </div>
        ) : null}
    </SlidePanel>
);

export default ActionInspectorPanel;