/**
 * File: BulkDeleteConfirmationDialog.js
 * Purpose: Bulk delete confirmation side-panel for TransactionHub multi-row deletion.
 * Dependencies: SlidePanel, devextreme-react/button, devextreme-react/scroll-view
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - BulkDeleteConfirmationDialog(): Presents validation results, warnings, and the final delete action.
 * - ItemList(): Renders blocked and warning transactions returned by the backend validator.
 */
import React from 'react';
import Button from 'devextreme-react/button';
import { ScrollView } from 'devextreme-react/scroll-view';
import SlidePanel from '../../../../../components/ui/SlidePanel';
import { VolumeChangeReasonEnum } from './transactionHubConstants';

const LoadingState = () => (
    <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
        <div className="tw-text-center">
            <i className="fa-light fa-spinner tw-animate-spin tw-text-2xl tw-mb-3" style={{ color: 'var(--fms-text-secondary, #2563eb)' }}></i>
            <p style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>Validating bulk deletion...</p>
        </div>
    </div>
);

const SummaryRow = ({ label, value, valueClassName = '' }) => (
    <div className="tw-flex tw-justify-between tw-gap-4">
        <span className="tw-font-medium" style={{ color: 'var(--fms-text-primary, #374151)' }}>{label}</span>
        <span className={valueClassName} style={{ color: 'var(--fms-text-primary, #374151)' }}>{value}</span>
    </div>
);

const ToneBanner = ({ tone, title, message }) => {
    const tones = {
        blocked: {
            bg: 'var(--delete-blocked-bg, #fef2f2)',
            border: 'var(--delete-blocked-border, #fecaca)',
            icon: 'var(--delete-blocked-icon, #dc2626)',
            title: 'var(--delete-blocked-title, #991b1b)',
            text: 'var(--delete-blocked-text, #b91c1c)',
            iconClass: 'fa-light fa-ban'
        },
        warning: {
            bg: 'var(--delete-warning-bg, #fffbeb)',
            border: 'var(--delete-warning-border, #fde68a)',
            icon: 'var(--delete-warning-icon, #d97706)',
            title: 'var(--delete-warning-title, #92400e)',
            text: 'var(--delete-warning-text, #b45309)',
            iconClass: 'fa-light fa-triangle-exclamation'
        },
        safe: {
            bg: 'var(--delete-safe-bg, #f0fdf4)',
            border: 'var(--delete-safe-border, #bbf7d0)',
            icon: 'var(--delete-safe-icon, #16a34a)',
            title: 'var(--delete-safe-title, #166534)',
            text: 'var(--delete-safe-text, #15803d)',
            iconClass: 'fa-light fa-check-circle'
        }
    };

    const palette = tones[tone] || tones.safe;

    return (
        <div className="tw-rounded-lg tw-p-4 tw-mb-4" style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
            <div className="tw-flex tw-items-start">
                <i className={`${palette.iconClass} tw-mr-3 tw-mt-1`} style={{ color: palette.icon }}></i>
                <div className="tw-flex-1">
                    <h5 className="tw-font-semibold tw-mb-2" style={{ color: palette.title }}>{title}</h5>
                    <p style={{ color: palette.text }}>{message}</p>
                </div>
            </div>
        </div>
    );
};

const ImpactSummary = ({ validationResult }) => (
    <div className="tw-mb-4">
        <h4 className="tw-text-base tw-font-semibold tw-mb-2" style={{ color: 'var(--fms-text-primary, #1f2937)' }}>
            Bulk Delete Summary
        </h4>
        <div className="tw-p-3 tw-rounded-lg tw-text-sm tw-space-y-2" style={{ background: 'var(--fms-surface-secondary, #f9fafb)', border: '1px solid var(--fms-border, #e5e7eb)' }}>
            <SummaryRow label="Selected Rows" value={validationResult.selectedCount || 0} />
            <SummaryRow label="Transactions To Delete" value={validationResult.totalTransactionsToDelete || 0} valueClassName="tw-font-semibold" />
            <SummaryRow label="Additional Transfer Rows" value={validationResult.additionalTransferTransactionCount || 0} />
            <SummaryRow label="Reference Rows To Delete" value={validationResult.deletedReferenceCount || 0} />
            <SummaryRow label="Reference Rows To Preserve" value={validationResult.preservedReferenceCount || 0} />
            <SummaryRow label="TankStock Rows To Update" value={validationResult.updatedReferenceCount || 0} />
            <SummaryRow label="Blocked Rows" value={validationResult.blockedCount || 0} valueClassName={(validationResult.blockedCount || 0) > 0 ? 'tw-text-red-600 tw-font-semibold' : ''} />
            <SummaryRow label="Rows Requiring Confirmation" value={validationResult.warningCount || 0} valueClassName={(validationResult.warningCount || 0) > 0 ? 'tw-text-amber-600 tw-font-semibold' : ''} />
        </div>
    </div>
);

