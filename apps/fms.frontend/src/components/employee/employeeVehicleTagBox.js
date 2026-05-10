import React, { useMemo,useCallback,useEffect } from 'react';
import TagBox from 'devextreme-react/tag-box';
import { useSelector } from 'react-redux';




const EmployeevehicleTagbox = (props) => {
    const { value, onValueChanged } = props;
    const vehicles = useSelector(state => state.vehicle.vehicles);
    const vehicleValues = useMemo(() => {
        const result = Array.isArray(value) ? value : [];
        return result;
    }, [value]);



    const handleValueChanged = useCallback((e) => {
        onValueChanged(e.value);
    }, [onValueChanged,value]);
  
        return (
            <TagBox
            dataSource={vehicles}
            value={vehicleValues}
            valueExpr="vehicleId"
            displayExpr="vehicleCode"
            showSelectionControls={true}
            maxDisplayedTags={5}
            applyValueMode="useButtons"
            searchEnabled={true}
            onValueChanged={handleValueChanged}
            acceptCustomValue={false}
            showClearButton={true}
            searchExpr={["vehicleCode", "vehicleId"]}  
           
            />
        );
    }


export default EmployeevehicleTagbox;
