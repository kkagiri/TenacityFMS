import { useEffect, useRef } from "react";

import { DxReportDesigner } from 'devexpress-reporting/dx-reportdesigner';
import * as ko from 'knockout';
import 'devexpress-reporting/dist/css/dx-reportdesigner.css';

const VehicleConsumptionReportDesigner = () => {
    const designerRef = useRef(null);
   const reportUrl = ko.observable("VehicleConsumption");
    //const reportUrl = 'VehicleConsumptionReport';

    const requestOptions = {
      host: "http://localhost:7009/",
      getDesignerModelAction: "DXXRD/VehicleConsumptionReport"
    };

    useEffect(() => {
        const designer = new DxReportDesigner(designerRef.current, { reportUrl, requestOptions });
      designer.render();
  
      return () => {
        designer.dispose();
      };
    }, []);
  
    return <div ref={designerRef} style={{ width: "100%", height: "1000px"  }}></div>;
  };

export default VehicleConsumptionReportDesigner;