import React, { useMemo,useCallback } from 'react';
import TagBox from 'devextreme-react/tag-box';
import { useSelector } from 'react-redux';

const EmployeevehicleTagbox = (props) => {
    const { value, onValueChanged } = props;
    const vehicles = useSelector(state => state.vehicle.vehicles);

    const vehicleValues = useMemo(() => {
        return Array.isArray(value) ? value : [];
    }, [value]);


    const handleValueChanged = useCallback((e) => {
        console.log("New value:", e.value);
        onValueChanged(e.value);
    }, [onValueChanged]);
  
        return (
            <TagBox
            dataSource={vehicles}
            value={vehicleValues}
            valueExpr="vehicleId"
            displayExpr="hyoungNo"
            showSelectionControls={true}
            maxDisplayedTags={5}
            applyValueMode="useButtons"
            searchEnabled={true}
            onValueChanged={handleValueChanged}
            acceptCustomValue={false}
            showClearButton={true}
            searchExpr={["hyoungNo", "vehicleId"]}         />
        );
    }


export default EmployeevehicleTagbox;
