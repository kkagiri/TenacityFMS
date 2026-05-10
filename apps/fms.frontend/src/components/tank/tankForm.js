//Tank Form

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Form  from 'devextreme-react/form';

import { createTank, updateTank,deleteTank } from '../../actions/tankActions';

const TankForm = () => {
    const dispatch = useDispatch();
    const selectedTank = useSelector((state) => state.tank.selectedTank);
    const [tank, setTank] = useState(selectedTank);
    
    useEffect(() => {
        setTank(selectedTank);
    }, [selectedTank]);
    
    const handleFieldChange = (e) => {
        const { name, value } = e.event.target;
        setTank({ ...tank, [name]: value });
    };
    
    const handleSave = () => {
        if (tank.id) {
        dispatch(updateTank(tank));
        } else {
        dispatch(createTank(tank));
        }
    };
    
    const handleDelete = () => {
        dispatch(deleteTank(tank));
    };
    
    return (
        <div>
        <Form formData={tank} onFieldDataChanged={handleFieldChange}>
            <Item dataField="tankName" />
            <Item dataField="tankCapacity" />
            <Item dataField="tankLocation" />
            <Item dataField="tankFuelLevel" />
            <Item dataField="tankStatus" />
        </Form>
        <Button text="Save" onClick={handleSave} />
        <Button text="Delete" onClick={handleDelete} />
        </div>
    );
    }