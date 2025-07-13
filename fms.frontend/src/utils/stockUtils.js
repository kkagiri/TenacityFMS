// Utility functions for stock management operations

export const prepareOpeningClosingStockParams = (formData) => {
  return {
    tankId: formData.tankId,
    amount: formData.amount,
    date: formData.date || new Date(),
    siteId: formData.siteId
  };
};

export const prepareDeliveryDTO = (formData) => {
  return {
    tankId: formData.tankId,
    amount: formData.amount,
    date: formData.date || new Date(),
    siteId: formData.siteId,
    supplierId: formData.supplierId,
    referenceNumber: formData.referenceNumber || '',
    notes: formData.notes || ''
  };
};

export const prepareTankTransferDTO = (formData) => {
  return {
    fromTankId: formData.fromTankId,
    toTankId: formData.toTankId,
    amount: formData.amount,
    date: formData.date || new Date(),
    siteId: formData.siteId,
    notes: formData.notes || ''
  };
};
