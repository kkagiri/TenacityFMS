import React from "react";
import PropTypes from "prop-types";
import "./tagDetails.scss";

const TagDetails = ({ tagId }) => {
  // Fetch tag details based on tagId (this could be a useEffect hook if fetching from an API)
  // For now, we'll assume tag details are passed as props or fetched elsewhere

  return (
    <div className="tag-details">
      <h3>Tag Details</h3>
      <p>ID: {tagId}</p>
      {/* Add more tag details here */}
    </div>
  );
};

TagDetails.propTypes = {
  tagId: PropTypes.string.isRequired,
};

export default TagDetails;
