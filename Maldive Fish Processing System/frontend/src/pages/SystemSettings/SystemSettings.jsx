import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SystemSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      systemName: 'FishGo Professional',
      company: 'Maldive Fish Processing Co.',
      timezone: 'Indian/Maldives',
      language: 'English',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24-hour'
    },
    quality: {
      moistureMin: 75,
      moistureMax: 85,
      saltMin: 10,
      saltMax: 15,
      textureMin: 80,
      textureMax: 100,
      autoQualityCheck: true,
      alertThreshold: 85
    },
    environmental: {
      tempMin: 25,
      tempMax: 30,
      humidityMin: 60,
      humidityMax: 70,
      co2Min: 350,
      co2Max: 500,
      ventilationAuto: true,
      alertFrequency: 5
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true,
      qualityAlerts: true,
      environmentalAlerts: true,
      systemAlerts: true,
      reportFrequency: 'daily'
    },
    security: {
      sessionTimeout: 30,
      passwordExpiry: 90,
      twoFactorAuth: false,
      ipWhitelist: false,
      auditLog: true,
      backupFrequency: 'daily'
    }
  });

  const [saveStatus, setSaveStatus] = useState('');

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = () => {
    setSaveStatus('Saving...');
    setTimeout(() => {
      setSaveStatus('Settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1000);
  };

  const handleReset = () => {
    setSaveStatus('Resetting...');
    setTimeout(() => {
      setSaveStatus('Settings reset to defaults');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'quality', name: 'Quality Control', icon: '🐟' },
    { id: 'environmental', name: 'Environmental', icon: '🌡️' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔧 System Settings</h1>
            <p className="text-gray-600 mt-1">Configure system parameters and preferences</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveStatus.includes('success') ? 'bg-green-100 text-green-700' :
          saveStatus.includes('error') ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {saveStatus}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings Categories</h2>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                      <input
                        type="text"
                        value={settings.general.systemName}
                        onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={settings.general.company}
                        onChange={(e) => handleSettingChange('general', 'company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Indian/Maldives">Indian/Maldives</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                        <option value="Asia/Singapore">Asia/Singapore</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="English">English</option>
                        <option value="Dhivehi">Dhivehi</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                      <select
                        value={settings.general.dateFormat}
                        onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="24-hour">24-hour</option>
                        <option value="12-hour">12-hour</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Control Settings */}
              {activeTab === 'quality' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Quality Control Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Quality Thresholds</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Moisture Content (%)</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={settings.quality.moistureMin}
                              onChange={(e) => handleSettingChange('quality', 'moistureMin', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Min"
                            />
                            <span className="self-center text-gray-500">-</span>
                            <input
                              type="number"
                              value={settings.quality.moistureMax}
                              onChange={(e) => handleSettingChange('quality', 'moistureMax', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Salt Content (%)</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={settings.quality.saltMin}
                              onChange={(e) => handleSettingChange('quality', 'saltMin', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Min"
                            />
                            <span className="self-center text-gray-500">-</span>
                            <input
                              type="number"
                              value={settings.quality.saltMax}
                              onChange={(e) => handleSettingChange('quality', 'saltMax', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Texture Score</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={settings.quality.textureMin}
                              onChange={(e) => handleSettingChange('quality', 'textureMin', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Min"
                            />
                            <span className="self-center text-gray-500">-</span>
                            <input
                              type="number"
                              value={settings.quality.textureMax}
                              onChange={(e) => handleSettingChange('quality', 'textureMax', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alert Threshold (%)</label>
                          <input
                            type="number"
                            value={settings.quality.alertThreshold}
                            onChange={(e) => handleSettingChange('quality', 'alertThreshold', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Automated Features</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.quality.autoQualityCheck}
                            onChange={(e) => handleSettingChange('quality', 'autoQualityCheck', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Enable automatic quality checks</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Environmental Settings */}
              {activeTab === 'environmental' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Environmental Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Environmental Thresholds</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={settings.environmental.tempMin}
                              onChange={(e) => handleSettingChange('environmental', 'tempMin', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Min"
                            />
                            <span className="self-center text-gray-500">-</span>
                            <input
                              type="number"
                              value={settings.environmental.tempMax}
                              onChange={(e) => handleSettingChange('environmental', 'tempMax', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Humidity (%)</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={settings.environmental.humidityMin}
                              onChange={(e) => handleSettingChange('environmental', 'humidityMin', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Min"
                            />
                            <span className="self-center text-gray-500">-</span>
                            <input
                              type="number"
                              value={settings.environmental.humidityMax}
                              onChange={(e) => handleSettingChange('environmental', 'humidityMax', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CO₂ Level (ppm)</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={settings.environmental.co2Min}
                              onChange={(e) => handleSettingChange('environmental', 'co2Min', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Min"
                            />
                            <span className="self-center text-gray-500">-</span>
                            <input
                              type="number"
                              value={settings.environmental.co2Max}
                              onChange={(e) => handleSettingChange('environmental', 'co2Max', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alert Frequency (minutes)</label>
                          <input
                            type="number"
                            value={settings.environmental.alertFrequency}
                            onChange={(e) => handleSettingChange('environmental', 'alertFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Automated Controls</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.environmental.ventilationAuto}
                            onChange={(e) => handleSettingChange('environmental', 'ventilationAuto', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Enable automatic ventilation control</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Channels</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications.emailAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Email alerts</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications.smsAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'smsAlerts', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">SMS alerts</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications.pushNotifications}
                            onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Push notifications</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Alert Types</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications.qualityAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'qualityAlerts', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Quality alerts</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications.environmentalAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'environmentalAlerts', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Environmental alerts</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications.systemAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">System alerts</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Report Frequency</label>
                      <select
                        value={settings.notifications.reportFrequency}
                        onChange={(e) => handleSettingChange('notifications', 'reportFrequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Session Management</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                          <input
                            type="number"
                            value={settings.security.sessionTimeout}
                            onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                          <input
                            type="number"
                            value={settings.security.passwordExpiry}
                            onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Security Features</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.security.twoFactorAuth}
                            onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Two-factor authentication</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.security.ipWhitelist}
                            onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">IP whitelist restriction</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.security.auditLog}
                            onChange={(e) => handleSettingChange('security', 'auditLog', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Enable audit logging</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                      <select
                        value={settings.security.backupFrequency}
                        onChange={(e) => handleSettingChange('security', 'backupFrequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
