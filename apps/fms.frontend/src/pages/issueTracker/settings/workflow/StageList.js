/**
 * File: StageList.js
 * Purpose: Render the workflow stage rail, color policy controls, and stage delete confirmation.
 * Dependencies: React, SlidePanel
 * Last Modified: 2026-04-23
 */
import React from 'react';
import SlidePanel from '../../../../components/ui/SlidePanel';
import { STAGE_COLOR_OPTIONS } from './useWorkflowEditor';

const StageList = ({
    stages,
    stageActionCounts,
    selectedStageId,
    readOnly,
    selectedNode,
    deleteStageTarget,
    onSelectStage,
    onStageChange,
    onMoveStage,
    onAddStage,
    onAddAction,
    onRemoveSelectedAction,
    onRequestDeleteStage,
    onCancelDeleteStage,
    onConfirmDeleteStage
}) => (
    <>
        <aside className="issue-template-workflow-panel__sidebar">
            <div className="issue-template-workflow-panel__sidebar-header">
                <div>
                    <span className="issue-template-workflow-panel__section-label">Stages</span>
                    <h4>Workflow lanes</h4>
                </div>
                <button
                    type="button"
                    className="issue-template-workflow-panel__button issue-template-workflow-panel__button--ghost"
                    onClick={onAddStage}
                    disabled={readOnly}
                >
                    <i className="fa-light fa-plus"></i>
                    <span>Add stage</span>
                </button>
            </div>

            <div className="issue-template-workflow-panel__stage-list">
                {stages.map((stage, index) => (
                    <div
                        key={stage.id}
                        className={`issue-template-workflow-panel__stage-card${selectedStageId === stage.id ? ' is-active' : ''}${readOnly ? ' is-readonly' : ''}`}
                        onClick={() => onSelectStage(stage.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelectStage(stage.id);
                            }
                        }}
                    >
                        <div className="issue-template-workflow-panel__stage-top">
                            <span className="issue-template-workflow-panel__stage-dot" style={{ backgroundColor: stage.color }}></span>
                            <input
                                type="text"
                                value={stage.name}
                                onChange={(event) => onStageChange(stage.id, 'name', event.target.value)}
                                className="issue-template-workflow-panel__stage-input"
                                disabled={readOnly}
                            />
                        </div>

                        <label className="issue-template-workflow-panel__field">
                            <span>Color</span>
                            <select
                                value={stage.color}
                                onChange={(event) => onStageChange(stage.id, 'color', event.target.value)}
                                className="issue-template-workflow-panel__select"
                                disabled={readOnly}
                            >
                                {STAGE_COLOR_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.text}</option>
                                ))}
                            </select>
                        </label>

                        <div className="issue-template-workflow-panel__stage-meta">
                            <span>{stageActionCounts[stage.id] || 0} action{stageActionCounts[stage.id] === 1 ? '' : 's'}</span>
                            <div className="issue-template-workflow-panel__stage-actions">
                                <button
                                    type="button"
                                    className="issue-template-workflow-panel__icon-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMoveStage(stage.id, -1);
                                    }}
                                    disabled={readOnly || index === 0}
                                    aria-label={`Move ${stage.name} up`}
                                >
                                    <i className="fa-light fa-arrow-up"></i>
                                </button>
                                <button
                                    type="button"
                                    className="issue-template-workflow-panel__icon-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onMoveStage(stage.id, 1);
                                    }}
                                    disabled={readOnly || index === stages.length - 1}
                                    aria-label={`Move ${stage.name} down`}
                                >
                                    <i className="fa-light fa-arrow-down"></i>
                                </button>
                                <button
                                    type="button"
                                    className="issue-template-workflow-panel__inline-button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onRequestDeleteStage(stage.id);
                                    }}
                                    disabled={readOnly}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="issue-template-workflow-panel__sidebar-actions">
                <button
                    type="button"
                    className="issue-template-workflow-panel__button issue-template-workflow-panel__button--primary"
                    onClick={onAddAction}
                    disabled={readOnly || !stages.length}
                >
                    <i className="fa-light fa-plus"></i>
                    <span>Add action</span>
                </button>
                <button
                    type="button"
                    className="issue-template-workflow-panel__button issue-template-workflow-panel__button--ghost"
                    onClick={onRemoveSelectedAction}
                    disabled={readOnly || !selectedNode}
                >
                    <i className="fa-light fa-trash"></i>
                    <span>Remove selected</span>
                </button>
            </div>
        </aside>

        <SlidePanel
            open={Boolean(deleteStageTarget)}
            onClose={onCancelDeleteStage}
            title="Remove workflow stage"
            width={420}
        >
            <div className="issue-template-workflow-panel__panel-copy">
                <p>
                    Removing <strong>{deleteStageTarget?.name}</strong> will move its actions into the first remaining stage.
                </p>
            </div>
            <div className="issue-template-workflow-panel__panel-actions">
                <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--ghost" onClick={onCancelDeleteStage}>
                    Keep stage
                </button>
                <button type="button" className="issue-template-workflow-panel__button issue-template-workflow-panel__button--danger" onClick={onConfirmDeleteStage}>
                    Remove stage
                </button>
            </div>
        </SlidePanel>
    </>
);

export default StageList;