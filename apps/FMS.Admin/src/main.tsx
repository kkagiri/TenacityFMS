/**
 * File:          main.tsx
 * Purpose:       FMS.Admin React entry point.
 * Dependencies:  React, Redux, React Router, global styles
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - main: Mounts the operator portal.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "../../fms.frontend/assests/fontawesome/css/fontawesome.css";
import "../../fms.frontend/assests/fontawesome/css/light.css";
import AdminErrorBoundary from "./AdminErrorBoundary";
import App from "./App";
import { store } from "./store/store";
import "./styles/admin.scss";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AdminErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </AdminErrorBoundary>
  </React.StrictMode>,
);
