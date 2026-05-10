import React from "react";
import "./home.scss";
import RealtimeDashboard from "../dashboard/RealtimeDashboard";

export default function Home() {
  return (
    <React.Fragment>
      <div className={"content-block"}>
        <div className={"dx-card"}>
          <RealtimeDashboard />
        </div>
      </div>
    </React.Fragment>
  );
}
