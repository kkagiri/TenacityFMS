import React, { useEffect, useMemo } from 'react';
import TagBox from 'devextreme-react/tag-box';
import { useSelector,useDispatch } from 'react-redux';
import {fetchVehicleList } from "../../actions/vehicleActions";

const EmployeevehicleTagbox = (props) => {
    const { data, value, onValueChanged } = props;
    const vehicles = useSelector(state => state.vehicle.vehicles);

    const vehicleValues = useMemo(() => {
        if (!value) return [];
        return Array.isArray(value) ? value : [];
    }, [value]);

    const handleValueChanged = (e) => {
        console.log("New value:", e.value);
        onValueChanged(e.value);
    };
  
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
            searchExpr={["hyoungNo", "vehicleId"]}         />
        );
    }


export default EmployeevehicleTagbox;
