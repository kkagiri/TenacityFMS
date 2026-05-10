import axiosInstance from '../api/axiosInstance';


//Devices
//get device list
export const getDeviceList = async () => {
    try {
        const response = await axiosInstance.get(`/device/getlist`);
        return response.data;
    } catch (error) {
        console.error('Error loading device data:', error);
        throw new Error('Data loading error');
    }
};


//Create Device
export const createDevice = async (device) => {
    try {
        const response = await axiosInstance.post(`/device/`, device);
        return response.data;
    } catch (error) {
        console.error('Error creating device:', error);
        throw new Error('Device creation error');
    }
};


//get device by id
export const getDeviceById = async (id) => {
    try {
        const response = await axiosInstance.get(`/device/`, {
            params: { id: id }
        });
        return response.data;
    }
        catch (error) {
        console.error('Error loading device data:', error);
        throw new Error('Data loading error');
    }
};

//update device
export const updateDevice = async (id, deviceData) => {
    try {
        const response = await axiosInstance.put(`/device/${id}`, deviceData);
        return response.data;
    } catch (error) {
        console.error('Error updating device data:', error);
        throw new Error('Data updating error');
    }
};

//delete device
export const deleteDevice = async (deviceId) => {
    try {
        const response = await axiosInstance.delete(`/device/${deviceId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting device data:', error);
        throw new Error('Data deletion error');
    }
};

//DeviceModel
//get device model list
export const getDeviceModelList = async () => {
    try {
        const response = await axiosInstance.get(`/devicemodel/getlist`);
        return response.data;
    } catch (error) {
        console.error('Error loading device model data:', error);
        throw new Error('Data loading error');
    }
};



//get device model by id
export const getDeviceModelById = async (id) => {
    try {
        const response = await axiosInstance.get(`/devicemodel/`, {
            params: { id: id }
        });
        return response.data;
    } catch (error) {
        console.error('Error loading device model data:', error);
        throw new Error('Data loading error');
    }
};

//update device model
export const updateDeviceModel = async (id, deviceModelData) => {
    try {
        const response = await axiosInstance.put(`/devicemodel/${id}`, deviceModelData);
        return response.data;
    } catch (error) {
        console.error('Error updating device model data:', error);
        throw new Error('Data updating error');
    }
};

//delete device model
export const deleteDeviceModel = async (id) => {
    try {
        const response = await axiosInstance.delete(`/devicemodel/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting device model data:', error);
        throw new Error('Data deletion error');
    }
};

//Create Device Model
export const createDeviceModel = async (deviceModelData) => {
    try {
        if (!deviceModelData.devicemanufacturerId || deviceModelData.devicemanufacturerId <= 0) {
            alert('Please provide a valid devicemanufacturerId before creating a device model.');
            return;
        }
        const response = await axiosInstance.post(`/devicemodel/`, deviceModelData);
        return response.data;
    } catch (error) {
        console.error('Error creating device model data:', error);
        throw new Error('Data creation error');
    }
};

//device type
//get device type list
export const getDeviceTypeList = async () => {
    try {
        const response = await axiosInstance.get(`/devicetype/getlist`);
        return response.data;
    } catch (error) {
        console.error('Error loading device type data:', error);
        throw new Error('Data loading error');
    }
};
//create Device Type
export const createDeviceType = async (deviceTypeData) => {
    try {
        const response = await axiosInstance.post(`/devicetype/`, deviceTypeData);
        return response.data;
    } catch (error) {
        console.error('Error creating device type data:', error);
        throw new Error('Data creation error');
    }
};


//get device type by id
export const getDeviceTypeById = async (id) => {
    try {
        const response = await axiosInstance.get(`/devicetype/`, {
            params: { id: id }
        });
        return response.data;
    } catch (error) {
        console.error('Error loading device type data:', error);
        throw new Error('Data loading error');
    }
};

//update device type
export const updateDeviceType = async (id, deviceTypeData) => {
    try {
        const response = await axiosInstance.put(`/devicetype/${id}`, deviceTypeData);
        return response.data;
    } catch (error) {
        console.error('Error updating device type data:', error);
        throw new Error('Data updating error');
    }
};

//delete device type
export const deleteDeviceType = async (id) => {
    try {
        const response = await axiosInstance.delete(`/devicetype/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting device type data:', error);
        throw new Error('Data deletion error');
    }
};

//device manufacturer
//get device manufacturer list
export const getDeviceManufacturerList = async () => {
    try {
        const response = await axiosInstance.get(`/devicemanufacturer/getlist`);
        return response.data;
    } catch (error) {
        console.error('Error loading device manufacturer data:', error);
        throw new Error('Data loading error');
    }
};

//get device manufacturer by id
export const getDeviceManufacturerById = async (id) => {
    try {
        const response = await axiosInstance.get(`/devicemanufacturer/`, {
            params: { id: id }
        });
        return response.data;
    } catch (error) {
        console.error('Error loading device manufacturer data:', error);
        throw new Error('Data loading error');
    }
};

//update device manufacturer
export const updateDeviceManufacturer = async (id, deviceManufacturerData) => {
    try {
        const response = await axiosInstance.put(`/devicemanufacturer/${id}`, deviceManufacturerData);
        return response.data;
    } catch (error) {
        console.error('Error updating device manufacturer data:', error);
        throw new Error('Data updating error');
    }
};

    //delete device manufacturer
    export const deleteDeviceManufacturer = async (id) => {
        try {
            const response = await axiosInstance.delete(`/devicemanufacturer/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting device manufacturer data:', error);
            throw new Error('Data deletion error');
        }
    };

    //create Device Manufaturer
    export const createDeviceManufacturer = async (deviceManufacturerData) => {
        try {
            if (!deviceManufacturerData.name || deviceManufacturerData.name.length <= 0) {
                alert('Please provide a valid name before creating a device manufacturer.');
                return;
            }
            const response = await axiosInstance.post(`/devicemanufacturer/`, deviceManufacturerData);
            return response.data;
        } catch (error) {
            console.error('Error creating device manufacturer data:', error);
            throw new Error('Data creation error');
        }
    };
