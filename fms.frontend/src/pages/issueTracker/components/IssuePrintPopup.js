/**
 * File: IssuePrintPopup.js
 * Purpose: Print/Share slide panel for issue details with activity stream
 * Dependencies: React, SlidePanel, IssueActivityStream
 * Last Modified: 2026-03-05
 *
 * Key Components:
 * - IssuePrintPopup: SlidePanel with print-friendly issue details
 */
import React, { useRef, useCallback } from 'react';
import SlidePanel from '../../../components/ui/SlidePanel';
import IssueActivityStream from './IssueActivityStream';

const getStatusColor = (status) => {
    const statusMap = {
        'Open': '#3B82F6',
        'In Progress': '#F59E0B',
        'Resolved': '#10B981',
        'Closed': '#6B7280',
        'Pending': '#F97316',
        'Rejected': '#EF4444'
    };
    return statusMap[status] || '#6B7280';
};

const getPriorityColor = (priority) => {
    const priorityMap = {
        'Critical': '#DC2626',
        'High': '#EA580C',
        'Medium': '#D97706',
        'Low': '#16A34A'
    };
    return priorityMap[priority] || '#6B7280';
};

const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const IssuePrintPopup = ({ visible, onHide, issue }) => {
    const printContentRef = useRef(null);

    const handlePrint = useCallback(() => {
        if (!printContentRef.current) return;

        const printContent = printContentRef.current.innerHTML;
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        if (!printWindow) {
            alert('Please allow popups to print the issue details.');
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Issue #${issue?.id} - ${issue?.title || 'Issue Details'}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1f2937;
            line-height: 1.5;
            padding: 20px;
          }
          .print-header {
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .print-header h1 { font-size: 24px; color: #111827; }
          .print-header .issue-id { color: #6B7280; font-size: 14px; }
          .section { margin-bottom: 20px; }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #E5E7EB;
          }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { margin-bottom: 10px; }
          .info-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
          .info-value { font-size: 14px; color: #111827; font-weight: 500; }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .description {
            background: #F9FAFB;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
          }
          .timeline-item {
            display: flex;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #F3F4F6;
          }
          .timeline-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #E5E7EB;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            flex-shrink: 0;
          }
          .timeline-content { flex: 1; font-size: 13px; }
          .timeline-time { color: #9CA3AF; font-size: 11px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);

        printWindow.document.close();

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }, [issue]);

    const handleShare = useCallback(() => {
        const shareUrl = window.location.href;
        const shareText = `Issue #${issue?.id}: ${issue?.title || 'Issue Details'}`;

        if (navigator.share) {
            navigator.share({
                title: shareText,
                text: `${shareText}\n\nStatus: ${issue?.status}\nPriority: ${issue?.priority}`,
                url: shareUrl
            }).catch(() => {
                // User cancelled or share failed
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
                alert('Issue link copied to clipboard!');
            }).catch(() => {
                alert('Unable to copy to clipboard');
            });
        }
    }, [issue]);

    if (!issue) return null;

    const headerActions = (
        <div className="tw-flex tw-gap-1">
            <button
                type="button"
                className="tw-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1.5 tw-text-[13px] tw-text-gray-600 tw-bg-transparent tw-border-0 tw-rounded hover:tw-bg-black/[.06] tw-transition-colors tw-font-normal tw-cursor-pointer"
                onClick={handlePrint}
            >
                <i className="fa-light fa-print tw-text-[12px]"></i>
                Print
            </button>
            <button
                type="button"
                className="tw-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1.5 tw-text-[13px] tw-text-gray-600 tw-bg-transparent tw-border-0 tw-rounded hover:tw-bg-black/[.06] tw-transition-colors tw-font-normal tw-cursor-pointer"
                onClick={handleShare}
            >
                <i className="fa-light fa-link tw-text-[12px]"></i>
                Share
            </button>
        </div>
    );

    return (
        <SlidePanel
            open={visible}
            onClose={onHide}
            title={`Print Issue #${issue.id}`}
            width={720}
            headerActions={headerActions}
        >
            <div className="tw-flex tw-flex-col">

                {/* Printable Content */}
                <div ref={printContentRef} className="tw-flex-1">
                    {/* Header */}
                    <div className="tw-border-b-2 tw-border-blue-500 tw-pb-3 tw-mb-0 tw-px-3.5 tw-pt-3">
                        <div className="tw-text-[11px] tw-text-gray-400">Issue #{issue.id}</div>
                        <h1 className="tw-text-[15px] tw-font-semibold tw-text-gray-900 tw-mt-0.5 tw-leading-snug">{issue.title}</h1>
                    </div>

                    {/* Info Grid */}
                    <div className="tw-mb-0">
                        <div className="tw-text-[11px] tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-[.5px] tw-py-[7px] tw-px-3.5 tw-border-b tw-border-gray-200 tw-bg-[#FAFAF9]">
                            Issue Information
                        </div>
                        <div className="tw-grid tw-grid-cols-2">
                            <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-r tw-border-gray-100 tw-min-h-[36px]">
                                <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Status</span>
                                <span
                                    className="tw-inline-block tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[11px] tw-font-medium tw-text-white"
                                    style={{ backgroundColor: getStatusColor(issue.status) }}
                                >
                                    {issue.status}
                                </span>
                            </div>
                            <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-gray-100 tw-min-h-[36px]">
                                <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Priority</span>
                                <span
                                    className="tw-inline-block tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[11px] tw-font-medium tw-text-white"
                                    style={{ backgroundColor: getPriorityColor(issue.priority) }}
                                >
                                    {issue.priority}
                                </span>
                            </div>
                            <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-r tw-border-gray-100 tw-min-h-[36px]">
                                <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Assigned To</span>
                                <span className="tw-text-[13px] tw-font-medium tw-text-gray-800">{issue.assigneeName || 'Unassigned'}</span>
                            </div>
                            <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-gray-100 tw-min-h-[36px]">
                                <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Opened By</span>
                                <span className="tw-text-[13px] tw-font-medium tw-text-gray-800">{issue.openerName || 'Unknown'}</span>
                            </div>
                            <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-r tw-border-gray-100 tw-min-h-[36px]">
                                <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Due Date</span>
                                <span className="tw-text-[13px] tw-font-medium tw-text-gray-800">{formatDate(issue.dueDate)}</span>
                            </div>
                            <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-gray-100 tw-min-h-[36px]">
                                <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Created</span>
                                <span className="tw-text-[13px] tw-font-medium tw-text-gray-800">{formatDate(issue.createdAt || issue.createdDate)}</span>
                            </div>
                            {issue.templateName && (
                                <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-r tw-border-gray-100 tw-min-h-[36px]">
                                    <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Template</span>
                                    <span className="tw-text-[13px] tw-font-medium tw-text-gray-800">{issue.templateName}</span>
                                </div>
                            )}
                            {issue.vehicleCode && (
                                <div className="tw-flex tw-items-center tw-py-[7px] tw-px-3.5 tw-border-b tw-border-gray-100 tw-min-h-[36px]">
                                    <span className="tw-text-[11px] tw-text-gray-400 tw-uppercase tw-tracking-wide tw-w-[90px] tw-flex-shrink-0">Vehicle</span>
                                    <span className="tw-text-[13px] tw-font-medium tw-text-gray-800">{issue.vehicleCode}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {issue.description && (
                        <div>
                            <div className="tw-text-[11px] tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-[.5px] tw-py-[7px] tw-px-3.5 tw-border-b tw-border-t tw-border-gray-200 tw-bg-[#FAFAF9]">
                                Description
                            </div>
                            <div className="tw-px-3.5 tw-py-3 tw-text-[13px] tw-text-gray-600 tw-leading-[1.55]">
                                {issue.description}
                            </div>
                        </div>
                    )}

                    {/* Activity Stream */}
                    <div>
                        <div className="tw-text-[11px] tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-[.5px] tw-py-[7px] tw-px-3.5 tw-border-b tw-border-t tw-border-gray-200 tw-bg-[#FAFAF9]">
                            Activity Stream
                        </div>
                        <div className="tw-px-3.5 tw-pt-3">
                            <IssueActivityStream issueId={issue.id} />
                        </div>
                    </div>
                </div>
            </div>
        </SlidePanel>
    );
};

export default IssuePrintPopup;
