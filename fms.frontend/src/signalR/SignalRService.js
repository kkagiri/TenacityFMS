// src/services/SignalRService.js

import * as signalR from "@microsoft/signalr";
import registerDeviceHandlers from "./deviceSignalIRService";
import { registerPumpSignalIRService } from "./pumpSignalIRService";

class SignalRService {
  constructor() {
    this.connection = null;
  }

  startConnection = () => {
    // const token = localStorage.getItem("token");
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:7009/signalHub", {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection
      .start()
      .then(() => {
        // console.log("SignalR Connected");
        this.registerHandlers();
      })
      .catch((err) => console.log("SignalR Connection Error: ", err));
  };

  registerHandlers = () => {
    registerPumpSignalIRService(this.connection);
    registerDeviceHandlers(this.connection);
  };

  stopConnection = () => {
    if (this.connection) {
      this.connection
        .stop()
        .then(() => console.log("SignalR Disconnected"))
        .catch((err) => console.log("SignalR Disconnection Error: ", err));
    }
  };
}

export default new SignalRService();
