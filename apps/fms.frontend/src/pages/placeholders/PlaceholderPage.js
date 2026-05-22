/**
 * File:          PlaceholderPage.js
 * Purpose:       Empty module placeholder pages for the documented FMS navigation map.
 * Dependencies:  React, react-router-dom, PlaceholderPage.scss
 * Last Modified: 2026-05-22
 *
 * Key Functions:
 * - PlaceholderPage(): Renders a compact empty-state page for planned modules.
 */

import React from "react";
import { useLocation } from "react-router-dom";
import "./PlaceholderPage.scss";

const placeholderModules = {
  dashboard: {
    title: "Dashboard",
    eyebrow: "Operational overview",
    icon: "fa-light fa-gauge-high",
    description: "Placeholder for real-time KPIs, quick stats, active alerts, and system health.",
  },
  fueling: {
    title: "Fueling",
    eyebrow: "Fuel management",
    icon: "fa-light fa-fuel-pump",
    description: "Placeholder for pump transactions, PTS commands, fuel audit, provider setup, and fuel rules.",
  },
  dispatch: {
    title: "Dispatch & Operations",
    eyebrow: "Task and trip management",
    icon: "fa-light fa-clipboard-list-check",
    description: "Placeholder for dispatch board, trip assignments, driver operations, KPIs, and task history.",
  },
  fiscal: {
    title: "Fiscal Compliance",
    eyebrow: "KRA eTIMS",
    icon: "fa-light fa-file-certificate",
    description: "Placeholder for fiscal providers, signing status, compliance reports, receipts, and queue monitoring.",
  },
  reports: {
    title: "Reports & Analytics",
    eyebrow: "Analytics workspace",
    icon: "fa-light fa-chart-line",
    description: "Placeholder for report surfaces that are documented but not yet implemented in the reporting module.",
  },
  profile: {
    title: "System & Profile",
    eyebrow: "User account",
    icon: "fa-light fa-circle-user",
    description: "Placeholder for personal profile, account settings, notification preferences, and help links.",
  },
  help: {
    title: "Help & Documentation",
    eyebrow: "Support",
    icon: "fa-light fa-circle-question",
    description: "Placeholder for user help, documentation, and operational guidance.",
  },
};

const prettifyRoute = (pathname) =>
  pathname
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .join(" / ");

export default function PlaceholderPage({ moduleKey }) {
  const location = useLocation();
  const module = placeholderModules[moduleKey] || placeholderModules.dashboard;
  const routeLabel = prettifyRoute(location.pathname) || module.title;

  return (
    <div className="fms-placeholder-page">
      <div className="fms-placeholder-page__header">
        <div className="fms-placeholder-page__title-row">
          <span className="fms-placeholder-page__icon" aria-hidden="true">
            <i className={module.icon} />
          </span>
          <div>
            <span className="fms-placeholder-page__eyebrow">{module.eyebrow}</span>
            <h2 className="fms-placeholder-page__title">{module.title}</h2>
          </div>
        </div>
        <span className="fms-placeholder-page__badge">Placeholder</span>
      </div>

      <div className="fms-placeholder-page__body">
        <div className="fms-placeholder-page__empty">
          <i className={module.icon} aria-hidden="true" />
          <h3>{routeLabel}</h3>
          <p>{module.description}</p>
        </div>
      </div>
    </div>
  );
}
