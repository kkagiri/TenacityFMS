import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReportDesigner = () => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState('');
    const [layoutData, setLayoutData] = useState('');
  
};

export default ReportDesigner;