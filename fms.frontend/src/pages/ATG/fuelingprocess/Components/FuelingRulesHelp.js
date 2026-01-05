/**
 * FuelingRulesHelp.js
 * Purpose: User-facing help documentation for understanding fueling rules management
 * Shows how rule sets, assignments, and cascade hierarchy work
 */

import React, { useState } from "react";
import { Popup } from "devextreme-react/popup";
import "./FuelingRulesHelp.scss";

const FuelingRulesHelp = ({ visible, onClose }) => {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: "fa-circle-info" },
    { id: "rulesets", title: "Rule Sets", icon: "fa-clipboard-list" },
    { id: "assignments", title: "Assignments", icon: "fa-link" },
    { id: "cascade", title: "Priority System", icon: "fa-layer-group" },
    { id: "examples", title: "Examples", icon: "fa-lightbulb" },
  ];

  const renderOverview = () => (
    <div className="tw-space-y-4">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
        What are Fueling Rules?
      </h3>
      <p className="tw-text-gray-600 tw-leading-relaxed">
        Fueling Rules control how much fuel a vehicle can receive. They help
        organizations:
      </p>
      <ul className="tw-list-disc tw-list-inside tw-text-gray-600 tw-space-y-2 tw-ml-4">
        <li>Set daily, monthly, and per-transaction fuel limits</li>
        <li>Restrict fueling to specific time windows</li>
        <li>Limit the number of refills per day</li>
        <li>Prevent unauthorized or excessive fueling</li>
      </ul>

      <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-4 tw-mt-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <i className="fa-light fa-triangle-exclamation tw-text-amber-500 tw-text-lg tw-mt-0.5"></i>
          <div>
            <p className="tw-font-medium tw-text-amber-800">Important</p>
            <p className="tw-text-amber-700 tw-text-sm">
              Vehicles without assigned fueling rules{" "}
              <strong>cannot fuel</strong>. Rules must be configured before a
              vehicle can receive fuel.
            </p>
          </div>
        </div>
      </div>

      <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mt-6">
        Quick Flow
      </h4>
      <div className="tw-flex tw-items-center tw-justify-between tw-bg-gray-50 tw-rounded-lg tw-p-4">
        <div className="tw-text-center">
          <div className="tw-w-12 tw-h-12 tw-bg-blue-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-2">
            <i className="fa-light fa-clipboard-list tw-text-blue-600"></i>
          </div>
          <span className="tw-text-sm tw-text-gray-600">Create Rule Set</span>
        </div>
        <i className="fa-light fa-arrow-right tw-text-gray-400"></i>
        <div className="tw-text-center">
          <div className="tw-w-12 tw-h-12 tw-bg-green-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-2">
            <i className="fa-light fa-sliders tw-text-green-600"></i>
          </div>
          <span className="tw-text-sm tw-text-gray-600">Add Rules</span>
        </div>
        <i className="fa-light fa-arrow-right tw-text-gray-400"></i>
        <div className="tw-text-center">
          <div className="tw-w-12 tw-h-12 tw-bg-purple-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-2">
            <i className="fa-light fa-link tw-text-purple-600"></i>
          </div>
          <span className="tw-text-sm tw-text-gray-600">Assign to Target</span>
        </div>
        <i className="fa-light fa-arrow-right tw-text-gray-400"></i>
        <div className="tw-text-center">
          <div className="tw-w-12 tw-h-12 tw-bg-emerald-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-2">
            <i className="fa-light fa-gas-pump tw-text-emerald-600"></i>
          </div>
          <span className="tw-text-sm tw-text-gray-600">Vehicle Can Fuel</span>
        </div>
      </div>
    </div>
  );

  const renderRuleSets = () => (
    <div className="tw-space-y-4">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
        Rule Sets
      </h3>
      <p className="tw-text-gray-600 tw-leading-relaxed">
        A <strong>Rule Set</strong> is a named collection of rules that can be
        assigned to vehicles, vehicle types, tags, or sites. Think of it as a
        "fuel policy" template.
      </p>

      <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mt-6">
        Types of Rules
      </h4>

      <div className="tw-space-y-3">
        {/* Daily/Monthly Limit Rule */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
            <div className="tw-w-10 tw-h-10 tw-bg-blue-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
              <i className="fa-light fa-calendar-day tw-text-blue-600"></i>
            </div>
            <div>
              <h5 className="tw-font-semibold tw-text-gray-800">
                Daily & Monthly Limits
              </h5>
              <p className="tw-text-sm tw-text-gray-500">
                Restrict total fuel consumption over time
              </p>
            </div>
          </div>
          <div className="tw-bg-gray-50 tw-rounded tw-p-3 tw-text-sm tw-text-gray-600">
            <p>
              <strong>Example:</strong> Maximum 100L per day, 2,000L per month
            </p>
          </div>
        </div>

        {/* Per Transaction Limit */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
            <div className="tw-w-10 tw-h-10 tw-bg-green-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
              <i className="fa-light fa-gas-pump tw-text-green-600"></i>
            </div>
            <div>
              <h5 className="tw-font-semibold tw-text-gray-800">
                Per Transaction Limit
              </h5>
              <p className="tw-text-sm tw-text-gray-500">
                Maximum fuel per single fueling event
              </p>
            </div>
          </div>
          <div className="tw-bg-gray-50 tw-rounded tw-p-3 tw-text-sm tw-text-gray-600">
            <p>
              <strong>Example:</strong> Maximum 50L per fueling
            </p>
          </div>
        </div>

        {/* Number of Refills */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
            <div className="tw-w-10 tw-h-10 tw-bg-orange-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
              <i className="fa-light fa-repeat tw-text-orange-600"></i>
            </div>
            <div>
              <h5 className="tw-font-semibold tw-text-gray-800">
                Number of Refills
              </h5>
              <p className="tw-text-sm tw-text-gray-500">
                Limit how many times a vehicle can fuel
              </p>
            </div>
          </div>
          <div className="tw-bg-gray-50 tw-rounded tw-p-3 tw-text-sm tw-text-gray-600">
            <p>
              <strong>Example:</strong> Maximum 2 refills per day
            </p>
          </div>
        </div>

        {/* Time Window */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
            <div className="tw-w-10 tw-h-10 tw-bg-purple-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
              <i className="fa-light fa-clock tw-text-purple-600"></i>
            </div>
            <div>
              <h5 className="tw-font-semibold tw-text-gray-800">Time Window</h5>
              <p className="tw-text-sm tw-text-gray-500">
                Restrict fueling to specific hours
              </p>
            </div>
          </div>
          <div className="tw-bg-gray-50 tw-rounded tw-p-3 tw-text-sm tw-text-gray-600">
            <p>
              <strong>Example:</strong> Fueling allowed only 06:00 - 22:00
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="tw-space-y-4">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
        Rule Set Assignments
      </h3>
      <p className="tw-text-gray-600 tw-leading-relaxed">
        Once you create a rule set, you need to <strong>assign</strong> it to
        targets. Assignments link rule sets to specific entities in the system.
      </p>

      <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mt-6">
        Assignment Targets
      </h4>

      <div className="tw-grid tw-grid-cols-2 tw-gap-3">
        {/* Site */}
        <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-blue-100 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <i className="fa-light fa-building tw-text-blue-600"></i>
            <h5 className="tw-font-semibold tw-text-blue-800">Site</h5>
          </div>
          <p className="tw-text-sm tw-text-blue-700">
            Apply to ALL vehicles at a specific site (organization-wide default)
          </p>
        </div>

        {/* Vehicle Type */}
        <div className="tw-bg-gradient-to-br tw-from-green-50 tw-to-green-100 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <i className="fa-light fa-truck tw-text-green-600"></i>
            <h5 className="tw-font-semibold tw-text-green-800">Vehicle Type</h5>
          </div>
          <p className="tw-text-sm tw-text-green-700">
            Apply to all vehicles of a specific type (e.g., trucks, cars)
          </p>
        </div>

        {/* Tag */}
        <div className="tw-bg-gradient-to-br tw-from-orange-50 tw-to-orange-100 tw-border tw-border-orange-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <i className="fa-light fa-tag tw-text-orange-600"></i>
            <h5 className="tw-font-semibold tw-text-orange-800">Tag</h5>
          </div>
          <p className="tw-text-sm tw-text-orange-700">
            Apply to vehicles with a specific fuel tag
          </p>
        </div>

        {/* Vehicle */}
        <div className="tw-bg-gradient-to-br tw-from-purple-50 tw-to-purple-100 tw-border tw-border-purple-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <i className="fa-light fa-car tw-text-purple-600"></i>
            <h5 className="tw-font-semibold tw-text-purple-800">Vehicle</h5>
          </div>
          <p className="tw-text-sm tw-text-purple-700">
            Apply to a specific vehicle (highest priority override)
          </p>
        </div>
      </div>

      <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mt-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <i className="fa-light fa-lightbulb tw-text-blue-500 tw-text-lg tw-mt-0.5"></i>
          <div>
            <p className="tw-font-medium tw-text-blue-800">Best Practice</p>
            <p className="tw-text-blue-700 tw-text-sm">
              Start with a Site-level rule for defaults, then create specific
              overrides for vehicle types or individual vehicles as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCascade = () => (
    <div className="tw-space-y-4">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
        Priority System (Cascade)
      </h3>
      <p className="tw-text-gray-600 tw-leading-relaxed">
        When a vehicle has rules from multiple levels, the system{" "}
        <strong>merges</strong> them using a priority hierarchy. Higher priority
        rules override lower priority ones.
      </p>

      {/* Priority Visualization */}
      <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-mt-4">
        <h4 className="tw-text-sm tw-font-semibold tw-text-gray-600 tw-mb-4 tw-text-center">
          PRIORITY ORDER (Higher Wins)
        </h4>
        <div className="tw-space-y-2">
          {/* Vehicle - Highest */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-bg-purple-100 tw-border-2 tw-border-purple-300 tw-rounded-lg tw-p-3">
            <div className="tw-w-12 tw-text-center tw-font-bold tw-text-purple-700">
              100
            </div>
            <i className="fa-light fa-car tw-text-purple-600 tw-text-lg"></i>
            <div className="tw-flex-1">
              <span className="tw-font-semibold tw-text-purple-800">
                Vehicle
              </span>
              <span className="tw-text-sm tw-text-purple-600 tw-ml-2">
                Highest Priority
              </span>
            </div>
            <i className="fa-light fa-crown tw-text-purple-500"></i>
          </div>

          {/* Tag */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-lg tw-p-3">
            <div className="tw-w-12 tw-text-center tw-font-bold tw-text-orange-700">
              80
            </div>
            <i className="fa-light fa-tag tw-text-orange-600 tw-text-lg"></i>
            <div className="tw-flex-1">
              <span className="tw-font-semibold tw-text-orange-800">Tag</span>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-3">
            <div className="tw-w-12 tw-text-center tw-font-bold tw-text-green-700">
              50
            </div>
            <i className="fa-light fa-truck tw-text-green-600 tw-text-lg"></i>
            <div className="tw-flex-1">
              <span className="tw-font-semibold tw-text-green-800">
                Vehicle Type
              </span>
            </div>
          </div>

          {/* Site - Lowest */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
            <div className="tw-w-12 tw-text-center tw-font-bold tw-text-blue-700">
              10
            </div>
            <i className="fa-light fa-building tw-text-blue-600 tw-text-lg"></i>
            <div className="tw-flex-1">
              <span className="tw-font-semibold tw-text-blue-800">Site</span>
              <span className="tw-text-sm tw-text-blue-600 tw-ml-2">
                Default / Fallback
              </span>
            </div>
          </div>
        </div>
      </div>

      <h4 className="tw-text-md tw-font-semibold tw-text-gray-800 tw-mt-6">
        How Merging Works
      </h4>
      <ul className="tw-list-disc tw-list-inside tw-text-gray-600 tw-space-y-2 tw-ml-4">
        <li>
          <strong>Limits:</strong> Higher priority values are used
        </li>
        <li>
          <strong>Time Windows:</strong> More restrictive window applies
        </li>
        <li>
          <strong>All Applied:</strong> System tracks which rule sets
          contributed
        </li>
      </ul>
    </div>
  );

  const renderExamples = () => (
    <div className="tw-space-y-4">
      <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
        Real-World Examples
      </h3>

      {/* Example 1 */}
      <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
        <div className="tw-bg-gray-100 tw-px-4 tw-py-2 tw-border-b tw-border-gray-200">
          <h4 className="tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-1 tw-mr-2 tw-text-blue-500"></i>
            Basic Site-Wide Limits
          </h4>
        </div>
        <div className="tw-p-4 tw-space-y-3">
          <p className="tw-text-gray-600 tw-text-sm">
            <strong>Goal:</strong> Set a default 100L daily limit for all
            vehicles at the depot.
          </p>
          <div className="tw-bg-blue-50 tw-rounded tw-p-3">
            <p className="tw-text-sm tw-text-blue-800">
              1. Create Rule Set: "Site Default Limits"
              <br />
              2. Add Daily Limit Rule: 100L/day
              <br />
              3. Assign to Site: "Main Depot"
            </p>
          </div>
          <p className="tw-text-green-600 tw-text-sm">
            <i className="fa-light fa-check tw-mr-1"></i>
            Result: All vehicles at Main Depot get 100L daily limit
          </p>
        </div>
      </div>

      {/* Example 2 */}
      <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
        <div className="tw-bg-gray-100 tw-px-4 tw-py-2 tw-border-b tw-border-gray-200">
          <h4 className="tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-2 tw-mr-2 tw-text-green-500"></i>
            Different Limits by Vehicle Type
          </h4>
        </div>
        <div className="tw-p-4 tw-space-y-3">
          <p className="tw-text-gray-600 tw-text-sm">
            <strong>Goal:</strong> Light vehicles get 50L, heavy trucks get 200L
            daily.
          </p>
          <div className="tw-bg-green-50 tw-rounded tw-p-3">
            <p className="tw-text-sm tw-text-green-800">
              1. Create "Light Vehicle Rules" → 50L/day → Assign to "Car" type
              <br />
              2. Create "Heavy Truck Rules" → 200L/day → Assign to "Truck" type
            </p>
          </div>
          <p className="tw-text-green-600 tw-text-sm">
            <i className="fa-light fa-check tw-mr-1"></i>
            Result: Each vehicle type has appropriate limits
          </p>
        </div>
      </div>

      {/* Example 3 */}
      <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
        <div className="tw-bg-gray-100 tw-px-4 tw-py-2 tw-border-b tw-border-gray-200">
          <h4 className="tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-3 tw-mr-2 tw-text-purple-500"></i>
            Override for Special Vehicle
          </h4>
        </div>
        <div className="tw-p-4 tw-space-y-3">
          <p className="tw-text-gray-600 tw-text-sm">
            <strong>Goal:</strong> Vehicle HYG-001 needs higher limit than its
            type allows.
          </p>
          <div className="tw-bg-purple-50 tw-rounded tw-p-3">
            <p className="tw-text-sm tw-text-purple-800">
              1. Create "Special Vehicle Override" → 300L/day
              <br />
              2. Assign directly to Vehicle: "HYG-001"
            </p>
          </div>
          <p className="tw-text-green-600 tw-text-sm">
            <i className="fa-light fa-check tw-mr-1"></i>
            Result: HYG-001 gets 300L (overrides site and type rules)
          </p>
        </div>
      </div>
    </div>
  );

  // Use contentRender to avoid DevExtreme/React DOM conflicts
  const contentRender = () => {
    return (
      <div className="tw-flex tw-h-full fueling-rules-help-container">
        {/* Sidebar Navigation */}
        <div className="tw-w-48 tw-flex-shrink-0 tw-border-r tw-border-gray-200 tw-bg-gray-50 tw-p-3">
          <nav className="tw-space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveSection(section.id);
                }}
                className={`tw-w-full tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-lg tw-text-left tw-text-sm tw-transition-colors tw-cursor-pointer ${
                  activeSection === section.id
                    ? "tw-bg-blue-100 tw-text-blue-700 tw-font-medium"
                    : "tw-text-gray-600 hover:tw-bg-gray-100"
                }`}
              >
                <i className={`fa-light ${section.icon}`}></i>
                <span>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area - All sections rendered, only active one visible via CSS */}
        <div className="tw-flex-1 tw-p-6 tw-overflow-y-auto">
          <div
            style={{ display: activeSection === "overview" ? "block" : "none" }}
          >
            {renderOverview()}
          </div>
          <div
            style={{ display: activeSection === "rulesets" ? "block" : "none" }}
          >
            {renderRuleSets()}
          </div>
          <div
            style={{
              display: activeSection === "assignments" ? "block" : "none",
            }}
          >
            {renderAssignments()}
          </div>
          <div
            style={{ display: activeSection === "cascade" ? "block" : "none" }}
          >
            {renderCascade()}
          </div>
          <div
            style={{ display: activeSection === "examples" ? "block" : "none" }}
          >
            {renderExamples()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      title="Fueling Rules Help"
      showTitle={true}
      showCloseButton={true}
      width={800}
      height={600}
      dragEnabled={true}
      closeOnOutsideClick={true}
      contentRender={contentRender}
    />
  );
};

export default FuelingRulesHelp;
