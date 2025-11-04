import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { CheckBox } from 'devextreme-react/check-box';
import notify from 'devextreme/ui/notify';
import { assignTagToVehicle, fetchTags, createTag } from '../../../../redux/actions/tagActions';

const TagAssignmentPopup = ({ vehicleId, currentTags = [], onSave, onCancel }) => {
  const dispatch = useDispatch();
  const { tags } = useSelector(state => state.tag);

  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagId, setNewTagId] = useState('');
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchTags());
    // Initialize selected tags with current tags
    setSelectedTags(currentTags.map(tag => tag.id));
  }, [dispatch, currentTags]);

  // Filter available tags (unassigned or already assigned to current vehicle)
  const availableTags = tags.filter(tag =>
    !tag.vehicleId || tag.vehicleId === vehicleId
  );

  const handleTagSelection = (tagId, isSelected) => {
    if (isSelected) {
      setSelectedTags(prev => [...prev, tagId]);
    } else {
      setSelectedTags(prev => prev.filter(id => id !== tagId));
    }
  };

  const handleCreateNewTag = async () => {
    if (!newTagId.trim()) {
      notify('Please enter a tag ID', 'error', 3000);
      return;
    }

    try {
      setLoading(true);
      const result = await dispatch(createTag({
        tagId: newTagId.trim(),
        tagType: 'RFID',
        vehicleId: vehicleId
      }));

      if (result.success) {
        notify('Tag created successfully', 'success', 3000);
        setNewTagId('');
        setShowNewTagForm(false);
        dispatch(fetchTags()); // Refresh tags list
      } else {
        notify(result.error || 'Failed to create tag', 'error', 3000);
      }
    } catch (error) {
      notify('Error creating tag', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssignments = async () => {
    try {
      setLoading(true);

      // Get tags to assign (newly selected)
      const tagsToAssign = selectedTags.filter(tagId =>
        !currentTags.some(currentTag => currentTag.id === tagId)
      );

      // Get tags to unassign (previously selected but now deselected)
      const tagsToUnassign = currentTags
        .filter(currentTag => !selectedTags.includes(currentTag.id))
        .map(tag => tag.id);

      // Assign new tags
      for (const tagId of tagsToAssign) {
        const result = await dispatch(assignTagToVehicle({
          tagId: tagId,
          vehicleId: vehicleId
        }));

        if (!result.success) {
          throw new Error(`Failed to assign tag ${tagId}`);
        }
      }

      // Unassign removed tags
      for (const tagId of tagsToUnassign) {
        const result = await dispatch(assignTagToVehicle({
          tagId: tagId,
          vehicleId: null // Unassign by setting vehicleId to null
        }));

        if (!result.success) {
          throw new Error(`Failed to unassign tag ${tagId}`);
        }
      }

      notify('Tag assignments updated successfully', 'success', 3000);
      onSave();
    } catch (error) {
      notify(error.message || 'Failed to update tag assignments', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const renderTagRow = (cellData) => {
    const tag = cellData.data;
    const isSelected = selectedTags.includes(tag.id);

    return (
      <div className="tw-flex tw-items-center tw-justify-between tw-p-2">
        <div className="tw-flex tw-items-center">
          <CheckBox
            value={isSelected}
            onValueChanged={(e) => handleTagSelection(tag.id, e.value)}
          />
          <div className="tw-ml-3">
            <div className="tw-font-medium">{tag.tagId}</div>
            <div className="tw-text-sm tw-text-gray-500">{tag.tagType}</div>
          </div>
        </div>
        <div className="tw-text-sm tw-text-gray-500">
          {tag.vehicleId === vehicleId ? 'Currently Assigned' : 'Available'}
        </div>
      </div>
    );
  };

  return (
    <div className="tw-p-6">
      <div className="tw-mb-6">
        <h4 className="tw-text-lg tw-font-medium tw-mb-4">
          <i className="fa-light fa-tags tw-mr-2"></i>
          Assign Tags to Vehicle
        </h4>

        {/* New Tag Form */}
        <div className="tw-mb-4">
          <Button
            text={showNewTagForm ? "Cancel New Tag" : "Create New Tag"}
            icon={showNewTagForm ? "fa-light fa-times" : "fa-light fa-plus"}
            stylingMode="outlined"
            onClick={() => setShowNewTagForm(!showNewTagForm)}
            className="tw-mb-3"
          />

          {showNewTagForm && (
            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <div className="tw-mb-3">
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                  New Tag ID
                </label>
                <TextBox
                  value={newTagId}
                  onValueChanged={(e) => setNewTagId(e.value)}
                  placeholder="Enter tag ID (e.g., RFID001)"
                  width="100%"
                />
              </div>
              <Button
                text="Create Tag"
                icon="fa-light fa-save"
                type="success"
                onClick={handleCreateNewTag}
                disabled={loading || !newTagId.trim()}
              />
            </div>
          )}
        </div>

        {/* Available Tags List */}
        <div className="tw-border tw-rounded-lg tw-bg-white tw-max-h-96 tw-overflow-y-auto">
          <div className="tw-p-4 tw-border-b tw-bg-gray-50">
            <h5 className="tw-font-medium tw-mb-0">Available Tags</h5>
            <p className="tw-text-sm tw-text-gray-600 tw-mb-0">
              Select tags to assign to this vehicle
            </p>
          </div>

          {availableTags.length > 0 ? (
            <div className="tw-divide-y tw-divide-gray-200">
              {availableTags.map(tag => (
                <div key={tag.id}>
                  {renderTagRow({ data: tag })}
                </div>
              ))}
            </div>
          ) : (
            <div className="tw-p-4 tw-text-center tw-text-gray-500">
              No available tags found
            </div>
          )}
        </div>

        {/* Selected Tags Summary */}
        {selectedTags.length > 0 && (
          <div className="tw-mt-4 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
            <h6 className="tw-font-medium tw-text-blue-800 tw-mb-2">
              Selected Tags ({selectedTags.length})
            </h6>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {selectedTags.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return (
                  <span
                    key={tagId}
                    className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium tw-bg-blue-100 tw-text-blue-800"
                  >
                    {tag?.tagId || tagId}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-4 tw-border-t">
        <Button
          text="Cancel"
          icon="fa-light fa-times"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          text="Save Assignments"
          icon="fa-light fa-save"
          type="success"
          stylingMode="contained"
          onClick={handleSaveAssignments}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default TagAssignmentPopup;
