/**
 * File:          M365PageHeader.js
 * Purpose:       Compact page header with icon, title, count, and action buttons — M365 style
 * Dependencies:  m365-shared.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - title    (string): Page title text
 * - icon     (string): FontAwesome class for the title icon
 * - count    (number): Item count badge next to the title
 * - children (node):   Action buttons rendered on the right
 */
import React from "react";

const M365PageHeader = ({ title, icon, count, children }) => (
    <div className="m365-page-header">
        <div className="m365-page-header__left">
            {icon && <i className={`${icon} m365-page-header__icon`}></i>}
            <h2 className="m365-page-header__title">
                {title}
                {count != null && <span className="m365-page-header__count">{count}</span>}
            </h2>
        </div>
        {children && <div className="m365-page-header__actions">{children}</div>}
    </div>
);

export default M365PageHeader;
