/**
 * File:          TankCommandBar.js
 * Purpose:       M365-style command bar with Add, Edit, History, Calibration, Link PTS, Unassign, Delete, Refresh.
 * Dependencies:  m365-shared.scss
 * Last Modified: 2026-03-23
 *
 * Props:
 * - selectedTank (object|null): Currently selected tank (null disables most actions)
 * - onAdd        (func): Open create form
 * - onEdit       (func): Open edit form
 * - onHistory    (func): Open volume history panel
 * - onCalibration(func): Open calibration panel
 * - onLinkPTS    (func): Open PTS device link panel
 * - onUnassign   (func): Unassign tank from site
 * - onDelete     (func): Delete selected tank
 * - onRefresh    (func): Refresh data
 */
import React from "react";

const TankCommandBar = ({
  selectedTank,
  onAdd,
  onEdit,
  onHistory,
  onCalibration,
  onLinkPTS,
  onUnassign,
  onDelete,
  onRefresh,
}) => (
  <div className="m365-tank-command-bar">
    <button className="m365-btn m365-btn--primary" onClick={onAdd}>
      <i className="fa-light fa-plus"></i>
      Add Tank
    </button>
    <button className="m365-btn m365-btn--ghost" onClick={onRefresh}>
      <i className="fa-light fa-rotate-right"></i>
      Refresh
    </button>

    <span className="m365-cmd-divider" />

    <button
      className="m365-btn m365-btn--ghost"
      onClick={onEdit}
      disabled={!selectedTank}
    >
      <i className="fa-light fa-pen-to-square"></i>
      Edit
    </button>
    <button
      className="m365-btn m365-btn--ghost"
      onClick={onHistory}
      disabled={!selectedTank}
    >
      <i className="fa-light fa-clock-rotate-left"></i>
      History
    </button>
    <button
      className="m365-btn m365-btn--ghost"
      onClick={onCalibration}
      disabled={!selectedTank}
    >
      <i className="fa-light fa-flask-vial"></i>
      Calibration
    </button>
    <button
      className="m365-btn m365-btn--ghost"
      onClick={onLinkPTS}
      disabled={!selectedTank}
    >
      <i className="fa-light fa-link"></i>
      Link PTS
    </button>
    <button
      className="m365-btn m365-btn--ghost"
      onClick={onUnassign}
      disabled={!selectedTank}
    >
      <i className="fa-light fa-link-slash"></i>
      Unassign
    </button>
    <button
      className="m365-btn m365-btn--ghost"
      onClick={onDelete}
      disabled={!selectedTank}
      style={selectedTank ? { color: "#d13438" } : undefined}
    >
      <i className="fa-light fa-trash-can"></i>
      Delete
    </button>
  </div>
);

export default TankCommandBar;
