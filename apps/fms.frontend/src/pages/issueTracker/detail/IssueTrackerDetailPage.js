/**
 * File: IssueTrackerDetailPage.js
 * Purpose: Orchestrator component for the Issue Detail page — split-panel layout
 *          with sidebar issue list (left) and Fluent Design detail panels (right)
 * Dependencies: React, useIssueDetail hook, IssueHeaderCard, IssueDetailsCard,
 *               IssueDetailTabs, IssueDetailPopups, IssueSidebar
 * Last Modified: 2026-02-23
 *
 * Key Components:
 * - IssueTrackerDetailPage: Main component composing sidebar + detail content
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import useIssueDetail from './useIssueDetail';
import IssueHeaderCard from './IssueHeaderCard';
import IssueDetailsCard from './IssueDetailsCard';
import IssueDetailTabs from './IssueDetailTabs';
import IssueDetailPopups from './IssueDetailPopups';
import IssueSidebar from './IssueSidebar';
import '../styles/IssueTrackerDetailPage.scss';

const IssueTrackerDetailPage = () => {
    const detail = useIssueDetail();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const handleCollapseChange = useCallback((v) => setSidebarCollapsed(v), []);

    const layoutClass = `issue-detail-layout${sidebarCollapsed ? ' issue-detail-layout--collapsed' : ''}`;

    // Derived display values
    const issueTitle = useMemo(() => {
        if (!detail.issue) return '';
        return detail.displayIssue?.problemTitle || detail.issue.problemTitle || `Issue #${detail.issue.id}`;
    }, [detail.issue, detail.displayIssue]);

    const openerInitial = useMemo(() => {
        const name = detail.issue?.openbyUserName;
        return name ? name.charAt(0).toUpperCase() : '?';
    }, [detail.issue]);

    const assigneeInitial = useMemo(() => {
        const name = detail.issue?.assignToUserName;
        return name ? name.charAt(0).toUpperCase() : '?';
    }, [detail.issue]);

    useEffect(() => {
        const rafId = window.requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });

        return () => window.cancelAnimationFrame(rafId);
    }, [detail.selectedTabIndex]);

    /* ── Loading state ────────────────────── */
    if (detail.loading) {
        return (
            <div className={layoutClass}>
                <IssueSidebar currentIssueId={detail.id} onCollapseChange={handleCollapseChange} />
                <div className="issue-detail-layout__content">
                    <div className="tw-flex tw-items-center tw-justify-center tw-min-h-[400px]">
                        <LoadIndicator visible={true} />
                        <span className="tw-ml-3 tw-text-sm tw-text-gray-500">Loading issue details\u2026</span>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Error / not found ────────────────── */
    if (!detail.issue) {
        return (
            <div className={layoutClass}>
                <IssueSidebar currentIssueId={detail.id} onCollapseChange={handleCollapseChange} />
                <div className="issue-detail-layout__content">
                    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[400px] tw-text-gray-500">
                        <i className="fa-light fa-circle-exclamation tw-text-4xl tw-mb-3 tw-text-gray-300"></i>
                        <p className="tw-text-lg tw-font-medium">Issue not found</p>
                        <p className="tw-text-sm tw-mt-1">The requested issue may have been deleted or you lack permission.</p>
                        <button
                            type="button"
                            className="tw-mt-4 tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded tw-text-sm hover:tw-bg-blue-700"
                            onClick={() => detail.navigate('/issue-tracker/tickets')}
                        >
                            Back to Issues
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main layout ──────────────────────── */
    return (
        <div className={layoutClass}>
            <IssueSidebar currentIssueId={detail.id} onCollapseChange={handleCollapseChange} />

            <div className="issue-detail-layout__content">
                <div className="issue-tracker-detail-page">
                    {/* Header card */}
                    <IssueHeaderCard
                        issue={detail.issue}
                        issueTitle={issueTitle}
                        openerInitial={openerInitial}
                        priorityAccentClass={detail.priorityAccentClass}
                        dueDateUrgency={detail.dueDateUrgency}
                        isEditMode={detail.isEditMode}
                        isSaving={detail.isSaving}
                        isFollowing={detail.isFollowing}
                        isFollowLoading={detail.isFollowLoading}
                        isTerminalStatus={detail.isTerminalStatus}
                        isAlreadyComplete={detail.isAlreadyComplete}
                        isAlreadyClosed={detail.isAlreadyClosed}
                        isAlreadyHigh={detail.isAlreadyHigh}
                        isClosing={detail.isClosing}
                        canDeleteIssue={detail.canDeleteIssue}
                        navigate={detail.navigate}
                        handleToggleFollow={detail.handleToggleFollow}
                        handleEnableEditMode={detail.handleEnableEditMode}
                        handleCancelEdit={detail.handleCancelEdit}
                        handleSaveEdit={detail.handleSaveEdit}
                        setShowPrintPopup={detail.setShowPrintPopup}
                        handleOpenCompletePopup={detail.handleOpenCompletePopup}
                        handleQuickMarkHighPriority={detail.handleQuickMarkHighPriority}
                        setShowReassignPopup={detail.setShowReassignPopup}
                        setShowClosePopup={detail.setShowClosePopup}
                        handleDeleteIssue={detail.handleDeleteIssue}
                        actionsDropdownOpen={detail.actionsDropdownOpen}
                        setActionsDropdownOpen={detail.setActionsDropdownOpen}
                        actionsDropdownRef={detail.actionsDropdownRef}
                        editingStatusDisplay={detail.editingStatusDisplay}
                        editingPriorityDisplay={detail.editingPriorityDisplay}
                        issueTagNames={detail.issueTagNames}
                    />

                    {/* Details card */}
                    <IssueDetailsCard
                        issue={detail.issue}
                        displayIssue={detail.displayIssue}
                        isEditMode={detail.isEditMode}
                        editData={detail.editData}
                        handleEditFieldChange={detail.handleEditFieldChange}
                        categories={detail.categories}
                        priorities={detail.priorities}
                        statuses={detail.statuses}
                        priorityDisplay={detail.priorityDisplay}
                        issueTagNames={detail.issueTagNames}
                        dueDateUrgency={detail.dueDateUrgency}
                        openerInitial={openerInitial}
                        assigneeInitial={assigneeInitial}
                        navigate={detail.navigate}
                    />

                    {/* Completion Notes — own card section */}
                    {detail.issue.completionNotes && (
                        <div className="idc">
                            <div className="idc__section-title">Completion Notes</div>
                            <div className="idc__notes-section">
                                <div className="idc__notes-row">
                                    <i className="fa-light fa-circle-check idc__notes-icon idc__notes-icon--green"></i>
                                    <div>
                                        <p className="idc__notes-text">{detail.issue.completionNotes}</p>
                                        {detail.issue.closingDate && (
                                            <p className="idc__notes-meta">
                                                Completed {new Date(detail.issue.closingDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Closing Notes — own card section */}
                    {detail.issue.closingNotes && (
                        <div className="idc">
                            <div className="idc__section-title">Closing Notes</div>
                            <div className="idc__notes-section">
                                <div className="idc__notes-row">
                                    <i className="fa-light fa-lock idc__notes-icon idc__notes-icon--amber"></i>
                                    <div>
                                        <p className="idc__notes-text">{detail.issue.closingNotes}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <IssueDetailTabs
                        issue={detail.issue}
                        id={detail.id}
                        tabItems={detail.tabItems}
                        selectedTabIndex={detail.selectedTabIndex}
                        renderTabItem={detail.renderTabItem}
                        handleTabSelectionChange={detail.handleTabSelectionChange}
                        heatmapDates={detail.heatmapDates}
                        vehicleIssues={detail.vehicleIssues}
                        handleActivityRefreshCallback={detail.handleActivityRefreshCallback}
                        attachments={detail.attachments}
                        attachmentsLoading={detail.attachmentsLoading}
                        uploadCategory={detail.uploadCategory}
                        setUploadCategory={detail.setUploadCategory}
                        handleFileUpload={detail.handleFileUpload}
                        isUploading={detail.isUploading}
                        canUploadAttachments={detail.canUploadAttachments}
                        downloadingAttachmentId={detail.downloadingAttachmentId}
                        handleDownloadAttachment={detail.handleDownloadAttachment}
                        handleDeleteAttachment={detail.handleDeleteAttachment}
                    />
                </div>
            </div>

            {/* Popups (rendered outside card flow) */}
            <IssueDetailPopups
                issue={detail.issue}
                displayIssue={detail.displayIssue}
                isSaving={detail.isSaving}
                showClosePopup={detail.showClosePopup}
                setShowClosePopup={detail.setShowClosePopup}
                handleCloseIssue={detail.handleCloseIssue}
                isClosing={detail.isClosing}
                showPrintPopup={detail.showPrintPopup}
                setShowPrintPopup={detail.setShowPrintPopup}
                showCompletionWithActionsPopup={detail.showCompletionWithActionsPopup}
                setShowCompletionWithActionsPopup={detail.setShowCompletionWithActionsPopup}
                handleCompletionWithActionsSuccess={detail.handleCompletionWithActionsSuccess}
                vehicles={detail.vehicles}
                showReassignPopup={detail.showReassignPopup}
                setShowReassignPopup={detail.setShowReassignPopup}
                handleReassignSuccess={detail.handleReassignSuccess}
                users={detail.users}
            />
        </div>
    );
};

export default IssueTrackerDetailPage;
