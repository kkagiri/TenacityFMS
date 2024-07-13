import React, { useState, useEffect, useRef } from 'react';
import DataGrid, { Column, Paging, Export, FilterRow, Sorting, ColumnChooser, ColumnFixing, Editing, Popup, Lookup } from 'devextreme-react/data-grid';
import axios from "axios";
import CustomStore from 'devextreme/data/custom_store';
import { HeaderFilter } from 'devextreme-react/pivot-grid-field-chooser';
import sampleData from '../../dataservice/sampleconsumptiondata';
import DateBox from 'devextreme-react/date-box';
import Button from 'devextreme-react/button';
import LoadPanel from 'devextreme-react/load-panel';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import './vehicleConsumption.scss';
import { VehicleConsumptionGridList } from '../../components';
import ScrollView from 'devextreme-react/scroll-view';
import { getConsumptionList } from '../../dataservice';
import { NumberBox } from 'devextreme-react/number-box';



const apiUrl = process.env.REACT_APP_FMS_API_URL;
const VehicleConsumptionList = () => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagingNo, setPagingNo] = useState(100); // Set the initial paging size to 100
    const gridRef = useRef(null);


    const handlePagingNoChange = (e) => {
      setPagingNo(e.value);
      //set consumptiondata to be empty

    };

  const fetchData = async (pagingNo) => {
    setLoading(true);
    const consumptionData = await getConsumptionList(pagingNo);
    setConsumptionData(consumptionData);
    setLoading(false);
   // setConsumptionData(sampleData);
    //console.log("sample data", consumptionData);
  };

  useEffect(() => {
    fetchData(pagingNo);
  }, [pagingNo]);

  return (
    <React.Fragment>
      <ScrollView className='view-wrapper-scroll'>
      <div className='view-wrapper view-wrapper-list'>
      <Toolbar className='toolbar-common theme-dependent'>
          <Item location='before'>
            <span className='toolbar-header'>Vehicle Consumption</span>
          </Item>
          <Item location='after'>
            <div className='date-container'>
           
              <span className='label'>Generate data From GPSGate</span>
              <DateBox
                className='date-box'
                width={200}
                defaultValue="select date"
                value={selectedDate}
                onValueChanged={e => setSelectedDate(e.value)}
                displayFormat="dd-MM-yyyy"
                type="date"
              />

              <span className='label'>View historical data</span>
              <DateBox
                className='date-box'
                width={200}
                defaultValue="select date"
                value={selectedDate}
                onValueChanged={e => setSelectedDate(e.value)}
                displayFormat="dd-MM-yyyy"
                type="date"
              />
            </div>
          </Item>
          <Item location='after'>
    {/* ... */}
    <span>Paging Size:</span>
    <NumberBox
      value={pagingNo}
      onValueChanged={handlePagingNoChange}
      min= {5}
      step={50}
    />
  </Item>
        </Toolbar>


        <LoadPanel container='.content' showPane={false} visible={loading} position={{ of: '.content' }} />
        <div className='content content-block'>
<VehicleConsumptionGridList dataSource={consumptionData} pagingNo={pagingNo} />        </div>
      </div>
      </ScrollView>
      </React.Fragment>  );
};

export default VehicleConsumptionList;
