export const prepareOpeningClosingStockParams = (formData) => ({
    tankId: formData.tankId,
    amount: formData.amount,
    date: formData.date
});

export const prepareOpeningStockDTO = (formData) => ({
    tankId: formData.tankId,
    amount: formData.amount,
    date: formData.date
});

// Updated to match DeliveryDTO structure from backend
export const prepareDeliveryDTO = (formData) => ({
    tankId: formData.tankId,
    deliveryDate: formData.deliveryDate,
    manualDeliveryAmount: formData.deliveryAmount, // Frontend uses deliveryAmount, backend expects manualDeliveryAmount
    sensorDeliveryAmount: formData.sensorDeliveryAmount || null,
    deliveryTemperature: formData.deliveryTemperature || null,
    deliveryDensity: formData.deliveryDensity || null,
    deliveryMass: formData.deliveryMass || null,
    stockBeforeDelivery: formData.stockBeforeDelivery,
    stockAfterDelivery: formData.stockAfterDelivery,
    pricePerLiter: formData.pricePerLiter || 0,
    supplierId: formData.supplierId,
    lponumber: formData.invoiceNumber, // Frontend uses invoiceNumber, backend expects lponumber
    product: formData.product,
    // Note: RecordedBy will be set by the controller from JWT token
});

// Updated to match TankTransferDTO structure from backend
export const prepareTankTransferDTO = (formData) => ({
    sourceTankId: formData.sourceTankId,
    destinationTankId: formData.destinationTankId,
    amount: formData.amount,
    date: formData.date,
    transferType: formData.transferType || 'InterTank', // Default to InterTank
    reason: formData.reason || '',
    // Note: RecordedBy will be set by the controller from JWT token
});

