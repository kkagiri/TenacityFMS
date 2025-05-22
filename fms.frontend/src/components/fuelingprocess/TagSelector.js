import React, { useState } from "react";
import { SelectBox } from "devextreme-react/select-box";
import LoadIndicator from "devextreme-react/load-indicator";
import { Button } from "devextreme-react/button";
import "./fuelingprocess.scss";

//Cursor
const TagSelector = ({
  vehicleTags = [],
  isLoading = false,
  onTagSelected = () => {},
}) => {
  const [selectedTagId, setSelectedTagId] = useState(null);

  // When a tag is selected from the dropdown
  const handleTagChange = (e) => {
    setSelectedTagId(e.value);
  };

  // When the confirm button is clicked
  const handleConfirm = () => {
    if (selectedTagId) {
      const selectedTag = vehicleTags.find((tag) => tag.id === selectedTagId);
      if (selectedTag) {
        onTagSelected(selectedTag);
      }
    }
  };

  return (
    <div className="tag-selection">
      <div className="tag-header">
        <i className="fa-solid fa-tag"></i>
        <h5>Select Vehicle Tag</h5>
      </div>

      {vehicleTags.length > 0 ? (
        <>
          <div className="dx-field">
            <SelectBox
              dataSource={vehicleTags}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select a tag"
              onValueChanged={handleTagChange}
              disabled={isLoading}
              showClearButton={true}
              searchEnabled={true}
            />
            {isLoading && <LoadIndicator width={24} height={24} />}
          </div>

          <div className="dx-field">
            <Button
              text="Use Selected Tag"
              type="default"
              stylingMode="contained"
              onClick={handleConfirm}
              disabled={!selectedTagId || isLoading}
              width="100%"
            />
          </div>
        </>
      ) : (
        <div className="no-tags-message">
          <p>No tags found for this vehicle</p>
        </div>
      )}
    </div>
  );
};

export default TagSelector;
