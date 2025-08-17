import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import IssueTrackerFormPage from '../IssueTrackerFormPage';
import IssueTrackerReduxTest from './IssueTrackerReduxTest';
import QuickCreateIssuePopup from './QuickCreateIssuePopup';
import GPSTriggeredIssueForm from './GPSTriggeredIssueForm';
import IssueTrackerDashboard from './IssueTrackerDashboard';
import {
  fetchIssues,
  fetchIssueCategories,
  fetchIssuePriorities,
  fetchIssueStatuses
} from '../../../redux/actions/issueTrackerActions';
import { fetchVehicleList } from '../../../redux/actions/vehicleActions';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchUsers } from '../../../redux/actions/userActions';
import notify from 'devextreme/ui/notify';

const IssueTrackerDemoPage = () => {
  const dispatch = useDispatch();
  const [activeDemo, setActiveDemo] = useState('dashboard');
  const [showReduxDebug, setShowReduxDebug] = useState(false);
  const [showStandardForm, setShowStandardForm] = useState(false);
  const [showGpsForm, setShowGpsForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Mock GPS data for demonstration
  const mockGpsData = {
    vehicleId: 1,
    vehicleName: 'Fleet Vehicle 001',
    latitude: -26.2041,
    longitude: 28.0473,
    address: 'Johannesburg, South Africa',
    timestamp: new Date(),
    suggestedTitle: 'GPS Signal Lost - Vehicle Tracking Issue',
    suggestedDescription: 'Vehicle GPS signal has been unavailable for over 30 minutes. Last known location was Johannesburg CBD.',
    severity: 'High',
    isUrgent: true
  };

  // Load all required data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          dispatch(fetchIssues()),
          dispatch(fetchIssueCategories()),
          dispatch(fetchIssuePriorities()),
          dispatch(fetchIssueStatuses()),
          dispatch(fetchVehicleList()),
          dispatch(fetchSiteList()),
          dispatch(fetchUsers())
        ]);
        setDataLoaded(true);
        notify({
          message: 'All demo data loaded successfully!',
          type: 'success',
          displayTime: 3000
        });
      } catch (error) {
        console.error('Error loading demo data:', error);
        notify({
          message: 'Failed to load some demo data. Form functionality may be limited.',
          type: 'warning',
          displayTime: 5000
        });
        setDataLoaded(true); // Still show the demo even if some data fails
      }
    };

    loadAllData();
  }, [dispatch]);

  const handleStandardFormSave = (savedIssue) => {
    notify({
      message: `Issue "${savedIssue.problemTitle}" created successfully!`,
      type: 'success',
      displayTime: 3000
    });
    setShowStandardForm(false);
  };

  const handleGpsFormSave = (savedIssue) => {
    notify({
      message: `GPS-triggered issue "${savedIssue.problemTitle}" created successfully!`,
      type: 'success',
      displayTime: 3000
    });
    setShowGpsForm(false);
  };

  const demoSections = [
    {
      id: 'dashboard',
      title: 'Comprehensive Dashboard',
      description: 'Complete dashboard with monitoring, statistics, and all workflow types',
      component: <IssueTrackerDashboard />
    },
    {
      id: 'quickCreate',
      title: 'Quick Create Popup',
      description: 'Simple popup form for quick issue creation from dashboard',
      component: <QuickCreateIssuePopup />
    },
    {
      id: 'standard',
      title: 'Standard Form Workflow',
      description: 'Full-featured form with all fields and validation',
      component: (
        <Button
          text="Open Standard Form"
          type="default"
          onClick={() => setShowStandardForm(true)}
          disabled={!dataLoaded}
        />
      )
    },
    {
      id: 'gpsTriggered',
      title: 'GPS-Triggered Workflow',
      description: 'Automated form with GPS data pre-filled',
      component: (
        <Button
          text="Simulate GPS-Triggered Issue"
          type="default"
          onClick={() => setShowGpsForm(true)}
          disabled={!dataLoaded}
        />
      )
    }
  ];

  if (!dataLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Issue Tracker Demo...</h2>
        <p>Loading all required data from Redux store...</p>
        <div style={{ marginTop: '20px' }}>
          <i className="fa fa-spinner fa-spin fa-2x"></i>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1>🎯 Issue Tracker - Redux Integration Demo</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
          All forms now use Redux for state management and actual DTO properties from your backend models.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {demoSections.map(section => (
            <Button
              key={section.id}
              text={section.title}
              type={activeDemo === section.id ? 'default' : 'normal'}
              stylingMode={activeDemo === section.id ? 'contained' : 'outlined'}
              onClick={() => setActiveDemo(section.id)}
            />
          ))}
          <Button
            text="Redux Debug"
            type={showReduxDebug ? 'default' : 'normal'}
            stylingMode={showReduxDebug ? 'contained' : 'outlined'}
            onClick={() => setShowReduxDebug(!showReduxDebug)}
          />
        </div>
      </div>

      {/* Active Demo Section */}
      <div style={{ marginBottom: '30px' }}>
        {demoSections.find(s => s.id === activeDemo) && (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>{demoSections.find(s => s.id === activeDemo).title}</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {demoSections.find(s => s.id === activeDemo).description}
            </p>
            {demoSections.find(s => s.id === activeDemo).component}
          </div>
        )}
      </div>

      {/* Redux Debug Section */}
      {showReduxDebug && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fff3cd'
        }}>
          <IssueTrackerReduxTest />
        </div>
      )}

      {/* Standard Form Popup */}
      <Popup
        visible={showStandardForm}
        onHiding={() => setShowStandardForm(false)}
        title="Standard Issue Creation Workflow"
        width={900}
        height={700}
        resizeEnabled={true}
      >
        <IssueTrackerFormPage
          isPopup={true}
          workflowType="standard"
          onClose={() => setShowStandardForm(false)}
          onSave={handleStandardFormSave}
        />
      </Popup>

      {/* GPS-Triggered Form Popup */}
      <Popup
        visible={showGpsForm}
        onHiding={() => setShowGpsForm(false)}
        title="GPS-Triggered Issue Creation"
        width={800}
        height={600}
        resizeEnabled={true}
      >
        <GPSTriggeredIssueForm
          isPopup={true}
          gpsData={mockGpsData}
          onClose={() => setShowGpsForm(false)}
          onSave={handleGpsFormSave}
        />
      </Popup>

      {/* Info Panel */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e8f4fd',
        border: '1px solid #bee5eb',
        borderRadius: '5px'
      }}>
        <h4>🔧 Technical Implementation Highlights:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>✅ Form data now matches actual <code>IssueTrackerDTO.cs</code> properties</li>
          <li>✅ All lookup data loaded via Redux actions (categories, priorities, statuses, vehicles, sites, users)</li>
          <li>✅ SelectBox components with proper data binding (<code>displayExpr</code> and <code>valueExpr</code>)</li>
          <li>✅ Form validation updated for required DTO properties</li>
          <li>✅ Auto-save functionality using Redux dispatch</li>
          <li>✅ GPS data integration with proper field mapping</li>
          <li>✅ Three workflow types: Standard, Quick Create, GPS-Triggered</li>
          <li>✅ Real-time state management and error handling</li>
        </ul>

        <p style={{ marginTop: '15px', fontSize: '14px', fontStyle: 'italic' }}>
          Use the "Redux Debug" button to inspect the current state of all Redux stores.
        </p>
      </div>
    </div>
  );
};

export default IssueTrackerDemoPage;
