import React, { useEffect, useRef } from 'react';
import { DxReportViewer } from 'devexpress-reporting/dx-webdocumentviewer';
import * as ko from 'knockout';
import axiosInstance from './../../api/axiosInstance';

const DocumentViewer = ({ reportName }) => {
  const viewerRef = useRef();

  useEffect(() => {
    const requestOptions = {
      host: axiosInstance.defaults.baseURL,
      invokeAction: "api/ReportViewer/Invoke",
      getDocumentViewerModel: (m, success, error) => {
        axiosInstance.post('api/DXXRDV/ReportViewer/GetDocumentViewerModel', m.reportUrl)
          .then(response => success(response.data))
          .catch(error);
      },
      getReportTemplate: (reportName) => {
        return axiosInstance.get(`api/ReportViewer/GetReportTemplate/${reportName}`)
          .then(response => response.data);
      },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };

    const reportUrl = ko.observable(reportName);

    const viewer = new DxReportViewer(viewerRef.current, {
      reportUrl,
      requestOptions,
      callbacks: {
        customizeParameterEditors: (editors) => {
          // Customize parameter editors if needed
        },
        customizeMenuActions: (actions) => {
          // Customize menu actions if needed
        }
      }
    });

    viewer.render();
    return () => viewer.dispose();
  }, [reportName]);

  return <div ref={viewerRef} style={{ width: "100%", height: "800px" }}></div>;
};

export default DocumentViewer;