/**
 * File: IssueDetailsCard.js
 * Purpose: Fluent Design details card (.idc) — description, edit form, property grid, banners
 * Dependencies: React, issueDetailUtils
 * Last Modified: 2026-02-23
 */
import React from 'react';
import {
  formatDateTime, toNullableInt,
  getCategoryLabel, getPriorityLabel, getStatusLabel,
  normalizeIssueTags
} from './issueDetailUtils';

const IssueDetailsCard = ({
  issue, displayIssue,
  // Edit state
  isEditMode, editData, handleEditFieldChange,
  // Lookups
  categories, priorities, statuses,
  // Computed
  priorityDisplay, issueTagNames, dueDateUrgency,
  openerInitial, assigneeInitial,
  // Nav
  navigate
}) => {
  return (
    <div className="idc">

      {/* Description */}
      <div className="idc__section-title">Description</div>
      <div className="idc__description">
        {isEditMode && editData ? (
          <p className="tw-text-sm tw-text-gray-600 tw-whitespace-pre-wrap tw-leading-relaxed">
            {editData.problemDescription || 'No description provided.'}
          </p>
        ) : (
          <p className="tw-text-sm tw-text-gray-700 tw-whitespace-pre-wrap tw-leading-relaxed">
            {displayIssue?.problemDescription || issue.problemDescription || 'No description provided.'}
          </p>
        )}
        {isEditMode && (
          <p className="tw-text-xs tw-text-gray-400 tw-mt-2">
            <i className="fa-light fa-lock tw-mr-1"></i>
            Description cannot be edited after creation.
          </p>
        )}
      </div>

      {/* Details section label */}
      <div className="idc__section-title idc__section-title--bordered">Details</div>

      {/* Edit form (replaces grid when in edit mode) */}
      {isEditMode && editData ? (
        <div className="idc__edit-form">
          <div className="idc__edit-grid">
            <div className="idc__edit-field idc__edit-field--span2">
              <label htmlFor="issue-title" className="idc__edit-label">Issue Title</label>
              <input
                id="issue-title"
                type="text"
                maxLength={255}
                className="idc__edit-input"
                value={editData.problemTitle}
                onChange={(e) => handleEditFieldChange('problemTitle', e.target.value)}
              />
            </div>
            <div className="idc__edit-field">
              <label htmlFor="issue-category" className="idc__edit-label">Category</label>
              <select
                id="issue-category"
                className="idc__edit-select"
                value={editData.issueCategoryId ?? ''}
                onChange={(e) => {
                  const v = toNullableInt(e.target.value);
                  handleEditFieldChange('issueCategoryId', v);
                  handleEditFieldChange('issueCategoryTags', v ? [v] : []);
                }}
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>
            <div className="idc__edit-field">
              <label htmlFor="issue-priority" className="idc__edit-label">Priority</label>
              <select
                id="issue-priority"
                className="idc__edit-select"
                value={editData.priority ?? ''}
                onChange={(e) => handleEditFieldChange('priority', toNullableInt(e.target.value))}
              >
                <option value="">Select priority</option>
                {priorities.map((p) => <option key={p.id} value={p.id}>{getPriorityLabel(p)}</option>)}
              </select>
            </div>
            <div className="idc__edit-field">
              <label htmlFor="issue-status" className="idc__edit-label">Status</label>
              <select
                id="issue-status"
                className="idc__edit-select"
                value={editData.status ?? ''}
                onChange={(e) => handleEditFieldChange('status', toNullableInt(e.target.value))}
              >
                <option value="">Select status</option>
                {statuses.map((s) => <option key={s.id} value={s.id}>{getStatusLabel(s)}</option>)}
              </select>
            </div>
            <div className="idc__edit-field">
              <label htmlFor="issue-due-date" className="idc__edit-label">Due Date</label>
              <input
                id="issue-due-date"
                type="date"
                className="idc__edit-input"
                value={editData.dueDate}
                onChange={(e) => handleEditFieldChange('dueDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Property grid (view mode) */
        <div className="idc__grid">

          {/* LEFT COLUMN */}
          <div className="idc__col">
            {/* Assigned To */}
            <div className="idc__prop">
              <div className="idc__prop-label">Assigned To</div>
              <div className="idc__prop-value">
                <div className="idc__prop-inner">
                  <span className="idc__avatar idc__avatar--green">{assigneeInitial}</span>
                  <div>
                    <div className="idc__prop-name">{issue.assignToUserName || 'Unassigned'}</div>
                    {issue.assignToEmail && <div className="idc__prop-sub">{issue.assignToEmail}</div>}
                  </div>
                </div>
                <i className="fa-light fa-chevron-down idc__chevron"></i>
              </div>
            </div>

            {/* Site */}
            <div className="idc__prop">
              <div className="idc__prop-label">Site</div>
              <div className="idc__prop-value">
                <div className="idc__prop-inner">
                  <span>{issue.siteName || 'Not specified'}</span>
                  {issue.siteId && (
                    <button
                      type="button"
                      className="idc__history-link"
                      onClick={() => navigate('/issue-tracker/tickets', {
                        state: { applyFilters: { siteId: issue.siteId }, filterLabel: `Site: ${issue.siteName}` }
                      })}
                    >
                      <i className="fa-light fa-rotate-left"></i>
                      View History
                    </button>
                  )}
                </div>
                <i className="fa-light fa-chevron-down idc__chevron"></i>
              </div>
            </div>

            {/* Vehicle */}
            <div className="idc__prop">
              <div className="idc__prop-label">Vehicle</div>
              <div className="idc__prop-value">
                <div className="idc__prop-inner">
                  <span>{issue.vehicleHyoungNo || issue.vehicleNumber || 'Not linked'}</span>
                  {issue.vehicleId && (
                    <button
                      type="button"
                      className="idc__history-link"
                      onClick={() => navigate('/issue-tracker/tickets', {
                        state: { applyFilters: { vehicleId: issue.vehicleId }, filterLabel: `Vehicle: ${issue.vehicleHyoungNo || issue.vehicleNumber}` }
                      })}
                    >
                      <i className="fa-light fa-rotate-left"></i>
                      View History
                    </button>
                  )}
                </div>
                <i className="fa-light fa-chevron-down idc__chevron"></i>
              </div>
            </div>

            {/* Tags */}
            {issueTagNames.length > 0 && (
              <div className="idc__prop">
                <div className="idc__prop-label">Tags</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner idc__prop-inner--wrap">
                    {issueTagNames.map((tag) => (
                      <span key={tag} className="idc__tag-chip">
                        <i className="fa-light fa-tag"></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>
            )}

            {/* Device */}
            {(issue.deviceId || issue.deviceTypeName) && (
              <div className="idc__prop">
                <div className="idc__prop-label">Device</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <span>{issue.deviceTypeName || `Device #${issue.deviceId}`}</span>
                    {issue.deviceId && (
                      <button
                        type="button"
                        className="idc__history-link"
                        onClick={() => navigate('/issue-tracker/tickets', {
                          state: { applyFilters: { deviceId: issue.deviceId }, filterLabel: `Device: ${issue.deviceTypeName || issue.deviceId}` }
                        })}
                      >
                        <i className="fa-light fa-rotate-left"></i>
                        View History
                      </button>
                    )}
                  </div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="idc__col">
            {/* Opened By */}
            <div className="idc__prop">
              <div className="idc__prop-label">
                Opened By
                <i className="fa-light fa-circle-info idc__info-icon" title="The user who created this issue"></i>
              </div>
              <div className="idc__prop-value">
                <div className="idc__prop-inner">
                  <span className="idc__avatar idc__avatar--blue">{openerInitial}</span>
                  <div>
                    <div className="idc__prop-name">{issue.openbyUserName || 'Unknown'}</div>
                    {issue.openbyEmail && <div className="idc__prop-sub">{issue.openbyEmail}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Severity */}
            <div className="idc__prop">
              <div className="idc__prop-label">Severity</div>
              <div className="idc__prop-value">
                <div className="idc__prop-inner">
                  <span className={`idc__priority-dot idc__priority-dot--${(priorityDisplay || '').toLowerCase().replace(/\s+/g, '-')}`}></span>
                  <span>{priorityDisplay || '\u2014'}</span>
                </div>
                <i className="fa-light fa-chevron-down idc__chevron"></i>
              </div>
            </div>

            {/* Opened date */}
            <div className="idc__prop">
              <div className="idc__prop-label">Opened</div>
              <div className="idc__prop-value">
                <div className="idc__prop-inner">
                  <i className="fa-light fa-clock idc__row-icon"></i>
                  {formatDateTime(issue.openDate)}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className={`idc__prop ${dueDateUrgency ? `idc__prop--due-${dueDateUrgency}` : ''}`}>
              <div className="idc__prop-label">Due Date</div>
              <div className="idc__prop-value">
                <div className="idc__prop-inner">
                  <i className="fa-light fa-clock idc__row-icon"></i>
                  {issue.dueDate ? formatDateTime(issue.dueDate) : '\u2014'}
                  {dueDateUrgency && (
                    <span className={`idc__due-pill idc__due-pill--${dueDateUrgency}`}>
                      {dueDateUrgency === 'overdue' ? 'Overdue' : 'Due soon'}
                    </span>
                  )}
                </div>
                <i className="fa-light fa-chevron-down idc__chevron"></i>
              </div>
            </div>

            {/* Template */}
            {issue.templateName && (
              <div className="idc__prop">
                <div className="idc__prop-label">Template</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">{issue.templateName}</div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default IssueDetailsCard;
