import axiosInstance from "../api/axiosInstance";


//get userLIst

export const getUserList = async () => {
    try {
        const response = await axiosInstance.get(`/api/user/getlist`);
        return response.data;
    } catch (error) {
        console.error('Error loading user data:', error);
        throw new Error('Data loading error');
    }
};

//get user details
export const getUserDetails = async (id) => {
    try {
        const response = await axiosInstance.get(`/api/user/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user details:', error);
        throw new Error('User details fetching error');
    }
};

//update user details
export const updateUserDetails = async (id, userDetails) => {
    try {
        const response = await axiosInstance.put(`/api/user/${id}`, userDetails);
        return response.data;
    } catch (error) {
        console.error('Error updating user details:', error);
        throw new Error('User details updating error');
    }
};

//delete user
export const deleteUser = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/user/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new Error('User deletion error');
    }
};