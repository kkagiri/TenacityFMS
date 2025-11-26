import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminRoute } from './utils/navigationHelper';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: 'fa-light fa-users',
      route: getAdminRoute('users'),
      color: 'tw-text-blue-600'
    },
    {
      title: 'Provider Management',
      description: 'Configure tracking providers and mappings',
      icon: 'fa-light fa-network-wired',
      route: getAdminRoute('providers'),
      color: 'tw-text-blue-700'
    },
    {
      title: 'Role Management',
      description: 'Configure user roles and access levels',
      icon: 'fa-light fa-shield',
      route: getAdminRoute('roles'),
      color: 'tw-text-purple-600'
    },
    {
      title: 'Tags Management',
      description: 'Manage system tags and categories',
      icon: 'fa-light fa-tags',
      route: getAdminRoute('tags'),
      color: 'tw-text-green-600'
    },
    {
      title: 'Site Management',
      description: 'Configure sites and locations',
      icon: 'fa-light fa-location-dot',
      route: getAdminRoute('sites'),
      color: 'tw-text-red-600'
    },
    {
      title: 'Tank Management',
      description: 'Manage fuel tanks and configurations',
      icon: 'fa-light fa-pump',
      route: getAdminRoute('tanks'),
      color: 'tw-text-yellow-600'
    },
    {
      title: 'PTS Device Management',
      description: 'Configure PTS devices and automation',
      icon: 'fa-light fa-server',
      route: getAdminRoute('ptsdevice'),
      color: 'tw-text-indigo-600'
    },
    {
      title: 'Notification Settings',
      description: 'Manage notification categories and policies',
      icon: 'fa-light fa-bell',
      route: getAdminRoute('notifications'),
      color: 'tw-text-teal-600'
    },
    {
      title: 'PTS Automation Config',
      description: 'Configure PTS automation settings',
      icon: 'fa-light fa-cog',
      route: getAdminRoute('ptsconfig'),
      color: 'tw-text-gray-600'
    },
    {
      title: 'System Configuration',
      description: 'Manage system-wide configuration settings',
      icon: 'fa-light fa-sliders',
      route: getAdminRoute('systemconfig'),
      color: 'tw-text-orange-600'
    },
    {
      title: 'Navigation Management',
      description: 'Manage system navigation and menus',
      icon: 'fa-light fa-compass',
      route: getAdminRoute('navigation'),
      color: 'tw-text-teal-600'
    },
    {
      title: 'Permissions Management',
      description: 'Configure system permissions',
      icon: 'fa-light fa-key',
      route: getAdminRoute('permissions'),
      color: 'tw-text-pink-600'
    },
    {
      title: 'PTS Service Control',
      description: 'Monitor and control PTS Windows Service',
      icon: 'fa-light fa-server',
      route: getAdminRoute('pts-service'),
      color: 'tw-text-cyan-600'
    },
    {
      title: 'Log Management',
      description: 'Download, view, and manage system log files',
      icon: 'fa-light fa-file-lines',
      route: getAdminRoute('logs'),
      color: 'tw-text-slate-600'
    }

  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Administration Dashboard</h1>
        <p className="admin-dashboard__subtitle">
          Manage system configuration, users, and access control
        </p>
      </div>

      <div className="admin-dashboard__grid">
        {adminFeatures.map((feature, index) => (
          <div
            key={index}
            className="admin-dashboard__card tw-bg-white tw-rounded-lg tw-shadow-md tw-border tw-border-gray-200 tw-p-6 tw-cursor-pointer tw-transition-all tw-duration-200 hover:tw-shadow-lg hover:tw-transform hover:tw-scale-105"
            onClick={() => navigate(feature.route)}
          >
            <div className="admin-dashboard__card-header">
              <i className={`${feature.icon} admin-dashboard__card-icon tw-text-2xl ${feature.color}`}></i>
              <h3 className="admin-dashboard__card-title">{feature.title}</h3>
            </div>
            <div className="admin-dashboard__card-body">
              <p className="admin-dashboard__card-description">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
