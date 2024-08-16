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

  export const prepareDeliveryDTO = (formData) => ({
    tankId: formData.tankId,
    amount: formData.amount,
    deliveryDate: formData.date,
    supplierId: formData.supplierId,
    deliveryTemperature: formData.deliveryTemperature,
    deliveryDensity: formData.deliveryDensity,
    lpoNumber: formData.lpoNumber,
    product: formData.product,
    stockBeforeDelivery: formData.stockBeforeDelivery,
    stockAfterDelivery: formData.stockAfterDelivery,
    manualDeliveryAmount: formData.manualDeliveryAmount,
    sensorDeliveryAmount: formData.sensorDeliveryAmount

    });


    export const prepareTankTransferDTO = (formData) => ({
        sourceTankId: formData.sourceTankId,
        destinationTankId: formData.destinationTankId,
        amount: formData.amount,
        transferDate: formData.date
    });

 