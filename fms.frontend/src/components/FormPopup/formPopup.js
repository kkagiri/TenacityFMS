import './formPopup.scss';
import React, { useCallback, useRef, PropsWithChildren } from 'react';

import { Popup, ToolbarItem } from 'devextreme-react/popup';
import ValidationGroup from 'devextreme-react/validation-group';
import { useScreenSize } from '../../utils/media-query';
import { Button } from 'devextreme-react';

import ScrollView from 'devextreme-react/scroll-view';


const FormPopup = ({
    title,
    visible,
    width = 600,
    height = 'auto',
    onSave,
    setVisible,
    wrapperAttr = { class: '' },
    isSaveDisabled = false,
    children
  }) => {
    const { isXSmall } = useScreenSize();
    const validationGroup = useRef(null);

    const close = () => {
        validationGroup.current?.instance.reset();
        setVisible(false);
      };
      const onCancelClick = useCallback(() => {
        close();
      }, []);

      const onSaveClick = useCallback(() => {
        if (!validationGroup.current?.instance.validate().isValid) return;
    
        if (onSave) {
          onSave();
        }
        close();
      }, [onSave]);

return (

    <Popup
    title={title}
    visible={visible}
    fullScreen={isXSmall}
    width={width}
    wrapperAttr={{ ...wrapperAttr, class: `${wrapperAttr?.class} form-popup` }}
    height={height}
  >
     

    <ToolbarItem
        toolbar='bottom'
        location='center'
      >
        <div className={`form-popup-buttons-container ${width <= 200 ? 'flex-buttons' : ''}`}>
         
          
           <Button
            text='Cancel'
            stylingMode='outlined'
            type='normal'
            onClick={onCancelClick}
            style={{ marginRight: '10px' }} // Apply margin directly

          />
          <Button
            text='Save'
            stylingMode='contained'
            type='default'
            disabled={isSaveDisabled}
            onClick={onSaveClick}
          />
        </div>
      </ToolbarItem>
      <ScrollView direction='vertical'  showScrollbar="always"  scrollByContent={true}  >

      <ValidationGroup ref={validationGroup}>
        {children}
      </ValidationGroup>
      </ScrollView>

    </Popup>
    );
};

export default FormPopup;