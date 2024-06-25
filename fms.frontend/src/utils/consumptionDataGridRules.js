const consumptionDataGridRules = [
    {
      condition: (rowData) => rowData.fuelLost > 0,
      rowClassName: 'highlight-red',
    },
    {
      condition: (rowData) => rowData.engineHours > 10,
      rowClassName: 'highlight-red',
    },
    {
      condition: (rowData) => rowData.isKmPerLiter && rowData.distance === 0 && rowData.fuelUsed > 0,
      rowClassName: 'highlight-yellow',
    },
    {
      condition: (rowData) => !rowData.isKmPerLiter && rowData.engineHours === 0 && rowData.fuelUsed > 0,
      rowClassName: 'highlight-yellow',
    },
    {
      condition: (rowData) => rowData.isKmPerLiter && rowData.distance > 10 && rowData.fuelUsed === 0,
      rowClassName: 'highlight-blue',
    },
    {
      condition: (rowData) => !rowData.isKmPerLiter && rowData.engineHours > 0.5 && rowData.fuelUsed === 0,
      rowClassName: 'highlight-blue',
    },
  ];
  
  export default consumptionDataGridRules;