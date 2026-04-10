/**
 * File: WarningLetterSettingsPage.js
 * Purpose: Legacy wrapper page for warning letter settings. Redirected flow now uses a slide panel from the list page.
 * Dependencies: React, react-router-dom, WarningLetterSettingsPanelContent, usePermissions, M365 Fluent design
 * Last Modified: 2026-04-08
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import WarningLetterSettingsPanelContent from "./WarningLetterSettingsPanelContent";
import "./WarningLetters.scss";

const WarningLetterSettingsPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const canEdit = hasPermission("_Update_WarningLetter");

    return (
        <div className="warning-letter-page warning-letter-settings">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-gear m365-page-header__icon" />
                    <h2 className="m365-page-header__title">Warning Letter Settings</h2>
                </div>
                <div className="m365-page-header__actions">
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={() => navigate("/reports/warning-letters")}
                    >
                        <i className="fa-light fa-arrow-left" /> Back to Warning Letters
                    </button>
                </div>
            </div>

            <div className="warning-letter-page__panel">
                <WarningLetterSettingsPanelContent canEdit={canEdit} />
            </div>
        </div>
    );
};

export default WarningLetterSettingsPage;
