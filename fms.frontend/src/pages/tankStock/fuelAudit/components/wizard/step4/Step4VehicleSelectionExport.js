/**
 * Step4VehicleSelectionExport.js
 * Excel export utility for Step 4: Vehicle Selection
 */

import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

// Category configuration
export const CATEGORY_CONFIG = {
  1: {
    name: 'Site GPS Fleet',
    icon: 'fa-satellite',
    color: 'green',
    bgColor: 'tw-bg-green-50',
    borderColor: 'tw-border-green-200',
    textColor: 'tw-text-green-700',
    badgeColor: 'tw-bg-green-100 tw-text-green-800',
    confidence: 'HIGH',
    description: 'Vehicles with GPS + Fuel Sensor. Opening/closing from GPS REST API.'
  },
  2: {
    name: 'Site Full Tank',
    icon: 'fa-gas-pump',
    color: 'yellow',
    bgColor: 'tw-bg-yellow-50',
    borderColor: 'tw-border-yellow-200',
    textColor: 'tw-text-yellow-700',
    badgeColor: 'tw-bg-yellow-100 tw-text-yellow-800',
    confidence: 'MEDIUM',
    description: 'Full tank policy vehicles (incl. GPS without fuel sensor). Opening = Tank Capacity.'
  },
  3: {
    name: 'Site Equipment',
    icon: 'fa-gear',
    color: 'orange',
    bgColor: 'tw-bg-orange-50',
    borderColor: 'tw-border-orange-200',
    textColor: 'tw-text-orange-700',
    badgeColor: 'tw-bg-orange-100 tw-text-orange-800',
    confidence: 'LOW',
    description: 'Equipment without GPS/sensor. Track fuel issued only.'
  },
  4: {
    name: 'Cross-Site Company',
    icon: 'fa-arrow-right-arrow-left',
    color: 'cyan',
    bgColor: 'tw-bg-cyan-50',
    borderColor: 'tw-border-cyan-200',
    textColor: 'tw-text-cyan-700',
    badgeColor: 'tw-bg-cyan-100 tw-text-cyan-800',
    confidence: 'HIGH',
    description: 'Company vehicles from other sites. SOAP Report 212 refuel events.'
  },
  5: {
    name: 'External Non-Company',
    icon: 'fa-user-plus',
    color: 'pink',
    bgColor: 'tw-bg-pink-50',
    borderColor: 'tw-border-pink-200',
    textColor: 'tw-text-pink-700',
    badgeColor: 'tw-bg-pink-100 tw-text-pink-800',
    confidence: 'ACCOUNTED',
    description: 'External/contractor vehicles. Track fuel issued only.'
  }
};

/**
 * Export category to Excel using DataGrid instance
 * @param {Object} gridInstance - DevExtreme DataGrid instance
 * @param {number} categoryId - Category ID
 */
export const exportCategoryFromGrid = async (gridInstance, categoryId) => {
  if (!gridInstance) return;

  const config = CATEGORY_CONFIG[categoryId];
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(config.name);

  await exportDataGrid({
    component: gridInstance,
    worksheet,
    autoFilterEnabled: true,
    customizeCell: ({ gridCell, excelCell }) => {
      // Style header row
      if (gridCell.rowType === 'header') {
        excelCell.font = { bold: true };
        excelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `Vehicles_${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  );
};
