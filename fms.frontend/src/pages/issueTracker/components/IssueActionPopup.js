/**
 * File: IssueActionPopup.js
 * Purpose: Reusable confirmation popup with notes/description textarea for issue actions
 *          (Mark as Complete, Close Issue, etc.) — replaces window.prompt() calls.
 *          Supports rendering as a DevExtreme Popup (default) or as a SlidePanel (asPanel=true).
 * Dependencies: React, DevExtreme Popup/Button/TextArea/LoadIndicator, SlidePanel
 * Last Modified: 2026-03-05
 *
 * Key Components:
 * - IssueActionPopup: Modal dialog or slide panel with title, description hint, textarea, and confirm/cancel buttons
 */
import React, { useState, useCallback, useEffect } from 'react';
import Popup from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import TextArea from 'devextreme-react/text-area';
import LoadIndicator from 'devextreme-react/load-indicator';
import SlidePanel from '../../../components/ui/SlidePanel';

/**
 * @param {Object} props
 * @param {boolean} props.visible - Whether the popup is shown
 * @param {Function} props.onHide - Called when popup is closed without confirming
 * @param {Function} props.onConfirm - Called with (notes: string) when user confirms
 * @param {string} props.title - Popup title, e.g. "Mark Issue as Complete"
 * @param {string} [props.subtitle] - Optional subtitle / hint text
 * @param {string} [props.confirmText] - Confirm button label (default "Confirm")
 * @param {string} [props.confirmIcon] - Confirm button icon (default "fa-light fa-check")
 * @param {string} [props.confirmType] - Confirm button DevExtreme type (default "success")
 * @param {string} [props.placeholder] - Textarea placeholder
 * @param {boolean} [props.notesRequired] - If true, confirm is disabled when notes are empty
 * @param {boolean} [props.isProcessing] - Show loading state on confirm button
 * @param {string} [props.icon] - Header icon class
 * @param {string} [props.iconColor] - Tailwind text color for the header icon
 * @param {boolean} [props.asPanel] - Render as SlidePanel instead of Popup
 * @param {number|string} [props.panelWidth] - SlidePanel width (default 1000)
 */
const IssueActionPopup = ({
    visible,
    onHide,
    onConfirm,
    title = 'Confirm Action',
    subtitle = '',
    confirmText = 'Confirm',
    confirmIcon = 'fa-light fa-check',
    confirmType = 'success',
    placeholder = 'Enter notes (optional)...',
    notesRequired = false,
    isProcessing = false,
    icon = 'fa-light fa-circle-info',
    iconColor = 'tw-text-blue-600',
    asPanel = false,
    panelWidth = 1000
}) => {
    const [notes, setNotes] = useState('');

    // Reset notes when popup opens
    useEffect(() => {
        if (visible) {
            setNotes('');
        }
    }, [visible]);

    const handleConfirm = useCallback(() => {
        if (onConfirm) {
            onConfirm(notes.trim());
        }
    }, [notes, onConfirm]);

    const handleCancel = useCallback(() => {
        if (!isProcessing && onHide) {
            onHide();
        }
    }, [isProcessing, onHide]);

    const isConfirmDisabled = isProcessing || (notesRequired && !notes.trim());

    /* ── Shared body content ─────────────────────────── */
    const bodyContent = (
        <div className="tw-p-6 tw-flex tw-flex-col tw-h-full">
            {/* Subtitle */}
            {subtitle && (
                <p className="tw-text-[13px] tw-text-gray-500 tw-mb-5 tw-leading-relaxed">{subtitle}</p>
            )}

            {/* Notes textarea */}
            <div className="tw-mb-5">
                <label
                    htmlFor="action-notes"
                    className="tw-block tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-[.5px] tw-mb-2"
                >
                    Notes {notesRequired ? <span className="tw-text-red-500">*</span> : '(Optional)'}
                </label>
                <TextArea
                    id="action-notes"
                    value={notes}
                    onValueChanged={(e) => setNotes(e.value)}
                    placeholder={placeholder}
                    height={asPanel ? 200 : 140}
                    maxLength={2000}
                    disabled={isProcessing}
                    stylingMode="outlined"
                />
                <p className="tw-text-[11px] tw-text-gray-400 tw-mt-1 tw-text-right">
                    {notes.length} / 2000
                </p>
            </div>

            {/* Actions */}
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-3 tw-pt-3 tw-border-t tw-border-gray-100">
                <Button
                    text="Cancel"
                    icon="fa-light fa-xmark"
                    stylingMode="outlined"
                    type="normal"
                    onClick={handleCancel}
                    disabled={isProcessing}
                />
                <Button
                    text={isProcessing ? 'Processing...' : confirmText}
                    icon={isProcessing ? undefined : confirmIcon}
                    type={confirmType}
                    stylingMode="contained"
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled}
                >
                    {isProcessing && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <LoadIndicator height={16} width={16} />
                            <span>Processing...</span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );

    /* ── SlidePanel variant ──────────────────────────── */
    if (asPanel) {
        const panelHeaderActions = (
            <div className={`tw-w-9 tw-h-9 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-gray-100 ${iconColor}`}>
                <i className={`${icon} tw-text-base`}></i>
            </div>
        );
        return (
            <SlidePanel
                open={visible}
                onClose={!isProcessing ? handleCancel : undefined}
                title={title}
                width={panelWidth}
                headerActions={panelHeaderActions}
            >
                {bodyContent}
            </SlidePanel>
        );
    }

    /* ── Default Popup variant ───────────────────────── */
    return (
        <Popup
            visible={visible}
            onHiding={handleCancel}
            dragEnabled={false}
            showCloseButton={!isProcessing}
            showTitle={false}
            width={520}
            height="auto"
            maxHeight="80vh"
            shading={true}
            shadingColor="rgba(0,0,0,0.4)"
            wrapperAttr={{ class: 'issue-action-popup' }}
        >
            <div className="tw-p-6">
                {/* Header */}
                <div className="tw-mb-5">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <div className={`tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-gray-100 ${iconColor}`}>
                            <i className={`${icon} tw-text-lg`}></i>
                        </div>
                        <div>
                            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-leading-tight">{title}</h3>
                            {subtitle && (
                                <p className="tw-text-sm tw-text-gray-500 tw-mt-0.5">{subtitle}</p>
                            )}
                        </div>
                    </div>
                </div>
                {bodyContent}
            </div>
        </Popup>
    );
};

export default IssueActionPopup;
