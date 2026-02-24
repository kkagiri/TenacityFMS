/**
 * File: IssueHeaderCard.js
 * Purpose: Fluent Design header card (.ihc) for the Issue Detail page
 *          — breadcrumb, segmented button group, badges, title, meta-strip
 * Dependencies: React, IssuePriorityBadge, IssueStatusIndicator, issueDetailUtils
 * Last Modified: 2026-02-23
 */
import React from 'react';
import IssuePriorityBadge from '../components/IssuePriorityBadge';
import IssueStatusIndicator from '../components/IssueStatusIndicator';
import { formatDateTime } from './issueDetailUtils';

const IssueHeaderCard = ({
    issue,
    issueTitle,
    openerInitial,
    priorityAccentClass,
    dueDateUrgency,
    // Button group
    isEditMode, isSaving, isFollowing, isFollowLoading, isTerminalStatus,
    isAlreadyComplete, isAlreadyClosed, isAlreadyHigh, isClosing, canDeleteIssue,
    // Handlers
    navigate, handleToggleFollow, handleEnableEditMode, handleCancelEdit, handleSaveEdit,
    setShowPrintPopup, handleOpenCompletePopup, handleQuickMarkHighPriority,
    setShowReassignPopup, setShowClosePopup, handleDeleteIssue,
    // Dropdown
    actionsDropdownOpen, setActionsDropdownOpen, actionsDropdownRef,
    // Badges
    editingStatusDisplay, editingPriorityDisplay, issueTagNames
}) => {
    return (
        <div className="ihc">
            {/* Coloured priority accent bar */}
            <div className={`ihc__accent ${priorityAccentClass}`}></div>

            <div className="ihc__body">

                {/* Row 1: Breadcrumb + segmented button group */}
                <div className="ihc__top">
                    <nav className="ihc__breadcrumb" aria-label="breadcrumb">
                        {/* <button
                            type="button"
                            className="ihc__bc-home"
                            onClick={() => navigate('/issue-tracker/tickets')}
                        >
                            <i className="fa-light fa-layer-group"></i>
                            <span>Issues</span>
                        </button> */}
                        <span className="ihc__bc-current">
                            #{issue.id}
                        </span>
                    </nav>

                    {/* Segmented action group */}
                    <div className="ihc__btn-group" role="toolbar" aria-label="Issue actions">
                        {!isEditMode ? (
                            <>
                                {/* Follow */}
                                <button
                                    type="button"
                                    className={`ihc__btn ${isFollowing ? 'ihc__btn--follow-active' : ''}`}
                                    onClick={handleToggleFollow}
                                    disabled={isFollowLoading}
                                    title={isFollowing ? 'Unfollow this issue' : 'Follow to receive notifications'}
                                >
                                    <i className={`fa-light ${isFollowing ? 'fa-bell-on' : 'fa-bell'}`}></i>
                                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                                </button>

                                {/* Edit */}
                                <button
                                    type="button"
                                    className="ihc__btn ihc__btn--edit"
                                    onClick={handleEnableEditMode}
                                    disabled={isTerminalStatus}
                                    title={isTerminalStatus ? 'Cannot edit closed/completed issues' : 'Edit issue'}
                                >
                                    <i className="fa-light fa-pen-to-square"></i>
                                    <span>Edit</span>
                                </button>

                                {/* Print */}
                                <button
                                    type="button"
                                    className="ihc__btn"
                                    onClick={() => setShowPrintPopup(true)}
                                    title="Print or share this issue"
                                >
                                    <i className="fa-light fa-print"></i>
                                    <span>Print</span>
                                </button>

                                {/* Actions dropdown */}
                                <div className="ihc__dropdown" ref={actionsDropdownRef}>
                                    <button
                                        type="button"
                                        className={`ihc__btn ihc__btn--actions ${actionsDropdownOpen ? 'ihc__btn--pressed' : ''}`}
                                        onClick={() => setActionsDropdownOpen((prev) => !prev)}
                                        aria-haspopup="true"
                                        aria-expanded={actionsDropdownOpen}
                                    >
                                        <i className="fa-solid fa-ellipsis"></i>
                                        <span>Actions</span>
                                        <i className={`fa-light fa-chevron-${actionsDropdownOpen ? 'up' : 'down'} ihc__chevron`}></i>
                                    </button>

                                    {actionsDropdownOpen && (
                                        <div className="ihc__menu" role="menu">
                                            <button
                                                type="button"
                                                className="ihc__menu-item"
                                                role="menuitem"
                                                onClick={() => { handleOpenCompletePopup(); setActionsDropdownOpen(false); }}
                                                disabled={isSaving || isAlreadyComplete || isAlreadyClosed}
                                            >
                                                <i className="fa-light fa-circle-check"></i>
                                                <span>{isAlreadyComplete ? 'Completed' : 'Mark as Complete'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="ihc__menu-item"
                                                role="menuitem"
                                                onClick={() => { setShowReassignPopup(true); setActionsDropdownOpen(false); }}
                                                disabled={isSaving || isAlreadyClosed}
                                            >
                                                <i className="fa-light fa-user-pen"></i>
                                                <span>Reassign</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="ihc__menu-item"
                                                role="menuitem"
                                                onClick={() => { handleQuickMarkHighPriority(); setActionsDropdownOpen(false); }}
                                                disabled={isSaving || isAlreadyHigh || isAlreadyComplete || isAlreadyClosed}
                                            >
                                                <i className="fa-light fa-arrow-up"></i>
                                                <span>{isAlreadyHigh ? 'Priority: High' : 'Escalate to High'}</span>
                                            </button>
                                            {!isAlreadyClosed && (
                                                <button
                                                    type="button"
                                                    className="ihc__menu-item ihc__menu-item--warn"
                                                    role="menuitem"
                                                    onClick={() => { setShowClosePopup(true); setActionsDropdownOpen(false); }}
                                                    disabled={isSaving || isClosing || isAlreadyClosed}
                                                >
                                                    <i className="fa-light fa-lock"></i>
                                                    <span>{isClosing ? 'Closing…' : 'Close Issue'}</span>
                                                </button>
                                            )}
                                            {canDeleteIssue && (
                                                <>
                                                    <div className="ihc__menu-divider"></div>
                                                    <button
                                                        type="button"
                                                        className="ihc__menu-item ihc__menu-item--danger"
                                                        role="menuitem"
                                                        onClick={() => { handleDeleteIssue(); setActionsDropdownOpen(false); }}
                                                        disabled={isSaving || isAlreadyClosed}
                                                    >
                                                        <i className="fa-light fa-trash"></i>
                                                        <span>{isSaving ? 'Deleting…' : 'Delete Issue'}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="ihc__btn ihc__btn--cancel"
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                >
                                    <i className="fa-light fa-xmark"></i>
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="button"
                                    className="ihc__btn ihc__btn--save"
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                >
                                    <i className="fa-light fa-floppy-disk"></i>
                                    <span>{isSaving ? 'Saving…' : 'Save'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Row 2: Badges + Title */}
                <div className="ihc__title-section">
                    <div className="ihc__badges">
                        <IssueStatusIndicator status={editingStatusDisplay} />
                        <IssuePriorityBadge priority={editingPriorityDisplay} />
                    </div>
                    <h1 className="ihc__title">{issueTitle}</h1>
                </div>

                {/* Row 3: Metadata strip */}
                <div className="ihc__meta-strip">
                    <span className="ihc__meta-item">
                        <i className="fa-light fa-calendar-day"></i>
                        <span>{formatDateTime(issue.openDate)}</span>
                    </span>
                    <span className="ihc__meta-sep" aria-hidden="true">·</span>
                    <span className="ihc__meta-item">
                        <span className="ihc__avatar ihc__avatar--blue" aria-hidden="true">{openerInitial}</span>
                        <span className="ihc__meta-name">{issue.openbyUserName || 'Unknown'}</span>
                        <span className="ihc__meta-muted">opened</span>
                    </span>
                    {!isEditMode && issueTagNames.length > 0 && (
                        <>
                            <span className="ihc__meta-sep" aria-hidden="true">·</span>
                            {issueTagNames.map((tag) => (
                                <span key={tag} className="ihc__tag">
                                    <i className="fa-light fa-tag"></i>
                                    {tag}
                                </span>
                            ))}
                        </>
                    )}
                    {issue.dueDate && (
                        <>
                            <span className="ihc__meta-spacer" aria-hidden="true"></span>
                            <span className={`ihc__meta-item ${dueDateUrgency === 'overdue' ? 'ihc__meta-due--overdue' : dueDateUrgency === 'soon' ? 'ihc__meta-due--soon' : ''}`}>
                                <i className="fa-light fa-clock"></i>
                                <span>Due {formatDateTime(issue.dueDate)}</span>
                                {dueDateUrgency && (
                                    <span className={`ihc__due-pill ihc__due-pill--${dueDateUrgency}`}>
                                        {dueDateUrgency === 'overdue' ? 'Overdue' : 'Due soon'}
                                    </span>
                                )}
                            </span>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default IssueHeaderCard;