const ItemList = ({ title, items, tone }) => {
    if (!items || items.length === 0) {
        return null;
    }

    const textColor = tone === 'blocked' ? 'var(--delete-blocked-text, #b91c1c)' : 'var(--delete-warning-text, #b45309)';

    return (
        <div className="tw-mb-4">
            <h5 className="tw-font-semibold tw-mb-2" style={{ color: textColor }}>{title}</h5>
            <div className="tw-space-y-2">
                {items.map((item) => {
                    const reason = VolumeChangeReasonEnum.find((entry) => entry.id === item.changeReason)?.name || 'Unknown';
                    return (
                        <div key={`${title}-${item.transactionId}`} className="tw-p-3 tw-rounded tw-text-sm" style={{ background: 'var(--fms-surface, #ffffff)', border: '1px solid var(--fms-border, #e5e7eb)' }}>
                            <div className="tw-flex tw-justify-between tw-gap-4 tw-mb-1">
                                <span className="tw-font-semibold">Transaction #{item.transactionId}</span>
                                <span>{reason}</span>
                            </div>
                            <div className="tw-text-xs tw-mb-1" style={{ color: 'var(--fms-text-secondary, #6b7280)' }}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown timestamp'}
                            </div>
                            <div style={{ color: textColor }}>{item.message}</div>
                            {item.recommendedAction && (
                                <div className="tw-text-xs tw-mt-1" style={{ color: 'var(--fms-text-secondary, #6b7280)' }}>
                                    {item.recommendedAction}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const BulkDeleteConfirmationDialog = ({
    visible,
    validationResult,
    isDeleting,
    userConfirmed,
    onConfirmChange,
    onCancel,
    onExecuteDelete
}) => {
    if (!visible) {
        return null;
    }

    const blockedCount = validationResult?.blockedCount || 0;
    const warningCount = validationResult?.warningCount || 0;
    const canExecute = !!validationResult && blockedCount === 0 && (!validationResult.requiresUserConfirmation || userConfirmed);

    return (
        <SlidePanel open={visible} onClose={onCancel} title="Bulk Delete Transactions" width={560}>
            <div className="tw-h-full tw-flex tw-flex-col tw-p-4">
                {!validationResult ? (
                    <LoadingState />
                ) : (
                    <ScrollView height="100%" width="100%" showScrollbar="onScroll">
                        <div className="tw-px-1">
                            {blockedCount > 0 ? (
                                <ToneBanner
                                    tone="blocked"
                                    title="Bulk Delete Blocked"
                                    message={validationResult.summaryMessage || 'One or more selected transactions cannot be deleted.'}
                                />
                            ) : warningCount > 0 ? (
                                <ToneBanner
                                    tone="warning"
                                    title="Confirmation Required"
                                    message={validationResult.summaryMessage || 'Deleting these transactions will recalculate future records.'}
                                />
                            ) : (
                                <ToneBanner
                                    tone="safe"
                                    title="Ready To Delete"
                                    message={validationResult.summaryMessage || 'All selected transactions can be deleted.'}
                                />
                            )}

                            <ImpactSummary validationResult={validationResult} />

                            {validationResult.preservedPumpTransactionCount > 0 && (
                                <div className="tw-mb-4 tw-text-sm" style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>
                                    PumpTransaction references preserved: {validationResult.preservedPumpTransactionCount}
                                </div>
                            )}

                            {validationResult.preservedPtsTransferCount > 0 && (
                                <div className="tw-mb-4 tw-text-sm" style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>
                                    PTS-created TankTransfer references preserved: {validationResult.preservedPtsTransferCount}
                                </div>
                            )}

                            <ItemList title="Blocked Transactions" items={validationResult.blockedItems} tone="blocked" />
                            <ItemList title="Transactions Requiring Confirmation" items={validationResult.warningItems} tone="warning" />

                            {validationResult.requiresUserConfirmation && blockedCount === 0 && (
                                <div className="tw-mt-4 tw-mb-6">
                                    <label className="tw-flex tw-items-center tw-space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={userConfirmed}
                                            onChange={(event) => onConfirmChange(event.target.checked)}
                                            className="tw-w-4 tw-h-4"
                                        />
                                        <span className="tw-text-sm" style={{ color: 'var(--fms-text-secondary, #374151)' }}>
                                            I understand the impact and want to proceed with the bulk deletion
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-2" style={{ borderTop: '1px solid var(--fms-border, #e5e7eb)', paddingTop: '12px' }}>
                                <Button text="Cancel" onClick={onCancel} stylingMode="outlined" disabled={isDeleting} />
                                <Button
                                    text={isDeleting ? 'Deleting...' : 'Delete Selected'}
                                    onClick={onExecuteDelete}
                                    type="default"
                                    disabled={!canExecute || isDeleting}
                                    className="tw-bg-red-600 hover:tw-bg-red-700"
                                />
                            </div>
                        </div>
                    </ScrollView>
                )}
            </div>
        </SlidePanel>
    );
};

export default BulkDeleteConfirmationDialog;