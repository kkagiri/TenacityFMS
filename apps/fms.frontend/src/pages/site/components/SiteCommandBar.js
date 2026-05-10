/**
 * File:          SiteCommandBar.js
 * Purpose:       M365 command bar with Add, Edit, Delete, Refresh actions — permission-gated
 * Dependencies:  usePermissions, m365-shared.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - selectedSite (object):  Currently selected site (null disables edit/delete)
 * - onAdd        (func):    Open create form
 * - onEdit       (func):    Open edit form for selected site
 * - onDelete     (func):    Delete selected site
 * - onRefresh    (func):    Refresh site list
 */
import React from "react";
import { usePermissions } from "../../../hooks/usePermissions";

const SiteCommandBar = ({ selectedSite, onAdd, onEdit, onDelete, onRefresh }) => {
    const { hasPermission } = usePermissions();
    const canManage = hasPermission("_Manage_Site");

    return (
        <div className="m365-site-command-bar">
            {canManage && (
                <button className="m365-btn m365-btn--primary" onClick={onAdd}>
                    <i className="fa-light fa-plus"></i>
                    Add Site
                </button>
            )}
            <button className="m365-btn m365-btn--ghost" onClick={onRefresh}>
                <i className="fa-light fa-rotate-right"></i>
                Refresh
            </button>
            {canManage && (
                <>
                    <button
                        className="m365-btn m365-btn--ghost"
                        onClick={onEdit}
                        disabled={!selectedSite}
                    >
                        <i className="fa-light fa-pen-to-square"></i>
                        Edit
                    </button>
                    <button
                        className="m365-btn m365-btn--ghost"
                        onClick={onDelete}
                        disabled={!selectedSite}
                        style={selectedSite ? { color: "#d13438" } : undefined}
                    >
                        <i className="fa-light fa-trash-can"></i>
                        Delete
                    </button>
                </>
            )}
        </div>
    );
};

export default SiteCommandBar;
