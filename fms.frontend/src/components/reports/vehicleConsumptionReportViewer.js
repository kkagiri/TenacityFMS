import React, { useEffect, useRef } from 'react';
import 'devexpress-reporting/'
import {DxReportViewer} from  'devexpress-reporting/dx-webdocumentviewer';
import 'devexpress-reporting/dist/css/dx-webdocumentviewer.css';
import * as ko from 'knockout'


const VehicleConsumptionReportViewer = () => {
    const viewerRef = useRef(null);
    //const reportURL = ko.observable("TestReport");

    const requestOptions = {
        host: "https://localhost:54114/",
        invokeAction: "DXXRDV/VehicleConsumptionReport"
      };
    useEffect(() => {
      const reportUrl = 'VehicleConsumptionReport';
      const viewer = new DxReportViewer(viewerRef.current, { reportUrl, requestOptions });
     
  
      viewer.render();
  
      return () => {
        viewer.dispose();
      };
    }, []);
  
    return <div ref={viewerRef} style={{ height: '100vh' }}></div>;
  };

export default VehicleConsumptionReportViewer;
