import { useEffect, useRef } from 'react';
import { DxReportDesigner } from 'devexpress-reporting/dx-reportdesigner';
import * as ko from 'knockout';
import './reportdesignerStyles.css';

const ReportDesigner = () => {
  const reportUrl = ko.observable("TestReport");
  const designerRef = useRef();
  const requestOptions = {
    host: "https://localhost:54114/",
    getDesignerModelAction: "DXXRD/GetDesignerModel",
    // Add other necessary options here
  };

  useEffect(() => {
    const designer = new DxReportDesigner(designerRef.current, { 
      reportUrl, 
      requestOptions,
      callbacks: {
        customizeMenuActions: function(s, e) {
          // Customize menu actions if needed
        },
        customizeParameterEditors: function(s, e) {
          // Customize parameter editors if needed
        }
      }
    });
    designer.render();
    return () => designer.dispose();
  }, []);

  return <div ref={designerRef} style={{ width: '100%', height: '100vh' }}></div>;
}

export default ReportDesigner;