import ApiClient from "./gpsgate/ApiClient";
import { SuperAgent } from "superagent";


const createApiClient = () => {
    const apiClient = new ApiClient();
    apiClient.basePath = 'http://10.0.10.150/comGpsGate/api/v.1/applications/12';
    apiClient.authentications.ApiKey.apiKey = `Basic ${btoa(`${process.env.REACT_APP_GPSGATE_APP_USERNAME}:${process.env.REACT_APP_GPSGATE_APP_PASSWORD}`)}`;
    return apiClient;

};
export default createApiClient;
