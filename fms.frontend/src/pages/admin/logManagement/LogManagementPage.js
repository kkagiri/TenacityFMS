import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Alert,
  Spinner,
  Nav,
  Tab,
  ProgressBar
} from 'react-bootstrap';

import logManagementService from '../../../services/logManagementService';
import './LogManagementPage.scss';

const LogManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('app');
  const [logFiles, setLogFiles] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [retention, setRetention] = useState(null);
  const [alert, setAlert] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadLogFiles(selectedCategory);
    }
  }, [selectedCategory]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, statsData, retentionData] = await Promise.all([
        logManagementService.getLogCategories(),
        logManagementService.getLogStatistics(),
        logManagementService.getLogRetention()
      ]);

      setCategories(categoriesData);
      setStatistics(statsData);
      setRetention(retentionData);

      if (categoriesData && categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].name);
      }
    } catch (error) {
      console.error('Error loading log management data:', error);
      showAlert('danger', 'Failed to load log management data');
    } finally {
      setLoading(false);
    }
  };

  const loadLogFiles = async (category) => {
    try {
      setLoading(true);
      const files = await logManagementService.getLogFiles(category);
      setLogFiles(files);
    } catch (error) {
      console.error(`Error loading log files for ${category}:`, error);
      showAlert('danger', `Failed to load log files for ${category}`);
      setLogFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (category, fileName) => {
    try {
      await logManagementService.downloadLogFile(category, fileName);
      showAlert('success', `Downloaded ${fileName}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      showAlert('danger', 'Failed to download log file');
    }
  };

  const handleDownloadAll = async (category) => {
    try {
      await logManagementService.downloadAllLogs(category);
      showAlert('success', `Downloaded all ${category} logs as ZIP`);
    } catch (error) {
      console.error('Error downloading all logs:', error);
      showAlert('danger', 'Failed to download logs');
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(`This will delete all log files older than ${retention?.retentionDays} days. Continue?`)) {
      return;
    }

    try {
      setCleanupLoading(true);
      const result = await logManagementService.triggerLogCleanup();

      if (result.success) {
        showAlert('success', result.message);
        // Reload data
        await loadInitialData();
        if (selectedCategory) {
          await loadLogFiles(selectedCategory);
        }
      } else {
        showAlert('warning', result.message);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      showAlert('danger', 'Failed to cleanup logs');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
    if (selectedCategory) {
      await loadLogFiles(selectedCategory);
    }
  };

  const showAlert = (variant, message) => {
    setAlert({ variant, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryBadge = (category) => {
    const badges = {
      app: 'primary',
      errors: 'danger',
      audit: 'info',
      slow: 'warning',
      startup: 'secondary'
    };
    return badges[category] || 'secondary';
  };

  return (
    <Container fluid className="log-management-page">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <i className="fa-light fa-folder me-2"></i>
                Log Management
              </h2>
              <p className="text-muted">
                Download, view, and manage system log files
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={handleRefresh}
                disabled={loading}
              >
                <i className={`fa-light fa-sync ${loading ? 'spin' : ''}`}></i> Refresh
              </Button>
              <Button
                variant="danger"
                onClick={handleCleanup}
                disabled={cleanupLoading || !retention}
              >
                {cleanupLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <i className="fa-light fa-trash me-2"></i>
                    Run Cleanup
                  </>
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {alert && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Statistics Section */}
      {statistics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <h6 className="text-muted">Total Files</h6>
                <h3>{statistics.totalFiles}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <h6 className="text-muted">Total Size</h6>
                <h3>{statistics.totalSizeMB.toFixed(2)} MB</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <h6 className="text-muted">Retention Period</h6>
                <h3>{retention?.retentionDays || 30} days</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <h6 className="text-muted">Categories</h6>
                <h3>{categories.length}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Category Statistics */}
      {statistics && statistics.categories && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <i className="fa-light fa-chart-bar me-2"></i>
                Storage by Category
              </Card.Header>
              <Card.Body>
                {statistics.categories.map((cat) => (
                  <div key={cat.category} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>
                        <Badge bg={getCategoryBadge(cat.category)} className="me-2">
                          {cat.category}
                        </Badge>
                        {cat.fileCount} files
                      </span>
                      <span className="text-muted">
                        {cat.totalSizeMB.toFixed(2)} MB
                      </span>
                    </div>
                    <ProgressBar
                      now={(cat.totalSizeBytes / statistics.totalSizeBytes) * 100}
                      variant={getCategoryBadge(cat.category)}
                    />
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Log Files Section */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <i className="fa-light fa-file me-2"></i>
                  Log Files
                </span>
                {selectedCategory && (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleDownloadAll(selectedCategory)}
                  >
                    <i className="fa-light fa-download me-2"></i>
                    Download All as ZIP
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              <Tab.Container activeKey={selectedCategory}>
                <Nav variant="tabs" className="mb-3">
                  {categories.map((cat) => (
                    <Nav.Item key={cat.name}>
                      <Nav.Link
                        eventKey={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                      >
                        <Badge bg={getCategoryBadge(cat.name)}>
                          {cat.name}
                        </Badge>
                        <span className="ms-2">({cat.fileCount})</span>
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-3">Loading log files...</p>
                  </div>
                ) : logFiles.length === 0 ? (
                  <Alert variant="info">
                    No log files found for {selectedCategory}
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Size</th>
                          <th>Modified</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logFiles.map((file) => (
                          <tr key={file.fileName}>
                            <td>
                              <i className="fa-light fa-file me-2 text-muted"></i>
                              {file.fileName}
                            </td>
                            <td>{formatFileSize(file.sizeBytes)}</td>
                            <td>{formatDate(file.modifiedDate)}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                  handleDownloadFile(file.category, file.fileName)
                                }
                              >
                                <i className="fa-light fa-download"></i> Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LogManagementPage;
