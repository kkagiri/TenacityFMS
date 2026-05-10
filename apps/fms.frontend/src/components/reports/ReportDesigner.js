import { useEffect, useRef } from 'react';
import { DxReportDesigner } from 'devexpress-reporting/dx-reportdesigner';
import * as ko from 'knockout';
import axiosInstance from './../../api/axiosInstance';

const ReportDesignerComponent = () => {
  const reportUrl = ko.observable("NewReport");
  const designerRef = useRef();

  const token = localStorage.getItem('token');

  const requestOptions = {
      host: axiosInstance.defaults.baseURL + "/ReportDocDesigner/",
      getDesignerModelAction: "GetDesignerModel",
      headers: {
        'Authorization': `Bearer ${token}`
      }
  };

  const onSaveReport = (args) => {
      return new Promise((resolve, reject) => {
          const reportLayout = args.layoutData;
          const reportName = args.reportName || reportUrl();

          axiosInstance.post('/ReportDocDesigner/save', {
              Name: reportName,
              LayoutData: reportLayout
          }, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          })
          .then(response => {
              console.log("Report saved successfully:", response.data);
              resolve(true);
          })
          .catch(error => {
              console.error("Error saving report:", error);
              reject(error);
          });
      });
  };

  const onOpenReport = (args) => {
      return new Promise((resolve, reject) => {
          const reportName = args.reportName;

          axiosInstance.get(`/ReportDesigner/load/${reportName}`, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          })
          .then(response => {
              console.log("Report opened successfully:", response.data);
              resolve(response.data.LayoutData);
          })
          .catch(error => {
              console.error("Error opening report:", error);
              reject(error);
          });
      });
  };

  useEffect(() => {
      const designer = new DxReportDesigner(designerRef.current, { 
          reportUrl, 
          requestOptions,
          callbacks: {
              customizeMenuActions: function(actions) {
                  // You can customize menu actions here if needed
              },
              onSaveReport: onSaveReport,
              onOpenReport: onOpenReport
          }
      });
      designer.render(); 
      return () => designer.dispose();
    }, [reportUrl, requestOptions, onSaveReport, onOpenReport]);

  return (
    <div className="report-designer-container dx-report-designer-wrapper">
      <div ref={designerRef}></div>
    </div>
  );
};
  
  export default ReportDesignerComponent;