import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SystemSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    general: {
      systemName: 'FishGo Professional',
      version: 'v2.1.0',
      language: 'en',
      timezone: 'UTC+5:30',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      soundAlerts: true,
      autoRefresh: true,
      refreshInterval: 30
    },
    security: {
      sessionTimeout: 60,
      passwordExpiry: 90,
      twoFactorAuth: false,
      ipWhitelist: false,
      auditLogging: true
    },
    performance: {
      maxDataPoints: 1000,
      cacheSize: 100,
      compressionEnabled: true,
      backupFrequency: 'daily',
      retentionPeriod: 30
    },
    integration: {
      apiEnabled: true,
      webhookUrl: '',
      databaseBackup: true,
      cloudSync: false,
      exportFormat: 'csv'
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'integration', label: 'Integration', icon: '🔗' }
  ];

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage for demo
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      general: {
        systemName: 'FishGo Professional',
        version: 'v2.1.0',
        language: 'en',
        timezone: 'UTC+5:30',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        soundAlerts: true,
        autoRefresh: true,
        refreshInterval: 30
      },
      security: {
        sessionTimeout: 60,
        passwordExpiry: 90,
        twoFactorAuth: false,
        ipWhitelist: false,
        auditLogging: true
      },
      performance: {
        maxDataPoints: 1000,
        cacheSize: 100,
        compressionEnabled: true,
        backupFrequency: 'daily',
        retentionPeriod: 30
      },
      integration: {
        apiEnabled: true,
        webhookUrl: '',
        databaseBackup: true,
        cloudSync: false,
        exportFormat: 'csv'
      }
    };
    
    setSettings(defaultSettings);
    setHasChanges(false);
  };

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
          <input
            type="text"
            value={settings.general.systemName}
            onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
          <input
            type="text"
            value={settings.general.version}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={settings.general.language}
            onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="dv">Dhivehi</option>
            <option value="hi">Hindi</option>
            <option value="zh">Chinese</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC+5:30">UTC+5:30 (Maldives)</option>
            <option value="UTC+0">UTC+0 (GMT)</option>
            <option value="UTC+1">UTC+1 (CET)</option>
            <option value="UTC-5">UTC-5 (EST)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
          <select
            value={settings.general.dateFormat}
            onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
          <select
            value={settings.general.timeFormat}
            onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">24 Hour</option>
            <option value="12h">12 Hour (AM/PM)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Alert Preferences</h3>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Email Notifications</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.notifications.pushNotifications}
              onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Push Notifications</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.notifications.soundAlerts}
              onChange={(e) => handleSettingChange('notifications', 'soundAlerts', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sound Alerts</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.notifications.autoRefresh}
              onChange={(e) => handleSettingChange('notifications', 'autoRefresh', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto Refresh Dashboard</span>
          </label>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Refresh Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
            <input
              type="number"
              min="10"
              max="300"
              value={settings.notifications.refreshInterval}
              onChange={(e) => handleSettingChange('notifications', 'refreshInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Session Management</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              min="15"
              max="480"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
            <input
              type="number"
              min="30"
              max="365"
              value={settings.security.passwordExpiry}
              onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Security Features</h3>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Two-Factor Authentication</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.security.ipWhitelist}
              onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">IP Whitelist</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.security.auditLogging}
              onChange={(e) => handleSettingChange('security', 'auditLogging', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Audit Logging</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Data Management</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Data Points</label>
            <input
              type="number"
              min="100"
              max="10000"
              value={settings.performance.maxDataPoints}
              onChange={(e) => handleSettingChange('performance', 'maxDataPoints', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cache Size (MB)</label>
            <input
              type="number"
              min="10"
              max="1000"
              value={settings.performance.cacheSize}
              onChange={(e) => handleSettingChange('performance', 'cacheSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Backup & Retention</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
            <select
              value={settings.performance.backupFrequency}
              onChange={(e) => handleSettingChange('performance', 'backupFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period (days)</label>
            <input
              type="number"
              min="7"
              max="365"
              value={settings.performance.retentionPeriod}
              onChange={(e) => handleSettingChange('performance', 'retentionPeriod', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.performance.compressionEnabled}
              onChange={(e) => handleSettingChange('performance', 'compressionEnabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable Compression</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">API Configuration</h3>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.integration.apiEnabled}
              onChange={(e) => handleSettingChange('integration', 'apiEnabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable API</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
            <input
              type="url"
              value={settings.integration.webhookUrl}
              onChange={(e) => handleSettingChange('integration', 'webhookUrl', e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Data Export</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={settings.integration.exportFormat}
              onChange={(e) => handleSettingChange('integration', 'exportFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.integration.databaseBackup}
              onChange={(e) => handleSettingChange('integration', 'databaseBackup', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Database Backup</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.integration.cloudSync}
              onChange={(e) => handleSettingChange('integration', 'cloudSync', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Cloud Sync</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'performance':
        return renderPerformanceSettings();
      case 'integration':
        return renderIntegrationSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure system preferences and administrative settings</p>
      </div>

      {/* Save Status Alert */}
      {saveStatus && (
        <div className={`mb-6 p-4 rounded-md ${
          saveStatus === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {saveStatus === 'success' 
            ? '✅ Settings saved successfully!' 
            : '❌ Failed to save settings. Please try again.'}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {renderTabContent()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className={`px-6 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            hasChanges && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* System Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">User:</span> {user?.name || 'Unknown'}
          </div>
          <div>
            <span className="font-medium">Role:</span> {user?.role || 'Administrator'}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {new Date().toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Environment:</span> Production
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
