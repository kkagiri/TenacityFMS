import React from "react";
import "./home.scss";
import Dashboard from "../../components/dashboard";

export default function Home() {
  return (
    <React.Fragment>
      <div className={"content-block"}>
        <div className={"dx-card"}>
          <Dashboard />
        </div>
      </div>
    </React.Fragment>
  );
}
