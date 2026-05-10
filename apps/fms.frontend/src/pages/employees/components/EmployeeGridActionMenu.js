/**
 * File: EmployeeGridActionMenu.js
 * Purpose: Meatball row-action menu for employee grid records.
 * Dependencies: React, employeePage.scss action-menu classes.
 * Last Modified: 2026-04-25
 *
 * Key Components:
 * - EmployeeGridActionMenu(): Shows view, edit, and delete actions behind an ellipsis button.
 */
import React from "react";

const EmployeeGridActionMenu = ({
    employee,
    isOpen,
    canEdit,
    canDelete,
    deleting,
    menuPosition,
    onToggle,
    onView,
    onEdit,
    onDelete,
}) => {
    const employeeName = employee?.fullName || "employee";

    const handleAction = (event, action) => {
        event.stopPropagation();
        action(employee);
    };

    return (
        <div className="employee-grid__action-menu-wrap">
            <button
                type="button"
                className="employee-grid__meatball"
                aria-label={`Open actions for ${employeeName}`}
                aria-expanded={isOpen}
                onClick={(event) => {
                    event.stopPropagation();
                    onToggle(employee?.id, event.currentTarget.getBoundingClientRect());
                }}
            >
                <i className="fa-light fa-ellipsis-vertical" />
            </button>

            {isOpen && (
                <div className="employee-grid__action-menu" role="menu" style={menuPosition || undefined}>
                    <button type="button" role="menuitem" onClick={(event) => handleAction(event, onView)}>
                        <i className="fa-light fa-eye" />
                        View
                    </button>
                    {canEdit && (
                        <button type="button" role="menuitem" onClick={(event) => handleAction(event, onEdit)}>
                            <i className="fa-light fa-pen-to-square" />
                            Edit
                        </button>
                    )}
                    {canDelete && (
                        <button
                            type="button"
                            role="menuitem"
                            className="employee-grid__action-menu-danger"
                            disabled={deleting}
                            onClick={(event) => handleAction(event, onDelete)}
                        >
                            <i className="fa-light fa-trash-can" />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeGridActionMenu;