import React from 'react';
import { DropDownButton  } from 'devextreme-react/drop-down-button';
import './carMenu.scss';

export const CardMenu = ({ items, visible=true }) => {
    return (
        <DropDownButton 
         className='overflow-menu'
            items={items}
            visible={visible}
            icon='overflow'
            stylingMode='text'
            showArrowIcon={false}
            dropDownOptions={{ width: 'auto' }}
            />
          
    );

};