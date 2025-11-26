import React, { useState } from 'react';
import { Popup } from 'devextreme-react/popup';
import { ScrollView } from 'devextreme-react/scroll-view';
import './HelpPopup.scss';

/**
 * Reusable Help Popup Component
 * Displays help documentation in a popup when user clicks help icon
 *
 * @param {string} title - Help popup title
 * @param {React.ReactNode} children - Help content (can be JSX, text, or markdown)
 * @param {string} iconPosition - Position of help icon: 'inline' or 'floating' (default: 'inline')
 * @param {string} iconClass - Additional CSS classes for the icon
 */
const HelpPopup = ({
  title = "Help",
  children,
  iconPosition = "inline",
  iconClass = ""
}) => {
  const [visible, setVisible] = useState(false);

  const showHelp = () => setVisible(true);
  const hideHelp = () => setVisible(false);

  return (
    <>
      {/* Help Icon Button */}
      {iconPosition === 'floating' ? (
        <button
          onClick={showHelp}
          className={`help-popup-icon-floating ${iconClass}`}
          title="Show Help"
          aria-label="Show Help"
        >
          <i className="fa-light fa-circle-question"></i>
        </button>
      ) : (
        <button
          onClick={showHelp}
          className={`help-popup-icon-inline ${iconClass}`}
          title="Show Help"
          aria-label="Show Help"
        >
          <i className="fa-light fa-circle-question tw-text-blue-600"></i>
          <span className="tw-ml-1 tw-text-sm tw-text-blue-600 tw-font-medium">Help</span>
        </button>
      )}

      {/* Help Popup */}
      <Popup
        visible={visible}
        onHiding={hideHelp}
        dragEnabled={true}
        closeOnOutsideClick={true}
        showTitle={true}
        title={title}
        width={700}
        height="80vh"
        position={{ my: 'center', at: 'center', of: window }}
        showCloseButton={true}
        titleRender={() => (
          <div className="tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-circle-info tw-text-blue-600"></i>
            <span>{title}</span>
          </div>
        )}
      >
        <ScrollView width="100%" height="100%">
          <div className="help-popup-content">
            {children}
          </div>
        </ScrollView>
      </Popup>
    </>
  );
};

export default HelpPopup;
