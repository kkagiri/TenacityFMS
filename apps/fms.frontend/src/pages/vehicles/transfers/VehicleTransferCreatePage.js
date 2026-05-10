/**
 * File: VehicleTransferCreatePage.js
 * Purpose: Full-page wrapper for Vehicle Transfer Form (create mode).
 *          Replaces the popup-based workflow for creating new transfers.
 * Dependencies: VehicleTransferForm, react-router-dom
 * Last Modified: 2026-02-27
 *
 * Key Functions:
 * - Renders VehicleTransferForm as a standalone page
 * - Handles navigation back to transfer list on close/success
 * - Reads optional vehicleId from query params for pre-selection
 */

import React, { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import notify from "devextreme/ui/notify";
import VehicleTransferForm from "./VehicleTransferForm";

const VehicleTransferCreatePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const vehicleId = searchParams.get("vehicleId") || null;

    const handleClose = useCallback(() => {
        navigate("/vehicles/transfers");
    }, [navigate]);

    const handleSuccess = useCallback(
        (data) => {
            notify("Transfer created successfully", "success", 3000);
            navigate("/vehicles/transfers");
        },
        [navigate]
    );

    return (
        <div className="tw-h-full tw-flex tw-flex-col tw-overflow-hidden">
            {/* Page header with back navigation */}
            <div className="tw-bg-white tw-border-b tw-px-5 tw-py-3 tw-flex tw-items-center tw-gap-3 tw-flex-shrink-0">
                <button
                    className="m365-btn m365-btn--ghost tw-flex tw-items-center tw-gap-2"
                    onClick={handleClose}
                    type="button"
                >
                    <i className="fa-light fa-arrow-left" />
                    <span>Back to Transfers</span>
                </button>
                <span className="tw-text-gray-300 tw-mx-1">|</span>
                <h2 className="tw-text-base tw-font-semibold tw-text-gray-800 tw-m-0">
                    Create Vehicle Transfer
                </h2>
            </div>

            {/* Form content */}
            <div className="tw-flex-1 tw-overflow-y-auto tw-p-5 tw-bg-[#faf9f8]">
                <VehicleTransferForm
                    vehicleId={vehicleId}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
};

export default VehicleTransferCreatePage;
