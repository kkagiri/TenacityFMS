/**
 * File:          TankEmptyState.js
 * Purpose:       Shown in the detail area when nothing is selected — M365 style.
 * Dependencies:  none
 * Last Modified: 2026-02-26
 *
 * Props: (none)
 */
import React from "react";

const TankEmptyState = () => (
  <div className="m365-tank-empty">
    <i className="fa-light fa-gas-pump m365-tank-empty__icon" />
    <p className="m365-tank-empty__title">Select a site or tank</p>
    <p className="m365-tank-empty__hint">
      Choose a site to see its tank summary, or select a specific tank for detailed information.
    </p>
  </div>
);

export default TankEmptyState;
