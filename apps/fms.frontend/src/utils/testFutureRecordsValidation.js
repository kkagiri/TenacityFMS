// Test script for future records validation
// This file can be used to test the API call format

import tankStockFutureRecordsService from '../services/tankStockFutureRecordsService';

/**
 * Test function to verify the API call format
 */
export const testValidation = async () => {
  const testData = {
    tankId: 2,
    entryDate: "2025-07-09T12:14:07.083Z",
    entryType: "OpeningStock"
  };

  console.log('Testing validation with data:', testData);
  console.log('Valid entry types:', tankStockFutureRecordsService.VolumeChangeReasons);
  console.log('Numeric enum mapping:', tankStockFutureRecordsService.VolumeChangeReasonNumbers);
  console.log('Is valid entry type:', tankStockFutureRecordsService.prototype.isValidEntryType(testData.entryType));
  console.log('Numeric value for OpeningStock:', tankStockFutureRecordsService.prototype.getEnumNumericValue(testData.entryType));

  try {
    const result = await tankStockFutureRecordsService.validateHistoricalEntry(testData);
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

// For testing in browser console:
// import('./utils/testFutureRecordsValidation.js').then(module => module.testValidation());
