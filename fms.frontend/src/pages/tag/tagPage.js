import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Item, Toolbar } from "devextreme-react/toolbar";
import Button from "devextreme-react/button";
import Tabs from "devextreme-react/tabs";
import { ScrollView } from "devextreme-react";
import { fetchTags, setSelectedTag } from "../../redux/actions/tagActions";
import { fetchAllRuleSets } from "../../redux/actions/fuelingRuleActions";
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import TagList from "../../components/Tags/TagList/tagList";
import TagRuleManagement from "../../components/Tags/TagRuleManagement/TagRuleManagement";
import TagRuleAssignment from "../../components/Tags/TagRuleManagement/TagRuleAssignment";
import TagForm from "../../components/Tags/TagForm/TagForm";
import notify from "devextreme/ui/notify";
import "./tagpage.scss";

// Custom styles for components
const styles = {
  tabs: {
    marginBottom: "15px",
  },
  tabItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  contentContainer: {
    width: "100%",
    height: "calc(100vh - 150px)",
  },
  panelsContainer: {
    display: "flex",
    width: "100%",
    height: "100%",
  },
  leftPanel: {
    flex: "0 0 40%",
    borderRight: "1px solid #ddd",
    padding: "10px",
    height: "100%",
    overflowY: "auto",
  },
  rightPanel: {
    flex: "1 1 60%",
    padding: "10px",
    height: "100%",
    overflowY: "auto",
  },
};

const TagPage = () => {
  const dispatch = useDispatch();
  const tags = useSelector((state) => state.tag.tags || []);
  const selectedTag = useSelector((state) => state.tag.selectedTag);
  const vehicles = useSelector((state) => state.vehicle.vehicles || []);
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets || []);
  const isLoading = useSelector(
    (state) => state.tag.loading || state.fuelingRule.loading || false
  );

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [showRuleAssignment, setShowRuleAssignment] = useState(false);

  useEffect(() => {
    dispatch(fetchTags());
    dispatch(fetchAllRuleSets());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  const handleTagSelection = (tag) => {
    if (tag) {
      dispatch(setSelectedTag(tag));
    }
  };

  // Simplified tab change handler
  const handleTabChange = (e) => {
    setActiveTab(e.itemIndex);
  };

  const handleAddTag = () => {
    setEditingTag(null);
    setShowTagForm(true);
  };

  const handleEditTag = (tag) => {
    if (!tag) {
      notify("Cannot edit: Invalid tag data", "error", 2000);
      return;
    }
    setEditingTag(tag);
    setShowTagForm(true);
  };

  const handleFormClose = () => {
    setShowTagForm(false);
    setEditingTag(null);
  };

  const handleTagSave = (success) => {
    if (success) {
      setShowTagForm(false);
      dispatch(fetchTags());
      notify("Tag saved successfully", "success", 2000);
    }
  };

  const handleAssignRules = () => {
    setShowRuleAssignment(true);
  };

  const handleAssignmentClose = () => {
    setShowRuleAssignment(false);
    dispatch(fetchTags());
  };

  const handleRefreshData = () => {
    dispatch(fetchTags());
    dispatch(fetchAllRuleSets());
    dispatch(fetchVehicleList());
    notify("Data refreshed", "info", 1000);
  };

  // Tab data
  const tabData = [
    { text: "Tag Management", icon: "fas fa-tags" },
    { text: "Fueling Rules", icon: "fas fa-gas-pump" },
  ];

  // Cursor: Define a custom tab item renderer to fix duplication issue
  const renderTabItem = (item) => {
    return (
      <div style={styles.tabItem}>
        <i className={item.icon}></i>
        <span>{item.text}</span>
      </div>
    );
  };

  // Render tab content based on active tab
  const renderContent = () => {
    if (activeTab === 0) {
      return (
        <div style={styles.panelsContainer}>
          <div style={styles.leftPanel}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <Button
                text="Add Tag"
                type="default"
                stylingMode="contained"
                icon="fas fa-plus"
                onClick={handleAddTag}
              />
            </div>
            <TagList
              tags={tags}
              onTagSelect={handleTagSelection}
              onEditTag={handleEditTag}
            />
          </div>
          <div style={styles.rightPanel}>
            <h3>Tag Details</h3>
            {selectedTag ? (
              <div>
                <p>Details for selected tag will display here</p>
                <pre>{JSON.stringify(selectedTag, null, 2)}</pre>
              </div>
            ) : (
              <p>Select a tag to view details</p>
            )}
          </div>
        </div>
      );
    } else {
      return <TagRuleManagement />;
    }
  };

  return (
    <ScrollView className="content-block">
      <div className="view-wrapper view-wrapper-tag-page">
        <div className="view-container">
          {/* Tabs Navigation */}
          <Tabs
            dataSource={tabData}
            selectedIndex={activeTab}
            onItemClick={handleTabChange}
            style={styles.tabs}
            width="100%"
            repaintChangesOnly={true}
            itemRender={renderTabItem}
            noDataText=""
          />

          {/* Tab Content */}
          <div style={styles.contentContainer}>{renderContent()}</div>
        </div>
      </div>

      {showTagForm && (
        <TagForm
          isVisible={showTagForm}
          onClose={handleFormClose}
          onSave={handleTagSave}
          tag={editingTag}
        />
      )}

      {showRuleAssignment && (
        <TagRuleAssignment
          isVisible={showRuleAssignment}
          onClose={handleAssignmentClose}
          tags={tags}
          ruleSets={ruleSets}
        />
      )}
    </ScrollView>
  );
};

export default TagPage;
