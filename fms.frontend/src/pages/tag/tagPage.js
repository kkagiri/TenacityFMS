import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "devextreme-react/button";
import { ScrollView } from "devextreme-react";
import { fetchTags, setSelectedTag } from "../../redux/actions/tagActions";
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import TagList from "../../components/Tags/TagList/tagList";
import TagForm from "../../components/Tags/TagForm/TagForm";
import notify from "devextreme/ui/notify";
import "./tagpage.scss";

// Custom styles for components
const styles = {
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
  const isLoading = useSelector((state) => state.tag.loading || false);

  // Local state
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  useEffect(() => {
    dispatch(fetchTags());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  const handleTagSelection = (tag) => {
    if (tag) {
      dispatch(setSelectedTag(tag));
    }
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

  const handleRefreshData = () => {
    dispatch(fetchTags());
    dispatch(fetchVehicleList());
    notify("Data refreshed", "info", 1000);
  };

  return (
    <ScrollView className="content-block">
      <div className="view-wrapper view-wrapper-tag-page">
        <div className="view-container">
          {/* Page Header */}
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-4 tw-p-4">
            <div>
              <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-tags tw-text-blue-600"></i>
                Tag Management
              </h1>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                Manage RFID tags and vehicle assignments
              </p>
            </div>
            <div className="tw-flex tw-gap-2">
              <Button
                icon="fa-light fa-refresh"
                hint="Refresh"
                stylingMode="text"
                onClick={handleRefreshData}
              />
            </div>
          </div>

          {/* Content */}
          <div style={styles.contentContainer}>
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
                    icon="fa-light fa-plus"
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
                <h3 className="tw-text-lg tw-font-semibold tw-mb-3">
                  Tag Details
                </h3>
                {selectedTag ? (
                  <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg">
                    <div className="tw-space-y-2">
                      <div className="tw-flex tw-justify-between">
                        <span className="tw-text-gray-600">Tag Name:</span>
                        <span className="tw-font-medium">
                          {selectedTag.tagName || selectedTag.name || "-"}
                        </span>
                      </div>
                      <div className="tw-flex tw-justify-between">
                        <span className="tw-text-gray-600">Tag Type:</span>
                        <span className="tw-font-medium">
                          {selectedTag.tagType || "-"}
                        </span>
                      </div>
                      <div className="tw-flex tw-justify-between">
                        <span className="tw-text-gray-600">Status:</span>
                        <span
                          className={`tw-font-medium ${
                            selectedTag.isEnabled
                              ? "tw-text-green-600"
                              : "tw-text-red-600"
                          }`}
                        >
                          {selectedTag.isEnabled ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {selectedTag.vehicleId && (
                        <div className="tw-flex tw-justify-between">
                          <span className="tw-text-gray-600">Vehicle ID:</span>
                          <span className="tw-font-medium">
                            {selectedTag.vehicleId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="tw-text-gray-500 tw-italic">
                    Select a tag to view details
                  </div>
                )}
              </div>
            </div>
          </div>
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
    </ScrollView>
  );
};

export default TagPage;
