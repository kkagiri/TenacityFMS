/**
 * File: WorkflowCanvas.js
 * Purpose: Render the staged React Flow canvas for the workflow editor.
 * Dependencies: React, @xyflow/react, workflow editor constants
 * Last Modified: 2026-04-23
 */
import React from 'react';
import {
    Background,
    Controls,
    Handle,
    MiniMap,
    Position,
    ReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ACTION_TYPE_META, ACTION_TYPE_OPTIONS, getStageTop } from './useWorkflowEditor';

const ActionNode = ({ data, selected }) => {
    const typeMeta = ACTION_TYPE_META[data.actionType] || ACTION_TYPE_META.General;

    return (
        <div
            className={`issue-template-workflow-panel__node${selected ? ' is-selected' : ''}${data.isActive ? '' : ' is-inactive'}`}
            style={{ '--node-accent': typeMeta.color, '--node-tint': typeMeta.tint }}
        >
            <Handle type="target" position={Position.Left} className="issue-template-workflow-panel__handle" />
            <div className="issue-template-workflow-panel__node-header">
                <span className="issue-template-workflow-panel__node-icon">
                    <i className={typeMeta.icon}></i>
                </span>
                <div className="issue-template-workflow-panel__node-copy">
                    <strong>{data.name}</strong>
                    <span>{ACTION_TYPE_OPTIONS.find((option) => option.value === data.actionType)?.text || 'General'}</span>
                </div>
            </div>
            {data.description && <p className="issue-template-workflow-panel__node-description">{data.description}</p>}
            <Handle type="source" position={Position.Right} className="issue-template-workflow-panel__handle" />
        </div>
    );
};

const nodeTypes = { actionNode: ActionNode };

const WorkflowCanvas = ({ nodes, edges, stages, laneHeight, readOnly, onNodesChange, onNodeClick }) => (
    <section className="issue-template-workflow-panel__canvas-shell">
        <div className="issue-template-workflow-panel__canvas-toolbar">
            <div>
                <span className="issue-template-workflow-panel__section-label">Canvas</span>
                <h4>Arrange actions across stages</h4>
            </div>
            <span className="issue-template-workflow-panel__helper-text">
                Drag nodes between lanes or use the action inspector to change stage assignment. Saved positions are reused on reload.
            </span>
        </div>

        <div className="issue-template-workflow-panel__canvas" style={{ height: `${laneHeight}px` }}>
            <div className="issue-template-workflow-panel__lanes" aria-hidden="true">
                {stages.map((stage) => (
                    <div
                        key={stage.id}
                        className="issue-template-workflow-panel__lane"
                        style={{ top: `${getStageTop(stage.sortOrder)}px`, borderColor: `${stage.color}33`, backgroundColor: `${stage.color}0f` }}
                    >
                        <div className="issue-template-workflow-panel__lane-label">
                            <span className="issue-template-workflow-panel__stage-dot" style={{ backgroundColor: stage.color }}></span>
                            <span>{stage.name}</span>
                        </div>
                    </div>
                ))}
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={readOnly ? undefined : onNodesChange}
                onNodeClick={readOnly ? undefined : onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.45}
                maxZoom={1.4}
                nodesDraggable={!readOnly}
                nodesConnectable={false}
                elementsSelectable={!readOnly}
                className="issue-template-workflow-panel__reactflow"
            >
                <Background gap={24} size={1} color="#d2d0ce" />
                <MiniMap pannable zoomable />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    </section>
);

export default WorkflowCanvas;