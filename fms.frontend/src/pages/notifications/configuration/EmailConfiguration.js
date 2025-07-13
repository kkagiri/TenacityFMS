import React, { useState, useEffect } from 'react';
import {
  Form,
  TextBox,
  NumberBox,
  SelectBox,
  CheckBox,
  Button,
  LoadIndicator,
  ValidationGroup,
  Validator
} from 'devextreme-react';
import { RequiredRule, EmailRule, NumericRule } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import '../layout/NotificationLayout.scss';

const EmailConfiguration = () => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, testing, success, error
  const [testEmailStatus, setTestEmailStatus] = useState('idle');

  const [config, setConfig] = useState({
    server: 'smtp.company.com',
    port: 587,
    security: 'tls',
    username: 'notifications@company.com',
    password: '',
    fromAddress: 'notifications@company.com',
    fromName: 'FMS Notification System',
    replyTo: 'support@company.com',
    timeout: 30,
    enableSsl: true,
    requiresAuthentication: true,
    maxRetries: 3,
    retryDelay: 5
  });

  const [testEmail, setTestEmail] = useState({
    toAddress: 'admin@company.com',
    subject: 'FMS Test Notification',
    message: 'This is a test email from the FMS Notification System. If you receive this message, your email configuration is working correctly.'
  });

  const [lastTestResult, setLastTestResult] = useState('');

  const securityOptions = [
    { value: 'none', text: 'None' },
    { value: 'ssl', text: 'SSL' },
    { value: 'tls', text: 'TLS' },
    { value: 'starttls', text: 'STARTTLS' }
  ];

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API call
      const response = await fetch('/api/notifications/email-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading email configuration:', error);
      notify('Error loading email configuration', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API call
      const response = await fetch('/api/notifications/email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        notify('Email configuration saved successfully', 'success', 3000);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving email configuration:', error);
      notify('Error saving email configuration', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('testing');
    try {
      // Simulate API call - replace with actual API call
      const response = await fetch('/api/notifications/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: config.server,
          port: config.port,
          security: config.security,
          username: config.username,
          password: config.password
        }),
      });

      if (response.ok) {
        setConnectionStatus('success');
        setLastTestResult('Connection successful! SMTP server is reachable and authentication passed.');
        notify('SMTP connection test successful', 'success', 3000);
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setLastTestResult('Connection failed: Please check your server settings and credentials.');
      notify('SMTP connection test failed', 'error', 3000);
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    setTestingEmail(true);
    setTestEmailStatus('sending');
    try {
      // Simulate API call - replace with actual API call
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress: testEmail.toAddress,
          subject: testEmail.subject,
          message: testEmail.message
        }),
      });

      if (response.ok) {
        setTestEmailStatus('success');
        notify('Test email sent successfully', 'success', 3000);
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      setTestEmailStatus('error');
      notify('Failed to send test email', 'error', 3000);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Reset connection status when config changes
    if (['server', 'port', 'username', 'password', 'security'].includes(field)) {
      setConnectionStatus('idle');
      setLastTestResult('');
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator visible={true} />
      </div>
    );
  }

  return (
    <div className="email-config form-container">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-8">
        <div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Email Configuration</h2>
          <p className="tw-text-gray-600 tw-mt-1">Configure SMTP settings and email delivery options</p>
        </div>
        <div className="tw-flex tw-items-center tw-space-x-4">
          {/* Connection Status */}
          <div className={`tw-flex tw-items-center tw-space-x-2 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm ${
            connectionStatus === 'success'
              ? 'tw-bg-green-100 tw-text-green-800'
              : connectionStatus === 'error'
              ? 'tw-bg-red-100 tw-text-red-800'
              : 'tw-bg-gray-100 tw-text-gray-800'
          }`}>
            <div className={`tw-w-2 tw-h-2 tw-rounded-full ${
              connectionStatus === 'success' ? 'tw-bg-green-400' :
              connectionStatus === 'error' ? 'tw-bg-red-400' : 'tw-bg-gray-400'
            }`}></div>
            <span>
              {connectionStatus === 'success' ? 'Connected' :
               connectionStatus === 'error' ? 'Connection Failed' : 'Not Tested'}
            </span>
          </div>
          <Button
            text="Save Configuration"
            type="default"
            stylingMode="contained"
            onClick={saveConfiguration}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-content">
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-8 notification-form">
        {/* SMTP Configuration */}
        <div className="lg:tw-col-span-2">
          <div className="config-section">
            <div className="config-header">
              <i className="fa-light fa-server config-icon"></i>
              <h3 className="config-title">SMTP Server Settings</h3>
            </div>

            <ValidationGroup>
              <Form formData={config} colCount={2}>
                <TextBox
                  label="SMTP Server"
                  value={config.server}
                  onValueChanged={(e) => handleConfigChange('server', e.value)}
                  placeholder="smtp.company.com"
                >
                  <Validator>
                    <RequiredRule message="SMTP server is required" />
                  </Validator>
                </TextBox>

                <NumberBox
                  label="Port"
                  value={config.port}
                  onValueChanged={(e) => handleConfigChange('port', e.value)}
                  min={1}
                  max={65535}
                >
                  <Validator>
                    <RequiredRule message="Port is required" />
                    <NumericRule message="Port must be a number" />
                  </Validator>
                </NumberBox>

                <SelectBox
                  label="Security"
                  value={config.security}
                  dataSource={securityOptions}
                  valueExpr="value"
                  displayExpr="text"
                  onValueChanged={(e) => handleConfigChange('security', e.value)}
                />

                <NumberBox
                  label="Timeout (seconds)"
                  value={config.timeout}
                  onValueChanged={(e) => handleConfigChange('timeout', e.value)}
                  min={5}
                  max={300}
                />

                <TextBox
                  label="Username"
                  value={config.username}
                  onValueChanged={(e) => handleConfigChange('username', e.value)}
                  placeholder="notifications@company.com"
                >
                  <Validator>
                    <RequiredRule message="Username is required" />
                    <EmailRule message="Please enter a valid email address" />
                  </Validator>
                </TextBox>

                <TextBox
                  label="Password"
                  mode="password"
                  value={config.password}
                  onValueChanged={(e) => handleConfigChange('password', e.value)}
                  placeholder="Enter password"
                >
                  <Validator>
                    <RequiredRule message="Password is required" />
                  </Validator>
                </TextBox>

                <TextBox
                  label="From Address"
                  value={config.fromAddress}
                  onValueChanged={(e) => handleConfigChange('fromAddress', e.value)}
                  placeholder="notifications@company.com"
                >
                  <Validator>
                    <RequiredRule message="From address is required" />
                    <EmailRule message="Please enter a valid email address" />
                  </Validator>
                </TextBox>

                <TextBox
                  label="From Name"
                  value={config.fromName}
                  onValueChanged={(e) => handleConfigChange('fromName', e.value)}
                  placeholder="FMS Notification System"
                >
                  <Validator>
                    <RequiredRule message="From name is required" />
                  </Validator>
                </TextBox>

                <TextBox
                  label="Reply To"
                  value={config.replyTo}
                  onValueChanged={(e) => handleConfigChange('replyTo', e.value)}
                  placeholder="support@company.com"
                >
                  <Validator>
                    <EmailRule message="Please enter a valid email address" />
                  </Validator>
                </TextBox>

                <NumberBox
                  label="Max Retries"
                  value={config.maxRetries}
                  onValueChanged={(e) => handleConfigChange('maxRetries', e.value)}
                  min={0}
                  max={10}
                />
              </Form>

              <div className="tw-mt-6 tw-space-y-4">
                <CheckBox
                  text="Enable SSL/TLS"
                  value={config.enableSsl}
                  onValueChanged={(e) => handleConfigChange('enableSsl', e.value)}
                />
                <CheckBox
                  text="Requires Authentication"
                  value={config.requiresAuthentication}
                  onValueChanged={(e) => handleConfigChange('requiresAuthentication', e.value)}
                />
              </div>
            </ValidationGroup>
          </div>
        </div>

        {/* Testing Panel */}
        <div className="tw-space-y-6">
          {/* Connection Test */}
          <div className="config-section">
            <div className="config-header">
              <i className="fa-light fa-plug config-icon"></i>
              <h3 className="config-title">Connection Test</h3>
            </div>

            <div className="test-panel">
              <div className={`test-status ${connectionStatus}`}>
                {connectionStatus === 'testing' ? (
                  <div className="tw-flex tw-items-center">
                    <LoadIndicator visible={true} height={16} width={16} />
                    <span className="tw-ml-2">Testing connection...</span>
                  </div>
                ) : connectionStatus === 'success' ? (
                  <div className="tw-flex tw-items-center">
                    <i className="fa-light fa-check-circle tw-mr-2"></i>
                    <span>Connection successful</span>
                  </div>
                ) : connectionStatus === 'error' ? (
                  <div className="tw-flex tw-items-center">
                    <i className="fa-light fa-exclamation-circle tw-mr-2"></i>
                    <span>Connection failed</span>
                  </div>
                ) : (
                  <div className="tw-flex tw-items-center">
                    <i className="fa-light fa-circle tw-mr-2"></i>
                    <span>Not tested</span>
                  </div>
                )}
              </div>

              {lastTestResult && (
                <div className="tw-mt-3 tw-p-3 tw-bg-white tw-rounded tw-border tw-text-sm">
                  {lastTestResult}
                </div>
              )}

              <Button
                text="Test Connection"
                type="default"
                stylingMode="outlined"
                onClick={testConnection}
                disabled={testing || !config.server || !config.port}
                className="tw-w-full tw-mt-4"
              />
            </div>
          </div>

          {/* Test Email */}
          <div className="config-section">
            <div className="config-header">
              <i className="fa-light fa-envelope config-icon"></i>
              <h3 className="config-title">Send Test Email</h3>
            </div>

            <div className="tw-space-y-4">
              <TextBox
                label="To Address"
                value={testEmail.toAddress}
                onValueChanged={(e) => setTestEmail(prev => ({ ...prev, toAddress: e.value }))}
                placeholder="admin@company.com"
              >
                <Validator>
                  <RequiredRule message="Email address is required" />
                  <EmailRule message="Please enter a valid email address" />
                </Validator>
              </TextBox>

              <TextBox
                label="Subject"
                value={testEmail.subject}
                onValueChanged={(e) => setTestEmail(prev => ({ ...prev, subject: e.value }))}
                placeholder="Test Email Subject"
              />

              <div className="tw-space-y-2">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                  Message
                </label>
                <textarea
                  className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  rows={4}
                  value={testEmail.message}
                  onChange={(e) => setTestEmail(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter test message..."
                />
              </div>

              <div className={`tw-flex tw-items-center tw-space-x-2 tw-text-sm ${
                testEmailStatus === 'success'
                  ? 'tw-text-green-600'
                  : testEmailStatus === 'error'
                  ? 'tw-text-red-600'
                  : 'tw-text-gray-600'
              }`}>
                {testEmailStatus === 'sending' ? (
                  <>
                    <LoadIndicator visible={true} height={16} width={16} />
                    <span>Sending test email...</span>
                  </>
                ) : testEmailStatus === 'success' ? (
                  <>
                    <i className="fa-light fa-check-circle"></i>
                    <span>Test email sent successfully</span>
                  </>
                ) : testEmailStatus === 'error' ? (
                  <>
                    <i className="fa-light fa-exclamation-circle"></i>
                    <span>Failed to send test email</span>
                  </>
                ) : null}
              </div>

              <Button
                text="Send Test Email"
                type="default"
                stylingMode="contained"
                onClick={sendTestEmail}
                disabled={testingEmail || connectionStatus !== 'success' || !testEmail.toAddress}
                className="tw-w-full"
              />
            </div>
          </div>

          {/* Quick Tips */}
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-mb-2">
              <i className="fa-light fa-lightbulb tw-text-blue-600 tw-mr-2"></i>
              <h4 className="tw-text-sm tw-font-medium tw-text-blue-900">Quick Tips</h4>
            </div>
            <ul className="tw-text-sm tw-text-blue-800 tw-space-y-1">
              <li>• Common SMTP ports: 25, 465 (SSL), 587 (TLS)</li>
              <li>• Test connection before saving</li>
              <li>• Use app passwords for Gmail/Office365</li>
              <li>• Check firewall settings if connection fails</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EmailConfiguration;
