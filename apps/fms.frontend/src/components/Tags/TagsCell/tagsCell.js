import React from 'react';
import DataGrid, { Column } from 'devextreme-react/data-grid';
// If you're using a UI library like Material-UI for tags, import the Tag/Chip component
// import Chip from '@mui/material/Chip';

const TagsCell = ({ data }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {data.tags && data.tags.length > 0 ? (
        data.tags.map((tag, index) => (
          // Using styled <span> elements for tags
          <span
            key={index}
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              margin: '2px',
              backgroundColor: '#e0e0e0',
              borderRadius: '12px',
              fontSize: '12px',
              cursor: 'default', // Change to 'pointer' if tags are clickable
            }}
            // If tags are clickable, add onClick handler
            // onClick={() => handleTagClick(tag)}
          >
            {tag.name} {/* Adjust based on your tag object structure */}
          </span>


        ))
      ) : (
        <span>No Tags</span>
      )}
    </div>
  );
};



export default TagsCell;
