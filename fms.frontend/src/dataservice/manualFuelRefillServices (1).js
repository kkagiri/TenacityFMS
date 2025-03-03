import axiosInstance from "../api/axiosInstance";

//Create a new manual fuel refil 
export const createManualFuelRefill = async (refillData) => {
    try {
        const response = await axiosInstance.post("/fuelrefil", refillData);
        return response.data;
    } catch (error) {
        console.error("Error creating manual fuel refill:", error);
        throw new Error(error.response?.data?.message || "Manual fuel refill creation error");
    }
};

//Get all manual fuel refills
 
 export const getManualFuelRefills = async () => {
    try {
        const response = await axiosInstance.get("/fuelrefil/getlist");
        return response.data;
    } catch (error) {
        console.error("Error getting manual fuel refills:", error);
        throw new Error(error.response?.data?.message || "Manual fuel refills error");
    }   
};

//Get a specific manual fuel refill
export const getManualFuelRefillbyid = async (id) => {
    try {
        const response = await axiosInstance.get(`/fuelrefil/${id}`);
        return response.data;
    }
        catch (error) {
        console.error("Error getting manual fuel refill:", error);
        throw new Error(error.response?.data?.message || "Manual fuel refill error");
    }   
};

//Update a specific manual fuel refill
export const updateManualFuelRefill = async (id, refillData) => {
    try {
        const response = await axiosInstance.put(`/fuelrefil/${id}`, refillData);
        return response.data;
    }
        catch (error) {
        console.error("Error updating manual fuel refill:", error);
        throw new Error(error.response?.data?.message || "Manual fuel refill update error");
    }   
};

//Delete a specific manual fuel refill
export const deleteManualFuelRefill = async (id) => {
    try {
        const response = await axiosInstance.delete(`/fuelrefil/${id}`);
        return response.data;
    }
        catch (error) {
        console.error("Error deleting manual fuel refill:", error);
        throw new Error(error.response?.data?.message || "Manual fuel refill deletion error");
    }   
};
