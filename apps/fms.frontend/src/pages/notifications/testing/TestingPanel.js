import React, { useState, useEffect } from 'react';
import {
  TextBox,
  TextArea,
  Button,
  SelectBox,
  LoadIndicator
} from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import axiosInstance from '../../../api/axiosInstance';
import { useSelector } from 'react-redux';

const TestingPanel = () => {
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth?.user);

  const [testEmail, setTestEmail] = useState({
    toAddress: user?.email || '',
    subject: 'FMS Test Notification',
    message: 'This is a test email from the FMS Notification System.'
  });

  const [policyTest, setPolicyTest] = useState({
    policyId: null,
    testData: '{"tankLevel": 5, "tankName": "Tank #1"}'
  });

  const [connectionTest, setConnectionTest] = useState({
    status: 'idle', // idle, testing, success, error
    lastResult: ''
  });

  const [diagnostics, setDiagnostics] = useState(null);

  // Set user email when user is available
  useEffect(() => {
    if (user?.email && !testEmail.toAddress) {
      setTestEmail(prev => ({ ...prev, toAddress: user.email }));
    }
  }, [user?.email, testEmail.toAddress]);

  const policyOptions = [
    { value: 1, text: 'Tank Level Critical Alert' },
    { value: 2, text: 'Pump Maintenance Reminder' },
    { value: 3, text: 'Device Connection Failure' },
    { value: 4, text: 'Daily System Report' }
  ];

  const sendTestEmail = async () => {
    if (!testEmail.toAddress) {
      notify('Please enter an email address', 'warning', 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('v1/notifications/test-email', {
        toAddress: testEmail.toAddress,
        subject: testEmail.subject,
        message: testEmail.message
      });

      if (response.data?.success) {
        notify(response.data.message || 'Test email sent successfully', 'success', 3000);
      } else {
        notify(response.data?.message || 'Failed to send test email', 'error', 3000);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      notify(error.response?.data?.message || 'Failed to send test email', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const testPolicy = async () => {
    if (!policyTest.policyId) {
      notify('Please select a policy to test', 'warning', 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('v1/notifications/test', {
        title: 'Policy Test',
        message: `Testing policy ID: ${policyTest.policyId}`,
        testData: policyTest.testData
      });

      if (response.data?.success) {
        notify(response.data.message || 'Policy test completed successfully', 'success', 3000);
      } else {
        notify(response.data?.message || 'Policy test failed', 'error', 3000);
      }
    } catch (error) {
      console.error('Error testing policy:', error);
      notify(error.response?.data?.message || 'Policy test failed', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setConnectionTest({ status: 'testing', lastResult: '' });
    try {
      const response = await axiosInstance.post('v1/notifications/test-smtp-connection');

      if (response.data?.success) {
        setConnectionTest({
          status: 'success',
          lastResult: response.data.message || 'SMTP connection successful. Server is reachable and credentials are valid.'
        });
        notify('Connection test successful', 'success', 3000);
      } else {
        setConnectionTest({
          status: 'error',
          lastResult: response.data?.message || 'Connection failed. Please check your SMTP settings.'
        });
        notify('Connection test failed', 'error', 3000);
      }
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      setConnectionTest({
        status: 'error',
        lastResult: error.response?.data?.message || 'Connection failed. Please check your SMTP settings.'
      });
      notify('Connection test failed', 'error', 3000);
    }
  };

  const loadDiagnostics = async () => {
    try {
      const response = await axiosInstance.get('v1/notifications/diagnostics');
      if (response.data?.success) {
        setDiagnostics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    }
  };

  // Load diagnostics on mount
  useEffect(() => {
    loadDiagnostics();
  }, []);

  return (
    <div>
      <div className="tw-mb-8">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Testing & Troubleshooting</h2>
        <p className="tw-text-gray-600 tw-mt-1">Test email delivery and system diagnostics</p>
      </div>

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-8">
        {/* Email Testing */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
          <div className="tw-flex tw-items-center tw-mb-6">
            <i className="fa-light fa-envelope tw-text-blue-600 tw-text-2xl tw-mr-3"></i>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Send Test Email</h3>
          </div>

          <div className="tw-space-y-4">
            <TextBox
              label="To Address"
              labelMode="floating"
              value={testEmail.toAddress}
              onValueChanged={(e) => setTestEmail(prev => ({ ...prev, toAddress: e.value }))}
              placeholder="Enter email address"
            />

            <TextBox
              label="Subject"
              labelMode="floating"
              value={testEmail.subject}
              onValueChanged={(e) => setTestEmail(prev => ({ ...prev, subject: e.value }))}
              placeholder="Enter email subject"
            />

            <TextArea
              label="Message"
              labelMode="floating"
              value={testEmail.message}
              onValueChanged={(e) => setTestEmail(prev => ({ ...prev, message: e.value }))}
              placeholder="Enter test message..."
              height={120}
            />

            <Button
              text={loading ? 'Sending...' : 'Send Test Email'}
              type="default"
              stylingMode="contained"
              onClick={sendTestEmail}
              disabled={loading || !testEmail.toAddress}
              className="tw-w-full"
            />
          </div>
        </div>

        {/* Connection Testing */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
          <div className="tw-flex tw-items-center tw-mb-6">
            <i className="fa-light fa-plug tw-text-green-600 tw-text-2xl tw-mr-3"></i>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">SMTP Connection Test</h3>
          </div>

          <div className="tw-space-y-4">
            <div className={`tw-flex tw-items-center tw-space-x-2 tw-p-3 tw-rounded-lg ${
              connectionTest.status === 'success'
                ? 'tw-bg-green-50 tw-text-green-800'
                : connectionTest.status === 'error'
                ? 'tw-bg-red-50 tw-text-red-800'
                : connectionTest.status === 'testing'
                ? 'tw-bg-yellow-50 tw-text-yellow-800'
                : 'tw-bg-gray-50 tw-text-gray-800'
            }`}>
              {connectionTest.status === 'testing' ? (
                <LoadIndicator visible={true} height={16} width={16} />
              ) : (
                <div className={`tw-w-3 tw-h-3 tw-rounded-full ${
                  connectionTest.status === 'success' ? 'tw-bg-green-400' :
                  connectionTest.status === 'error' ? 'tw-bg-red-400' : 'tw-bg-gray-400'
                }`}></div>
              )}
              <span className="tw-text-sm tw-font-medium">
                {connectionTest.status === 'testing' ? 'Testing connection...' :
                 connectionTest.status === 'success' ? 'Connection successful' :
                 connectionTest.status === 'error' ? 'Connection failed' : 'Not tested'}
              </span>
            </div>

            {connectionTest.lastResult && (
              <div className="tw-p-3 tw-bg-gray-50 tw-rounded tw-border tw-text-sm tw-text-gray-700">
                {connectionTest.lastResult}
              </div>
            )}

            <Button
              text="Test SMTP Connection"
              type="default"
              stylingMode="outlined"
              onClick={testConnection}
              disabled={connectionTest.status === 'testing'}
              className="tw-w-full"
            />

            <div className="tw-text-xs tw-text-gray-500">
              This will test the connection to your configured SMTP server without sending an email.
            </div>
          </div>
        </div>

        {/* Policy Testing */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
          <div className="tw-flex tw-items-center tw-mb-6">
            <i className="fa-light fa-flask-vial tw-text-purple-600 tw-text-2xl tw-mr-3"></i>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Policy Simulation</h3>
          </div>

          <div className="tw-space-y-4">
            <SelectBox
              label="Select Policy"
              labelMode="floating"
              value={policyTest.policyId}
              dataSource={policyOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => setPolicyTest(prev => ({ ...prev, policyId: e.value }))}
              placeholder="Choose a policy to test"
            />

            <TextArea
              label="Test Data (JSON)"
              labelMode="floating"
              value={policyTest.testData}
              onValueChanged={(e) => setPolicyTest(prev => ({ ...prev, testData: e.value }))}
              placeholder='{"tankLevel": 5, "tankName": "Tank #1"}'
              height={100}
            />

            <Button
              text={loading ? 'Testing...' : 'Simulate Policy'}
              type="default"
              stylingMode="contained"
              onClick={testPolicy}
              disabled={loading || !policyTest.policyId}
              className="tw-w-full"
            />

            <div className="tw-text-xs tw-text-gray-500">
              This will simulate the policy trigger with the provided test data without actually sending notifications.
            </div>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
          <div className="tw-flex tw-items-center tw-mb-6">
            <i className="fa-light fa-stethoscope tw-text-orange-600 tw-text-2xl tw-mr-3"></i>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">System Diagnostics</h3>
          </div>

          <div className="tw-space-y-4">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
              <div>
                <div className="tw-text-gray-500">Email Service</div>
                <div className="tw-flex tw-items-center tw-font-medium">
                  <div className={`tw-w-2 tw-h-2 tw-rounded-full tw-mr-2 ${
                    diagnostics?.emailServiceConfigured ? 'tw-bg-green-400' : 'tw-bg-red-400'
                  }`}></div>
                  {diagnostics?.emailServiceConfigured ? 'Online' : 'Not Configured'}
                </div>
              </div>
              <div>
                <div className="tw-text-gray-500">SMTP Server</div>
                <div className="tw-flex tw-items-center tw-font-medium">
                  <div className={`tw-w-2 tw-h-2 tw-rounded-full tw-mr-2 ${
                    diagnostics?.smtpHost ? 'tw-bg-green-400' : 'tw-bg-gray-400'
                  }`}></div>
                  {diagnostics?.smtpHost || 'Not Set'}
                </div>
              </div>
              <div>
                <div className="tw-text-gray-500">SMTP Port</div>
                <div className="tw-font-medium tw-text-gray-900">{diagnostics?.smtpPort || 'N/A'}</div>
              </div>
              <div>
                <div className="tw-text-gray-500">SSL Enabled</div>
                <div className="tw-font-medium tw-text-gray-900">
                  {diagnostics?.sslEnabled !== undefined ? (diagnostics.sslEnabled ? 'Yes' : 'No') : 'N/A'}
                </div>
              </div>
            </div>

            <div className="tw-border-t tw-border-gray-200 tw-pt-4">
              <div className="tw-text-sm tw-text-gray-600 tw-mb-3">Email Configuration</div>
              <div className="tw-space-y-2 tw-text-sm">
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-gray-600">From Address</span>
                  <span className="tw-text-gray-900">{diagnostics?.fromAddress || 'Not configured'}</span>
                </div>
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-gray-600">System Name</span>
                  <span className="tw-text-gray-900">{diagnostics?.systemName || 'FMS'}</span>
                </div>
              </div>
            </div>

            <Button
              text="Refresh Diagnostics"
              type="default"
              stylingMode="outlined"
              onClick={loadDiagnostics}
              className="tw-w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingPanel;
