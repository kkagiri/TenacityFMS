/**
 * File: tagPage.js
 * Purpose: Admin tag management page shell with M365-style layout and side-panel form workflow
 * Dependencies: React, Redux, DevExtreme Button/ScrollView, TagList, TagForm
 * Last Modified: 2026-03-03
 *
 * Key Functions/Components:
 * - TagPage(): renders header, KPI stats, tag list, and selected tag details
 * - handleAddTag(): opens create form in side panel
 * - handleEditTag(): opens edit form in side panel
 */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ScrollView } from "devextreme-react";
import { fetchTags, setSelectedTag } from "../../redux/actions/tagActions";
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import TagList from "../../components/Tags/TagList/tagList";
import TagForm from "../../components/Tags/TagForm/TagForm";
import notify from "devextreme/ui/notify";
import "./tagpage.scss";

const TagPage = () => {
  const dispatch = useDispatch();
  const tags = useSelector((state) => state.tag.tags || []);
  const selectedTag = useSelector((state) => state.tag.selectedTag);
  const isLoading = useSelector((state) => state.tag.loading || false);

  // Local state
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const totalTags = Array.isArray(tags) ? tags.length : 0;
  const assignedVehicleCount = Array.isArray(tags)
    ? tags.filter((item) => !!item?.vehicleId).length
    : 0;

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
        <div className="tag-page-container">
          <div className="m365-page-header">
            <div className="m365-page-header__left">
              <i className="fa-light fa-tags m365-page-header__icon" />
              <h2 className="m365-page-header__title">
                Tag Management
                <span className="m365-page-header__count">{totalTags}</span>
              </h2>
            </div>
            <div className="m365-page-header__actions">
              <button className="m365-btn m365-btn--primary" onClick={handleAddTag}>
                <i className="fa-light fa-plus" />
                Add Tag
              </button>
              <button className="m365-btn m365-btn--ghost" onClick={handleRefreshData}>
                <i className="fa-light fa-rotate-right" />
                Refresh
              </button>
            </div>
          </div>

          <div className="m365-stats-row">
            <div className="m365-stat-item">
              <span className="m365-stat-item__value">{totalTags}</span>
              <span className="m365-stat-item__label">No. of Tags</span>
            </div>
            <div className="m365-stat-item">
              <span className="m365-stat-item__value">{assignedVehicleCount}</span>
              <span className="m365-stat-item__label">No. of Vehicle Assign</span>
            </div>
          </div>

          <div className="tag-layout">
            <div className="tag-layout__list-panel">
              <div className="tag-layout__section-header">
                <h3 className="tag-layout__title">Tags</h3>
                {isLoading && (
                  <span className="tag-layout__loading">
                    <i className="fa-light fa-loader fa-spin" /> Loading...
                  </span>
                )}
              </div>
              <TagList
                tags={tags}
                onTagSelect={handleTagSelection}
                onEditTag={handleEditTag}
              />
            </div>

            <div className="tag-layout__detail-panel">
              <div className="tag-layout__section-header">
                <h3 className="tag-layout__title">Tag Details</h3>
              </div>
              {selectedTag ? (
                <div className="tag-details-card">
                  <div className="tag-details-row">
                    <span className="tag-details-row__label">Tag Name</span>
                    <span className="tag-details-row__value">
                      {selectedTag.tagName || selectedTag.name || "-"}
                    </span>
                  </div>
                  <div className="tag-details-row">
                    <span className="tag-details-row__label">Tag Type</span>
                    <span className="tag-details-row__value">{selectedTag.tagType || "-"}</span>
                  </div>
                  <div className="tag-details-row">
                    <span className="tag-details-row__label">Status</span>
                    <span className="tag-details-row__value">
                      <span
                        className={`m365-badge ${selectedTag.isEnabled ? "m365-badge--success" : "m365-badge--error"
                          }`}
                      >
                        {selectedTag.isEnabled ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </div>
                  <div className="tag-details-row">
                    <span className="tag-details-row__label">Vehicle ID</span>
                    <span className="tag-details-row__value">
                      {selectedTag.vehicleId || "Not assigned"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="tag-details-empty">
                  <i className="fa-light fa-circle-info" />
                  Select a tag to view details
                </div>
              )}
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
