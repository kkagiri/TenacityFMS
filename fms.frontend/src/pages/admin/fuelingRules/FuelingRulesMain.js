import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Tabs from "devextreme-react/tabs";
import { ScrollView } from "devextreme-react";
import { fetchAllRuleSets } from "../../../redux/actions/fuelingRuleActions";
import { fetchTags } from "../../../redux/actions/tagActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import TagRuleManagement from "../../../components/Tags/TagRuleManagement/TagRuleManagement";
import LocationRulesSettings from "../../../components/Tags/TagRuleManagement/LocationRulesSettings";
import { RuleSetAssignmentManager } from "./index";
import { GeofenceManagement } from "./GeofenceManagement";
import FuelingRulesHelp from "../../ATG/fuelingprocess/Components/FuelingRulesHelp";
import "./FuelingRulesMain.scss";

/**
 * FuelingRulesMain - Main page for managing fueling rules
 * Contains tabs for:
 * 1. Rule Sets - Create and manage rule set templates with rules
 * 2. Assignments - Assign rule sets to Sites, VehicleTypes, Tags, or Vehicles
 */
const FuelingRulesMain = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Load initial data
  useEffect(() => {
    dispatch(fetchAllRuleSets());
    dispatch(fetchTags());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  const tabData = [
    {
      id: "rulesets",
      text: "Rule Sets",
      icon: "fa-light fa-layer-group",
    },
    {
      id: "assignments",
      text: "Assignments",
      icon: "fa-light fa-link",
    },
    {
      id: "location-rules",
      text: "Location Rules",
      icon: "fa-light fa-location-dot",
    },
    {
      id: "geofences",
      text: "Geofences",
      icon: "fa-light fa-map-location-dot",
    },
  ];

  const handleTabChange = (e) => {
    setActiveTab(e.itemIndex);
  };

  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <TagRuleManagement />;
      case 1:
        return <RuleSetAssignmentManager />;
      case 2:
        return <LocationRulesSettings />;
      case 3:
        return <GeofenceManagement />;
      default:
        return <TagRuleManagement />;
    }
  };

  return (
    <ScrollView className="fueling-rules-main">
      <div className="tw-p-4">
        {/* Page Header */}
        <div className="tw-mb-4">
          <div className="tw-flex tw-items-center tw-justify-between">
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-gas-pump tw-text-blue-600"></i>
              Fueling Rules Management
            </h1>
            <button
              className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-text-sm tw-text-gray-600 hover:tw-text-blue-600 tw-border tw-border-gray-200 tw-rounded-lg hover:tw-border-blue-300 tw-transition-colors"
              onClick={() => setShowHelp(true)}
            >
              <i className="fa-light fa-circle-question"></i>
              <span>Help Guide</span>
            </button>
          </div>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Create rule sets, define fueling limits, and assign rules to sites,
            vehicle types, tags, or individual vehicles
          </p>
        </div>

        {/* Help Popup */}
        <FuelingRulesHelp
          visible={showHelp}
          onClose={() => setShowHelp(false)}
        />

        {/* Tabs Navigation */}
        <Tabs
          dataSource={tabData}
          selectedIndex={activeTab}
          onItemClick={handleTabChange}
          className="tw-mb-4"
          width="100%"
          repaintChangesOnly={true}
          itemRender={renderTabItem}
          noDataText=""
        />

        {/* Tab Content */}
        <div className="tab-content">{renderContent()}</div>
      </div>
    </ScrollView>
  );
};

export default FuelingRulesMain;
