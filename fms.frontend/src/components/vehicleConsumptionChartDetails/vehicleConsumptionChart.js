//07/05 
//This component is responsible for displaying the vehicle consumption chart details.
//ToDo: Fix issue with RangeSelector not filtering data correctly

import React, { useEffect, useState } from "react";
import { Chart, Series, ArgumentAxis, ValueAxis, Tooltip, Legend, CommonAxisSettings, Crosshair, Label, VerticalLine ,HorizontalLine } from "devextreme-react/chart";
import TagBox from "devextreme-react/tag-box";
import RangeSelector ,{Behavior, Scale,TickInterval} from 'devextreme-react/range-selector';

import gpsgateApiService from "../../dataservice/gpsgateApiService";

export const VehicleConsumptionChartDetail = ({ vehicleId, date }) => {
    const [selectedVariables, setSelectedVariables] = useState([]);
    const [variableData, setVariableData] = useState([]);
    const [visualRange, setVisualRange] = useState({});

    useEffect(() => {
   
        const fetchData = async () => {
            if(vehicleId && date) { // Ensure vehicleId and date are present and no data has been loaded yet
                try {
                    await gpsgateApiService.login();
                    const data = await gpsgateApiService.FetchTrackData(vehicleId, date);
                    if (data && data.length > 0) {
                        setVariableData(data.map(d => ({
                            ...d.variables,
                            time: new Date(d.utc).toLocaleString()
                        })));
                    } else {
                        setVariableData([]);
                    }
                } catch (error) {
                    console.error("Error fetching data", error);
                }
            }
        };
    console.log("variableData", variableData);
        fetchData();
    }, [vehicleId, date]);
    

    const variableNames = variableData.length > 0
        ? Object.keys(variableData[0]).filter(key => key !== 'time').map(key => ({ value: key, label: key }))
        : [];

     const handleVariableSelection = (event) => {
         if (JSON.stringify(event.value) !== JSON.stringify(selectedVariables)) {
               setSelectedVariables(event.value);
            }
        };
        const onRangeChange = (e) => {
            setVisualRange(e.value);
        };

        const filteredChartData = variableData.filter(data => {
            const time = new Date(data.time).getTime();
            return (!visualRange.startValue || time >= visualRange.startValue) &&
                   (!visualRange.endValue || time <= visualRange.endValue);
        }).map(data => ({
            time: data.time,
            ...selectedVariables.reduce((obj, key) => ({ ...obj, [key]: data[key] }), {})
        }));


    return (
        <div>
            <div style={{ padding: '20px', boxSizing: 'border-box' }}>
            <TagBox
                width={500}
                dataSource={variableNames}
                valueExpr="value"
                displayExpr="label"
                value={selectedVariables}
                onValueChanged={handleVariableSelection}
                                showSelectionControls={true}
                applyValueMode="instantly"
                placeholder="Select variables"
            />
</div>
<div style={{ padding: '20px' }}>
           
                <Chart dataSource={filteredChartData} height={300}>
                    <ArgumentAxis argumentType="datetime" />
                    <ValueAxis />
                    <Legend />
                    <Tooltip enabled={true} customizeTooltip={arg => ({
                        text: `${arg.seriesName}: ${arg.valueText}`
                    })} />
                    <Crosshair enabled={true}>
                        <HorizontalLine visible={true} />
                        <VerticalLine visible={true}>
                            <Label visible={true} format="longTime" />
                        </VerticalLine>
                    </Crosshair>
                    <CommonAxisSettings endOnTick={false} />
                    {selectedVariables.map(variable => (
                        <Series key={variable} valueField={variable} argumentField="time" name={variable} type="line" />
                    ))}
                </Chart>
           </div>
<div style={{padding:'20px'}} >
            <RangeSelector
                 dataSource={variableData}
                defaultValue={visualRange}
                onValueChanged={onRangeChange}
                dataSourceField="time"
                size={{ height: 100 }}
                margin={{ left: 10 }}
            >
                <Behavior snapToTicks={false} />
                <Scale valueType="datetime"  minorTickInterval={{ minutes: 5 }}>                    <label>
                        <format type="HH:mm:ss" />
                    </label>
                </Scale>
            </RangeSelector>
            </div>
        </div>
    );
};
