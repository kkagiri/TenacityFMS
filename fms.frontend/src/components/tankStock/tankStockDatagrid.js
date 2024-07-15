// Code Created by Kevin Kagiri 
// Date Created: 15th July 2024
//Code for showing tank Stock Activity from Tank stock Page or tankStockPage.js
import React from 'react';
import { DataGrid, Column, SearchPanel } from 'devextreme-react/data-grid';


const TankStockDatagrid = ({ tankStocks, selectedTankStocks, handleSelectionChanged }) => {
