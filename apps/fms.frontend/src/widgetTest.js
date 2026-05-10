import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetTestPage from './components/dashboard/WidgetTestPage';
import './index.css';

// Bootstrap CSS for styling
import 'bootstrap/dist/css/bootstrap.min.css';

// DevExtreme CSS for charts
import 'devextreme/dist/css/dx.light.css';

/**
 * Widget Test Launcher
 * Standalone test runner for widget components
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <div className="widget-test-app">
      <WidgetTestPage />
    </div>
  </React.StrictMode>
);

console.log('Widget Test Page loaded successfully!');
console.log('Available widgets:', [
  'Line Chart Widgets (IDs 8, 9)',
  'Ticker Widget (ID 10)',
  'Big Stat Card Widget (ID 11)'
]);
