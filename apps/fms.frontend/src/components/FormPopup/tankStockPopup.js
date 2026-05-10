import { Popup } from 'devextreme-react/popup';

const TankStockFormPopup = ({ visible, onHiding, title, children }) => {
  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={false}
      showCloseButton={true}
      showTitle={true}
      title={title}
      width="90%"
      height="90%"
      maxWidth="800px"
      maxHeight="600px"
      resizeEnabled={true}
    >
      <ScrollView className="popup-content">
        {children}
      </ScrollView>
    </Popup>
  );
};

export default TankStockFormPopup;