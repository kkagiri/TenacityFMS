import axiosInstance from "../api/axiosInstance";

import CustomStore from "devextreme/data/custom_store";


// Get vehicle dashboard metrics
export const getVehicleDashboardMetrics = async () => {
  try {
    const response = await axiosInstance.get(`/vehicle/getdashboardmetrics`);
    return response.data;
  } catch (error) {
    console.error('Error loading vehicle dashboard metrics:', error);
    // Return mock data if API fails
    return {
      totalVehicles: 0,
      activeVehicles: 0,
      maintenanceCount: 0,
      fuelAlerts: 0
    };
  }
};

export const getVehicleList = async () => {
  try {
    const response = await axiosInstance.get(`/vehicle/getlist`);
    return response.data;
  } catch (error) {
    console.error('Error loading vehicle data:', error);
    throw new Error('Data loading error');
  }
};

export const updateVehicle = async (key, values) => {
  try {
    // Retrieve the original data
    const originalData = await getVehicleByKey(key);
    const updatedData = { ...originalData, ...values, vehicleId: key };

    // Update the data
    const updateResponse = await axiosInstance.get(`/vehicle/UpdateVehicle/${key}`, updatedData);
    return updateResponse.data;
  } catch (error) {
    console.error('Error updating vehicle data:', error);
    throw new Error('Data updating error');
  }
};

export const getVehicleByKey = async (key) => {
  try {
    const response = await axiosInstance.get(`/vehicle/getvehiclebyid`, {
      params: { id: key }
    });
return  response.data;
  } catch (error) {
    console.error('Error fetching vehicle by key:', error);
    throw new Error('Error in byKey operation');
  }
};

export const getVehicleDataSource = () => {
  return new CustomStore({
    key: 'vehicleId',
    load: getVehicleList,
    update: updateVehicle,
    byKey: getVehicleByKey
  });
};



export const getManufacturers = async () => {
  try {
    const response =await axiosInstance.get(`/VehicleManufacturer/getlist`);
    return response.data;
  } catch (error) {
    console.error('Error loading manufacturers data:', error);
    throw new Error('Data loading error');
  }
};

// Fetch vehicle models data
export const getVehicleModels = async () => {
  try {
    const response = await axiosInstance.get(`/VehicleModel/getlist`);
    return response.data;
  } catch (error) {
    console.error('Error loading vehicle models data:', error);
    throw new Error('Data loading error');
  }
};

export const getVehicleModelByVehicleManfuacturerId = async (manufacturerId) => {
  try {
    const response = await axiosInstance.get(`/VehicleModel/GetVehicleModelsByManufacturerId`, {
      params: { manufacturerId: manufacturerId }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading vehicle models data:', error);
    throw new Error('Data loading error');
  }
}

// Fetch expected average data
export const getExpectedAvg = async () => {
  try {
    const response = await axiosInstance.get(`/expectedavg/getlist`);
    return response.data;
  } catch (error) {
    console.error('Error loading expected average data:', error);
    throw new Error('Data loading error');
  }
};


//get expectded Average by SiteiD and Vehicle ID
export const getExpectedAvgBySiteIdAndVehicleId = async (vehicleId,siteId) => {
  try {

      const response = await axiosInstance.get(`/expectedavg/getlistbyvehiclebysite`, {
        params: {vehicleid: vehicleId, siteid: siteId }
      });
      return response.data;
  }
  catch (error) {
    console.error('Error loading expected average data:', error);
    throw new Error('Data loading error');
  }
};



export const getSiteList = async () => {
  try {
    const response = await axiosInstance.get(`/site/getlist`);
    return response.data;
  } catch (error) {
    console.error('Error loading site data:', error);
    throw new Error('Data loading error');
  }
};

export const getSitebyUserID = async () => {
  try{
      const response = await axiosInstance.get(`/site/getsitebyuserid`);
      return response.data;
    }
    catch (error) {
      console.error('Error loading site data:', error);
      throw new Error('Data loading error');
    }
  };



//Fetch Employees

export const getEmployeeList = async () => {
  try {
    const response = await axiosInstance.get(`/employee/getlist`);
    return response.data;
  } catch (error) {
    console.error('Error loading employee data:', error);
    throw new Error('Data loading error');
  }
}



//get Employee by Site ID
export const getEmployeeBySite = async (siteID) => {
  try {
    const response = await axiosInstance.get(`/employee/getemployeebysiteid`, {
      params: { siteid: siteID }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading employee data:', error);
    throw new Error('Data loading error');
  }
}






// Fetch vehicle type data
  export const getVehicleTypeList = async () => {
    try {
      const response = await axiosInstance.get(`/vehicleType/getlist`);
      return response.data;
    } catch (error) {
      console.error('Error loading vehicle type data:', error);
      throw new Error('Data loading error');
    }
  }


  export const getConsumptionById = async (id) => {
    try {
      const response = await axiosInstance.get(`/consumption/getbyid`, {
         params: { id: id }
      });
      return response.data;
    } catch (error) {
      console.error('Error loading consumption data by ID:', error);
      throw new Error('Data loading error');
    }
  };

  export const getConsumptionHistoryByVehicle = async (vehicleId, datestring,entry) => {
    try {
      console.log("Types:", typeof vehicleId.vehicleId, typeof vehicleId.startDate, typeof entry); // Check types
      console.log("fetching history data",vehicleId,datestring,entry);



      const formattedDate = new Date(vehicleId.startDate).toISOString().split('T')[0]; // Format the date
      const response = await await axiosInstance.get(`/consumption/gethistoryconsumptionbyvehicle?vehicleId=${vehicleId.vehicleId}&datestring=${formattedDate}&entry=${entry}`);
      return response.data;
    } catch (error) {
      console.error('Dataservice : Error loading consumption history data:', error);
      throw new Error('Data loading error');
    }
  };


    export const getConsumptionList = async(pagingNo) => {
      try {
        const response = await axiosInstance.get(`/consumption/getlist?pagingNo=${pagingNo}`);
                return response.data;
      } catch (error) {
        console.error('Error loading consumption data:', error);
        throw new Error('Data loading error');
      }
    };
