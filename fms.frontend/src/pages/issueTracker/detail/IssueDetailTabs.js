/**
 * File: IssueDetailTabs.js
 * Purpose: Tab strip + tab content panels (overview, activity, completion, linked, attachments)
 * Dependencies: React, DevExtreme Tabs/LoadIndicator, child components, issueDetailUtils
 * Last Modified: 2026-02-23
 */
import React from 'react';
import Tabs from 'devextreme-react/tabs';
import LoadIndicator from 'devextreme-react/load-indicator';
import IssueActivityStream from '../components/IssueActivityStream';
import IssueActivityHeatmap from '../components/IssueActivityHeatmap';
import LinkedIssuesGrid from '../components/LinkedIssuesGrid';
import IssueCompletionRecords from '../components/IssueCompletionRecords';
import {
  formatDateTime, formatFileSize,
  getCategoryIcon, getCategoryColor,
  ATTACHMENT_CATEGORIES
} from './issueDetailUtils';

const IssueDetailTabs = ({
  issue, id,
  // Tab state
  tabItems, selectedTabIndex, renderTabItem, handleTabSelectionChange,
  // Overview data
  heatmapDates, vehicleIssues,
  // Activity
  handleActivityRefreshCallback,
  // Attachments
  attachments, attachmentsLoading,
  uploadCategory, setUploadCategory, handleFileUpload,
  isUploading, canUploadAttachments,
  downloadingAttachmentId, handleDownloadAttachment, handleDeleteAttachment
}) => {
  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-overflow-hidden">
      <div className="issue-detail-tabs">
        <Tabs
          dataSource={tabItems}
          selectedIndex={selectedTabIndex}
          onItemClick={handleTabSelectionChange}
          itemRender={renderTabItem}
          width="100%"
          showNavButtons={true}
          scrollingEnabled={true}
        />
      </div>

      <div className="issue-detail-tabs__content">
        {/* Overview */}
        {selectedTabIndex === 0 && (
          <div className="tw-p-6 tw-space-y-6">
            <IssueActivityHeatmap
              dates={heatmapDates}
              weeks={26}
              title={`Vehicle Issue Activity (${vehicleIssues.length} issues)`}
              highlightDate={issue?.openDate}
              colorScheme="blue"
              showSummary={true}
            />
          </div>
        )}

        {/* Activity Stream */}
        {selectedTabIndex === 1 && (
          <div className="tw-p-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                <i className="fa-light fa-clock-rotate-left tw-mr-2 tw-text-purple-600"></i>
                Activity Stream
              </h2>
              <span className="tw-text-xs tw-text-gray-500">Issue timeline and updates</span>
            </div>
            <IssueActivityStream issueId={id} onRefresh={handleActivityRefreshCallback} />
          </div>
        )}

        {/* Completion Records */}
        {selectedTabIndex === 2 && (
          <div className="tw-p-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                <i className="fa-light fa-clipboard-check tw-mr-2 tw-text-green-600"></i>
                Completion Records
              </h2>
              <span className="tw-text-xs tw-text-gray-500">Structured actions recorded during completion</span>
            </div>
            <IssueCompletionRecords issueId={id} />
          </div>
        )}

        {/* Linked Issues */}
        {selectedTabIndex === 3 && (
          <div className="tw-p-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                <i className="fa-light fa-link tw-mr-2 tw-text-indigo-600"></i>
                Linked Issues
              </h2>
              <span className="tw-text-xs tw-text-gray-500">Issues using the same template or category</span>
            </div>
            <LinkedIssuesGrid issueId={id} currentIssue={issue} />
          </div>
        )}

        {/* Attachments */}
        {selectedTabIndex === 4 && (
          <div className="tw-p-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                <i className="fa-light fa-paperclip tw-mr-2 tw-text-teal-600"></i>
                Attachments
              </h2>
              <span className="tw-text-xs tw-text-gray-500">Installation photos, calibration docs, and general files</span>
            </div>

            {/* Upload */}
            <div className="tw-border tw-border-dashed tw-border-gray-300 tw-rounded-lg tw-p-4 tw-mb-6">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                <div>
                  <label htmlFor="attach-category" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">Category</label>
                  <select
                    id="attach-category"
                    className="tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                  >
                    {ATTACHMENT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="tw-flex-1">
                  <label htmlFor="attach-file" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">Select File(s)</label>
                  <input
                    id="attach-file"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
                    className="tw-text-sm tw-text-gray-700"
                    onChange={handleFileUpload}
                    disabled={isUploading || !canUploadAttachments}
                  />
                  {!canUploadAttachments && (
                    <p className="tw-text-xs tw-text-amber-600 tw-mt-1">
                      <i className="fa-light fa-lock tw-mr-1"></i>Closed issues do not allow new attachments.
                    </p>
                  )}
                </div>
                {isUploading && (
                  <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-600">
                    <LoadIndicator height={20} width={20} />
                    <span>Uploading…</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attachment list */}
            {attachmentsLoading ? (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
                <LoadIndicator /><span className="tw-ml-2 tw-text-gray-500">Loading attachments…</span>
              </div>
            ) : attachments.length === 0 ? (
              <p className="tw-text-sm tw-text-gray-500 tw-text-center tw-py-8">
                No attachments yet. Upload installation photos, calibration documents, or other files above.
              </p>
            ) : (
              <div className="tw-space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="tw-flex tw-items-center tw-gap-3 tw-border tw-border-gray-200 tw-rounded tw-p-3 hover:tw-bg-gray-50">
                    <div className={`tw-w-9 tw-h-9 tw-rounded-full tw-flex tw-items-center tw-justify-center ${getCategoryColor(att.attachmentCategory)}`}>
                      <i className={getCategoryIcon(att.attachmentCategory)}></i>
                    </div>
                    <div className="tw-flex-1 tw-min-w-0">
                      <p className="tw-font-medium tw-text-gray-800 tw-truncate">{att.fileName}</p>
                      <p className="tw-text-xs tw-text-gray-500">
                        {att.attachmentCategory} &middot; {formatFileSize(att.fileSize)} &middot; {att.uploadedByUserName || att.uploadedBy} &middot; {formatDateTime(att.uploadedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="tw-text-blue-600 hover:tw-text-blue-800 tw-text-sm tw-flex tw-items-center tw-gap-2 disabled:tw-opacity-60"
                      onClick={() => handleDownloadAttachment(att)}
                      disabled={downloadingAttachmentId === att.id}
                    >
                      {downloadingAttachmentId === att.id
                        ? <><LoadIndicator height={16} width={16} /><span>Downloading…</span></>
                        : <><i className="fa-light fa-download"></i><span>Download</span></>
                      }
                    </button>
                    <button type="button" className="tw-text-red-500 hover:tw-text-red-700" onClick={() => handleDeleteAttachment(att.id, att.fileName)}>
                      <i className="fa-light fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDetailTabs;
