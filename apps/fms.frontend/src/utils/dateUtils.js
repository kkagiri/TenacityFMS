export const formatDate = (cellInfo) => {
  if (!cellInfo.value) return '';
  
  // Assuming the date is in format "YYYY-MM-DDTHH:mm:ss"
  const [datePart] = cellInfo.value.split('T');
  
  if (!datePart) {
    console.error('Unable to parse date:', cellInfo.value);
    return cellInfo.value;
  }
  
  return datePart; // This will return "YYYY-MM-DD"
};