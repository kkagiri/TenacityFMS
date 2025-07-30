import React from 'react';
import { useSelector } from 'react-redux';

// Test component to verify Redux state structure
const IssueTrackerReduxTest = () => {
  const issueTrackerState = useSelector(state => state.issueTracker);
  const vehicleState = useSelector(state => state.vehicle);
  const siteState = useSelector(state => state.site);
  const userState = useSelector(state => state.user);

  return (
    <div style={{ padding: '20px', fontSize: '12px' }}>
      <h3>Redux State Debug for Issue Tracker</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>Issue Tracker State:</h4>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(issueTrackerState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Vehicle State:</h4>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(vehicleState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Site State:</h4>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(siteState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>User State:</h4>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(userState, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default IssueTrackerReduxTest;
