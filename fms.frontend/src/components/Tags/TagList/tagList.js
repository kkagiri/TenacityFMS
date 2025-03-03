import React from 'react';
import PropTypes from 'prop-types';
import './tagList.scss';

const TagList = ({ tags, onTagSelect }) => {
    return (
        <div className='tag-list'>
            {tags.map((tag) => (
                <div
                    key={tag.id}
                    className='tag-item'
                    onClick={() => onTagSelect(tag)}
                >
                    {tag.name}
                </div>
            ))}
        </div>
    );
};

TagList.propTypes = {
    tags: PropTypes.array.isRequired,
    onTagSelect: PropTypes.func.isRequired,
};

export default TagList;
