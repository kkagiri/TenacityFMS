import React, { Component } from "react";
import { Button } from "devextreme-react/button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Fueling Process Error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary-container dx-card">
          <h2>Something went wrong</h2>
          <p>
            We're sorry, an error occurred while processing your fueling
            request.
          </p>

          {this.state.error && (
            <div className="error-details">
              <p>
                <strong>Error:</strong> {this.state.error.toString()}
              </p>
            </div>
          )}

          <div className="error-actions">
            <Button
              text="Refresh Page"
              type="default"
              stylingMode="contained"
              onClick={() => window.location.reload()}
            />

            <Button
              text="Return to Dashboard"
              type="normal"
              stylingMode="outlined"
              onClick={() => (window.location.href = "/")}
              style={{ marginLeft: "10px" }}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
