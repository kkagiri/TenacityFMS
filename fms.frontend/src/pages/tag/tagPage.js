import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Item, Toolbar } from 'devextreme-react/toolbar';
import Button from 'devextreme-react/button';
import { fetchTags, setSelectedTag } from '../../redux/actions/tagActions';
import TagList from '../../components/Tags/TagList/tagList';
import { ScrollView } from 'devextreme-react';
//import TagDetails from '../../components/Tags/TagDetails/';
import './tagpage.scss';

const Tagpage = () => {
    const dispatch = useDispatch();
    const tags = useSelector((state) => state.tag.tags);
    const selectedTag = useSelector((state) => state.tag.selectedTag);

    useEffect(() => {
        dispatch(fetchTags());
    }, [dispatch]);

    const handleTagSelection = (tag) => {
        dispatch(setSelectedTag(tag));
    };

    return (
         <ScrollView className='content-block'>
            <div className='view-wrapper view-wrapper-tag-page'>
                <div className='view-container'>
                    <Toolbar className='toolbar-details theme-dependent'>
                        <Item location='before'>
                        <span className='toolbar-header' style={{paddingLeft:'10px'}}>Vehicle Tag Management</span>
                        </Item>
                        <Item location='after' locateInMenu='auto'>
                            <Button
                                text='Add Tag'
                                type='default'
                                stylingMode='contained'
                                onClick={() => {/* Handle add tag */}}
                            />
                        </Item>
                        <Item
                            location='after'
                            locateInMenu='auto'
                            widget='dxButton'
                            showText='inMenu'
                        >
                            <Button
                                text="Refresh"
                                icon="refresh"
                                stylingMode="text"
                                onClick={() => dispatch(fetchTags())}
                            />
                        </Item>
                    </Toolbar>
                </div>
                <div className='content content-block'>
                    <div className='panels'>
                        <div className='left'>
                            <TagList tags={tags} onTagSelect={handleTagSelection} />
                        </div>
                        <div className='right'>
                        </div>
                    </div>
                </div>
                <div className='content content-block'>
                    <div className='panels'>

                    </div>
                </div>
            </div>



        </ScrollView>
    );
};

export default Tagpage;