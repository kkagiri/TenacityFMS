import React from 'react';

/**
 * Generic error boundary to capture and display rendering errors in preferences UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Preferences ErrorBoundary] Caught error:', error, info);
    this.setState({ info });
    if (this.props.onError) this.props.onError(error, info);
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: null, info: null });
    if (this.props.onRetry) this.props.onRetry();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="tw-p-4 tw-border tw-border-red-300 tw-bg-red-50 tw-rounded">
          <h4 className="tw-text-red-600 tw-font-semibold tw-mb-2">A rendering error occurred</h4>
          <pre className="tw-text-xs tw-overflow-auto tw-max-h-40 tw-mb-2">
            {this.state.error && (this.state.error.stack || this.state.error.toString())}
          </pre>
          {this.state.info && this.state.info.componentStack && (
            <details className="tw-text-xs tw-whitespace-pre-wrap tw-mb-2">
              <summary className="tw-cursor-pointer">Component stack</summary>
              {this.state.info.componentStack}
            </details>
          )}
          <button type="button" className="tw-text-sm tw-px-3 tw-py-1 tw-bg-red-600 tw-text-white tw-rounded" onClick={this.handleRetry}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
