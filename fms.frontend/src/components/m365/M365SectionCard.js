/**
 * File:          M365SectionCard.js
 * Purpose:       Collapsible section card with icon header bar — M365 Admin Center style
 * Dependencies:  m365-shared.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - title    (string):  Section heading text
 * - icon     (string):  FontAwesome class for header icon
 * - actions  (node):    Optional action buttons rendered in the header right side
 * - children (node):    Section body content
 */
import React from "react";

const M365SectionCard = ({ title, icon, actions, children }) => (
    <div className="m365-section-group">
        <div className="m365-section-group__header">
            {icon && <i className={`${icon} m365-section-group__icon`}></i>}
            <h3 className="m365-section-group__title">{title}</h3>
            {actions && <div className="m365-section-group__actions">{actions}</div>}
        </div>
        <div className="m365-section-group__body">{children}</div>
    </div>
);

export default M365SectionCard;
