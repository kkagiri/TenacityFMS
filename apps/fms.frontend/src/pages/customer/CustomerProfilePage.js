/**
 * File:          CustomerProfilePage.js
 * Purpose:       Current-user profile surface for Customer ViewMode users.
 * Dependencies:  React, Redux
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - CustomerProfilePage(): Shows the signed-in user's tenant-scoped profile summary.
 */

import React from "react";
import { useSelector } from "react-redux";

const getDisplayName = (user) => user?.fullName || user?.FullName || user?.userName || user?.UserName || "User";

const CustomerProfilePage = () => {
    const user = useSelector((state) => state.auth.user);
    const tenantContext = useSelector((state) => state.tenantContext);

    const profileRows = [
        { label: "Name", value: getDisplayName(user) },
        { label: "Email", value: user?.email || user?.Email || "-" },
        { label: "Username", value: user?.userName || user?.UserName || "-" },
        { label: "Tenant", value: tenantContext?.tenantId || "-" },
        { label: "Account Type", value: tenantContext?.tenantKind || "client" },
    ];

    return (
        <div className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-user m365-page-header__icon" />
                    <h2 className="m365-page-header__title">Profile</h2>
                </div>
            </div>

            <div className="m365-section-group">
                <div className="m365-section-group__header">
                    <i className="fa-light fa-id-card m365-section-group__icon" />
                    <h3 className="m365-section-group__title">Account</h3>
                </div>
                <div className="m365-section-group__body">
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
                        {profileRows.map((row) => (
                            <div key={row.label} className="tw-border tw-border-[#edebe9] tw-rounded tw-bg-white tw-p-3">
                                <div className="tw-text-[12px] tw-text-[#605e5c] tw-mb-1">{row.label}</div>
                                <div className="tw-text-[13px] tw-text-[#201f1e] tw-font-medium tw-break-words">{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfilePage;