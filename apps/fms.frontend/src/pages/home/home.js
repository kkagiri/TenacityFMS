import React from "react";
import "./home.scss";

export default function Home() {
  return (
    <div className="home-placeholder">
      <div className="home-placeholder__inner">
        <i className="fa-light fa-gauge-high home-placeholder__icon" />
        <h2 className="home-placeholder__title">Welcome to Tenacy FMS</h2>
        <p className="home-placeholder__subtitle">
          Select a module from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
