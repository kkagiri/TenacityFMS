/**
 * File: RuleSetsPage.js
 * Purpose: Tab-based page combining Rule Sets, Assignments, and Simulator under one view.
 * Dependencies: React, TagRuleManagement, RuleSetAssignmentManager, RuleSimulator
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - RuleSetsPage: M365-styled tab bar with three tabs rendering the appropriate sub-component.
 */
import React, { useState } from "react";
import TagRuleManagement from "../../../components/Tags/TagRuleManagement/TagRuleManagement";
import RuleSetAssignmentManager from "./RuleSetAssignmentManager";
import { RuleSimulator } from "./RuleSimulator";
import "./RuleSetsPage.scss";

const TABS = [
  { id: "rulesets", label: "Rule Sets", icon: "fa-light fa-layer-group" },
  { id: "assignments", label: "Assignments", icon: "fa-light fa-link" },
  { id: "simulator", label: "Simulator", icon: "fa-light fa-flask" },
];

const RuleSetsPage = () => {
  const [activeTab, setActiveTab] = useState("rulesets");

  return (
    <div className="rulesets-page">
      {/* M365 Tab Bar */}
      <div className="m365-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`m365-tab${activeTab === tab.id ? " m365-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rulesets-page__content">
        {activeTab === "rulesets" && <TagRuleManagement />}
        {activeTab === "assignments" && <RuleSetAssignmentManager />}
        {activeTab === "simulator" && <RuleSimulator />}
      </div>
    </div>
  );
};

export default RuleSetsPage;
