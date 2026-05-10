/**
 * File: IssueTemplateWorkflowPanel.js
 * Purpose: Staged workflow canvas editor for issue template completion configuration.
 * Dependencies: React, ReactFlowProvider, workflow editor subcomponents
 * Last Modified: 2026-04-24
 */
import React, { useEffect, useState } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import { ReactFlowProvider } from '@xyflow/react';
import StageList from './workflow/StageList';
import WorkflowCanvas from './workflow/WorkflowCanvas';
import ActionInspectorPanel from './workflow/ActionInspectorPanel';
import DiscardConfirmPanel from './workflow/DiscardConfirmPanel';
import WorkflowHelpPanel from './workflow/WorkflowHelpPanel';
import { useWorkflowEditor } from './workflow/useWorkflowEditor';
import './IssueTemplateWorkflowPanel.scss';

const IssueTemplateWorkflowPanel = ({ templateId, templateName, closeSignal = 0, onCloseApproved }) => {
    const editor = useWorkflowEditor({ templateId, templateName });
    const { requestClose } = editor;
    const [helpOpen, setHelpOpen] = useState(false);

    useEffect(() => {
        if (closeSignal > 0) {
            requestClose(onCloseApproved);
        }
    }, [closeSignal, onCloseApproved, requestClose]);

    if (editor.loading) {
        return (
            <div className="issue-template-workflow-panel__loading">
                <LoadIndicator visible={true} height={28} width={28} />
                <span>Loading workflow...</span>
            </div>
        );
    }

    return (
        <ReactFlowProvider>
            <div className="issue-template-workflow-panel">
                <div className="issue-template-workflow-panel__banner">
                    <div>
                        <p className="issue-template-workflow-panel__eyebrow">Completion workflow</p>
                        <h3>{templateName ? `Workflow for ${templateName}` : 'Workflow editor'}</h3>
                        <p>The staged canvas now reads and saves through the workflow endpoints. Stage order, action order, stage assignment, active state, and node positions persist together.</p>
                    </div>
                    <div className="issue-template-workflow-panel__banner-actions">
                        <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--ghost" onClick={() => setHelpOpen(true)}>
                            <i className="fa-light fa-circle-question"></i>
                            <span>Help</span>
                        </button>
                        <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--ghost" onClick={editor.loadWorkflow} disabled={editor.saving}>
                            <i className="fa-light fa-rotate-right"></i>
                            <span>Reload</span>
                        </button>
                        <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--ghost" onClick={() => requestClose(onCloseApproved)}>
                            <i className="fa-light fa-arrow-right-from-bracket"></i>
                            <span>Close</span>
                        </button>
                        <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--primary" onClick={editor.saveWorkflow} disabled={editor.saving || editor.isMobile}>
                            {editor.saving ? 'Saving workflow...' : 'Save workflow'}
                        </button>
                    </div>
                </div>

                {editor.isMobile ? (
                    <div className="issue-template-workflow-panel__mobile-banner">
                        <i className="fa-light fa-circle-info"></i>
                        <span>Workflow editing requires desktop. Mobile currently shows the workflow in read-only mode.</span>
                    </div>
                ) : null}

                <div className={`issue-template-workflow-panel__layout${editor.isMobile ? ' is-mobile' : ''}`}>
                    <StageList
                        stages={editor.stages}
                        stageActionCounts={editor.stageActionCounts}
                        selectedStageId={editor.selectedStageId}
                        readOnly={editor.isMobile}
                        selectedNode={editor.selectedNode}
                        deleteStageTarget={editor.deleteStageTarget}
                        onSelectStage={editor.selectStage}
                        onStageChange={editor.updateStage}
                        onMoveStage={editor.moveStage}
                        onAddStage={editor.addStage}
                        onAddAction={editor.addAction}
                        onRemoveSelectedAction={editor.removeSelectedAction}
                        onRequestDeleteStage={editor.requestDeleteStage}
                        onCancelDeleteStage={editor.cancelDeleteStage}
                        onConfirmDeleteStage={editor.confirmDeleteStage}
                    />

                    {editor.isMobile ? (
                        <section className="issue-template-workflow-panel__canvas-shell issue-template-workflow-panel__canvas-shell--readonly">
                            <div className="issue-template-workflow-panel__canvas-toolbar">
                                <div>
                                    <span className="issue-template-workflow-panel__section-label">Read only</span>
                                    <h4>Workflow summary</h4>
                                </div>
                            </div>
                            <div className="issue-template-workflow-panel__read-only-summary">
                                {editor.stages.map((stage) => (
                                    <div key={stage.id} className="issue-template-workflow-panel__summary-card">
                                        <div className="issue-template-workflow-panel__lane-label issue-template-workflow-panel__lane-label--static">
                                            <span className="issue-template-workflow-panel__stage-dot" style={{ backgroundColor: stage.color }}></span>
                                            <span>{stage.name}</span>
                                        </div>
                                        <p>{editor.stageActionCounts[stage.id] || 0} configured action{editor.stageActionCounts[stage.id] === 1 ? '' : 's'}.</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <WorkflowCanvas
                            nodes={editor.nodes}
                            edges={editor.edges}
                            stages={editor.stages}
                            laneHeight={editor.laneHeight}
                            readOnly={false}
                            onNodesChange={editor.handleNodesChange}
                            onNodeDragStop={editor.handleNodeDragStop}
                            onNodeClick={(_, node) => editor.selectNode(node.id)}
                        />
                    )}
                </div>

                <ActionInspectorPanel
                    open={!editor.isMobile && Boolean(editor.selectedNode)}
                    node={editor.selectedNode}
                    stages={editor.stages}
                    onClose={editor.closeInspector}
                    onNodeChange={editor.updateNode}
                />

                <DiscardConfirmPanel
                    open={editor.discardOpen}
                    onKeepEditing={editor.cancelDiscardClose}
                    onDiscard={editor.confirmDiscardClose}
                />

                <WorkflowHelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
            </div>
        </ReactFlowProvider>
    );
};

export default IssueTemplateWorkflowPanel;
