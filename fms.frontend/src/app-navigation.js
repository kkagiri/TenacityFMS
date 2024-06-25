export const navigation = [
  {
    text: 'Dashboard',
    path: '/home',
    icon: 'home'
  },
  {
    text: 'ATG',
    path: '/ATG',
    icon: 'card'
  },
  {
    text: 'Fuel Refill',
    path: '/manualrefill',
    icon: 'edit'
  },
  {
    text: 'Vehicles',
    path: '/vehicles',
    icon: 'car'
  }
  ,
  {
    text: 'Data Analysis',
    path: '/Analysis',
    icon: 'event'
  }
  ,
  
   {
    text: 'Reports',
    path: '',
    icon: 'chart',
    items: [
      {
        text: 'Vehicle Consumption',
        path: '/vehicleConsumption',
        icon: ''
      }, {
        text: 'Daily Fuel Refill',
        path: '/FuelRefill',
        icon: ''
      },
      {
        text: 'ATG Fuel Issues',
        path: '/ATGFuelIssues',
        icon: ''
      }
    ]
  }
,
  {
    text: 'Employees',
    path: '/employees',
    icon: 'group'
  },
  {
    text: 'Device Issues',
    path: '/Issues',
    icon: 'checklist'
  },
  {
    text: 'Site Activities',
    path: '/siteActivity',
    icon: 'clock'
  },
  {
   text: 'Admin',
   path: '',
   icon: 'preferences',
   items: [
    {
      text: 'ATG',
      path: '/ATGManagement',
      icon: ''
    },
     {
       text: 'Users',
       path: '/users',
       icon: ''
     },
     {
      text: 'Expected Average',
      path: '/expectedAverage',
      icon: ''
    },
     {
      text: 'Roles',
      path: '/Roles',
      icon: ''
    },
    {
      text: 'Sites',
      path: '/Site',
      icon: ''
    },
    {
      text: 'Report Management',
      path: '/Report',
      icon: ''
    },

    {
      text: 'Device Management',
      path: '/Device',
      icon: ''
    },
    {
      text: 'Issues Management',
      path: '/IssuesManagement',
      icon: ''
    },
    {
      text: 'System Settings',
      path: '/system',
      icon: ''
    }
   ]
 }

  ];
