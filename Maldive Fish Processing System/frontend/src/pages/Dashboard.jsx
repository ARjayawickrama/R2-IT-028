import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductionChart from '../components/charts/ProductionChart';
import QualityGauge from '../components/charts/QualityGauge';
import SystemHealthChart from '../components/charts/SystemHealthChart';
import ChamberStatusChart from '../components/charts/ChamberStatusChart';
import SystemHealthDashboard from '../components/SystemHealthDashboard';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState("24h");
  const [exportFormat, setExportFormat] = useState("csv");
  const [showExportModal, setShowExportModal] = useState(false);
  const [systemHealth, setSystemHealth] = useState(97.05);
  
  // User Profile states
  const [userProfile, setUserProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Export functionality
  const handleExport = (format, data) => {
    let content, mimeType, fileName;
    
    switch(format) {
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        fileName = `export_${Date.now()}.csv`;
        break;
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileName = `export_${Date.now()}.json`;
        break;
      case 'excel':
        content = convertToExcel(data);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `export_${Date.now()}.xlsx`;
        break;
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (!data || !data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const convertToExcel = (data) => {
    return convertToCSV(data);
  };

  // User Profile functions
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      } else {
        const errorData = await response.json();
        console.error('Profile fetch error:', response.status, errorData);
        setUserProfile({
          name: 'Test User',
          email: 'test@example.com',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile({
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Password changed successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error changing password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth(prev => Math.max(85, Math.min(100, prev + (Math.random() - 0.5) * 2)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const productionData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Chamber A',
        data: [65, 72, 78, 85, 89, 92, 88],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Chamber B',
        data: [58, 65, 70, 75, 82, 85, 80],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Chamber C',
        data: [45, 52, 58, 65, 70, 68, 62],
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.4
      },
      {
        label: 'Chamber D',
        data: [70, 75, 82, 88, 85, 90, 86],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4
      }
    ]
  };

  const qualityMetrics = {
    labels: ['Temperature', 'Humidity', 'Salt Content', 'pH Level', 'Processing Time'],
    datasets: [{
      label: 'Current Values',
      data: [92, 88, 95, 90, 87],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ]
    }]
  };

  const chamberData = [
    { id: 1, name: "Chamber A", temp: 2.4, humidity: 78, status: "active", efficiency: 94, operator: "John Doe" },
    { id: 2, name: "Chamber B", temp: 1.8, humidity: 82, status: "active", efficiency: 88, operator: "Jane Smith" },
    { id: 3, name: "Chamber C", temp: 3.2, humidity: 65, status: "warning", efficiency: 76, operator: "Mike Johnson" },
    { id: 4, name: "Chamber D", temp: 2.1, humidity: 74, status: "maintenance", efficiency: 92, operator: "Sarah Wilson" },
  ];

  const recentActivities = [
    { id: 1, action: "Temperature threshold exceeded", chamber: "Chamber C", time: "5 min ago", severity: "warning" },
    { id: 2, action: "Energy spike detected", chamber: "Chamber B", time: "15 min ago", severity: "info" },
    { id: 3, action: "Maintenance completed", chamber: "Chamber D", time: "1 hour ago", severity: "success" },
    { id: 4, action: "Quality check passed", chamber: "Chamber A", time: "2 hours ago", severity: "success" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'maintenance': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full bg-gray-100 p-4 overflow-auto">
      {/* Desktop Application Toolbar */}
      <div className="bg-white border border-gray-300 rounded-t-lg px-4 py-2 flex items-center justify-between mb-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">🐟</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">FishGo Dashboard</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 Overview
            </button>
                        <button 
              onClick={() => setActiveTab('reports')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTab === 'reports' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📈 Reports
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTab === 'system' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⚙️ System
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
            🔄 Refresh
          </button>
          <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
            ⬇ Export
          </button>
          <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Desktop Panel - KPI Overview */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm font-semibold text-gray-800">KPI Overview Panel</span>
              </div>
              <div className="flex items-center space-x-1">
                <button className="w-4 h-4 bg-gray-300 rounded hover:bg-gray-400 transition-colors"></button>
                <button className="w-4 h-4 bg-gray-300 rounded hover:bg-gray-400 transition-colors"></button>
                <button className="w-4 h-4 bg-gray-300 rounded hover:bg-gray-400 transition-colors"></button>
              </div>
            </div>
            {/* Panel Content */}
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">+12.5%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">2,847</h3>
              <p className="text-xs text-gray-600 mt-1">Total Production (kg)</p>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">+3.2%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">93.8%</h3>
              <p className="text-xs text-gray-600 mt-1">Quality Score</p>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">-5.1%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">342</h3>
              <p className="text-xs text-gray-600 mt-1">Energy Usage (kW)</p>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">+8.7%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">24.5h</h3>
              <p className="text-xs text-gray-600 mt-1">Processing Time</p>
            </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Production Trends</h3>
                <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  ⚙️
                </button>
              </div>
              <ProductionChart data={productionData} />
            </div>

            <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Quality Metrics</h3>
                <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  ⚙️
                </button>
              </div>
              <QualityGauge data={qualityMetrics} />
            </div>
          </div>

          {/* System Health Dashboard */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">System Health</h3>
              <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                ⚙️
              </button>
            </div>
            <SystemHealthDashboard health={systemHealth} />
          </div>
        </div>
      )}

      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
                <p className="text-sm text-gray-600 mt-1">View your account details and manage security</p>
              </div>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <span className="text-lg">🔐</span>
                Change Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold mr-6">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{userProfile?.name || 'Loading...'}</h4>
                  <p className="text-gray-600">{userProfile?.email || 'Loading...'}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Active Account
                    </span>
                    <span className="text-sm text-gray-500">
                      Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {userProfile?.name || 'Loading...'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {userProfile?.email || 'Loading...'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Loading...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <h4 className="font-medium text-gray-900">Password</h4>
                    <p className="text-sm text-gray-600">Last changed recently</p>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Change Password
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">System Health & Monitoring</h2>
                <p className="text-sm text-gray-600 mt-1">Monitor system performance and alerts</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 flex items-center gap-2">
                  <span className="text-lg">🔧</span>
                  Maintenance
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  Diagnostics
                </button>
              </div>
            </div>
          </div>

          {/* System Health Dashboard */}
          <SystemHealthDashboard health={systemHealth} />

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.severity === 'success' ? 'bg-green-500' :
                        activity.severity === 'warning' ? 'bg-yellow-500' :
                        activity.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.chamber}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
                <p className="text-sm text-gray-600 mt-1">Generate and export detailed reports</p>
              </div>
              <button 
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <span className="text-lg">📊</span>
                Generate Report
              </button>
            </div>
          </div>

          {/* Report Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Production Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Comprehensive production metrics and trends</p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Generate
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Quality Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Quality control and compliance metrics</p>
              <button className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                Generate
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Energy Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Energy consumption and efficiency analysis</p>
              <button className="w-full px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700">
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Range</label>
                  <select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Export Format</label>
                  <select 
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleExport(exportFormat, chamberData);
                    setShowExportModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
