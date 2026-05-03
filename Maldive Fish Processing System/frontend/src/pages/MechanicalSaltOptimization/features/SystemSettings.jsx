import { useState, useEffect } from "react";

// ─── System Settings Component ────────────────────────────────────────────────────
export default function SystemSettings({ onSettingsChange, tanks, setTanks, cleaning, setCleaning }) {
  const [settings, setSettings] = useState({
    // System Configuration
    systemName: "Maldive Fish Processing System",
    location: "Main Facility",
    timezone: "UTC+5:30",
    
    // Tank Configuration
    tankSettings: {
      defaultWeight: 30,
      defaultTargetSalinity: 35,
      defaultTargetTemp: 30,
      maxWeight: 500,
      minWeight: 1,
      maxSalinity: 60,
      minSalinity: 10,
      maxTemp: 42,
      minTemp: 20,
    },
    
    // Threshold Settings
    thresholds: {
      temperature: {
        high: 36,
        critical: 40,
        low: 22,
        criticalLow: 18
      },
      ph: {
        high: 8.5,
        critical: 9.0,
        low: 6.5,
        criticalLow: 6.0
      },
      salinity: {
        high: 45,
        critical: 50,
        low: 25,
        criticalLow: 20
      },
      turbidity: {
        high: 0.25,
        critical: 0.35
      },
      filterLife: {
        low: 10,
        critical: 5
      }
    },
    
    // Control Settings
    controlSettings: {
      autoControl: true,
      updateInterval: 2500,
      saltCalculationPrecision: 3,
      alertMaxCount: 18,
      enableAutoAlerts: true,
      enableDataLogging: true,
      backupInterval: 300000, // 5 minutes
    },
    
    // Cleaning System Settings
    cleaningSettings: {
      defaultFilterPower: 75,
      defaultUVIntensity: 60,
      defaultFlowRate: 85,
      maxFilterPower: 100,
      maxUVIntensity: 100,
      maxFlowRate: 200,
      minFlowRate: 10
    },
    
    // Notification Settings
    notificationSettings: {
      emailAlerts: false,
      smsAlerts: false,
      desktopNotifications: true,
      alertCooldown: 60000, // 1 minute
      criticalAlertOverride: true
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [activeTab, setActiveTab] = useState("tank");

  // Load settings from backend on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/system-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSaveStatus("Settings loaded successfully");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      setSaveStatus("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveStatus("Settings saved successfully");
        setTimeout(() => setSaveStatus(""), 3000);
        if (onSettingsChange) {
          onSettingsChange(settings);
        }
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings({
        systemName: "Maldive Fish Processing System",
        location: "Main Facility",
        timezone: "UTC+5:30",
        tankSettings: {
          defaultWeight: 30,
          defaultTargetSalinity: 35,
          defaultTargetTemp: 30,
          maxWeight: 500,
          minWeight: 1,
          maxSalinity: 60,
          minSalinity: 10,
          maxTemp: 42,
          minTemp: 20,
        },
        thresholds: {
          temperature: { high: 36, critical: 40, low: 22, criticalLow: 18 },
          ph: { high: 8.5, critical: 9.0, low: 6.5, criticalLow: 6.0 },
          salinity: { high: 45, critical: 50, low: 25, criticalLow: 20 },
          turbidity: { high: 0.25, critical: 0.35 },
          filterLife: { low: 10, critical: 5 }
        },
        controlSettings: {
          autoControl: true,
          updateInterval: 2500,
          saltCalculationPrecision: 3,
          alertMaxCount: 18,
          enableAutoAlerts: true,
          enableDataLogging: true,
          backupInterval: 300000,
        },
        cleaningSettings: {
          defaultFilterPower: 75,
          defaultUVIntensity: 60,
          defaultFlowRate: 85,
          maxFilterPower: 100,
          maxUVIntensity: 100,
          maxFlowRate: 200,
          minFlowRate: 10
        },
        notificationSettings: {
          emailAlerts: false,
          smsAlerts: false,
          desktopNotifications: true,
          alertCooldown: 60000,
          criticalAlertOverride: true
        }
      });
      setSaveStatus("Settings reset to defaults");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const updateSetting = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const updateNestedSetting = (category, subcategory, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...prev[category][subcategory],
          [field]: value
        }
      }
    }));
  };

  const InputField = ({ label, value, onChange, type = "text", min, max, step = "1", unit = "" }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ 
        display: "block", 
        fontSize: 11, 
        color: "#666", 
        marginBottom: 4,
        fontFamily: "'Courier New',monospace",
        fontWeight: 600
      }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          min={min}
          max={max}
          step={step}
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "1px solid #c5dff0",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "'Courier New',monospace",
            fontWeight: 600,
            background: "#fff",
            color: "#2a4a6a"
          }}
        />
        {unit && (
          <span style={{ 
            fontSize: 11, 
            color: "#666", 
            fontFamily: "'Courier New',monospace",
            minWidth: 30
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );

  const ToggleField = ({ label, value, onChange }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 10,
        cursor: "pointer"
      }}>
        <span style={{ 
          fontSize: 11, 
          color: "#666", 
          fontFamily: "'Courier New',monospace",
          fontWeight: 600
        }}>
          {label}
        </span>
        <div
          onClick={() => onChange(!value)}
          style={{
            width: 44,
            height: 22,
            borderRadius: 11,
            background: value ? "#1D9E75" : "#ccc",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.25s"
          }}
        >
          <div style={{
            position: "absolute",
            top: 2,
            left: value ? 22 : 2,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#fff",
            transition: "left 0.25s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
          }} />
        </div>
        <span style={{ 
          fontSize: 10, 
          fontWeight: 700, 
          color: value ? "#1D9E75" : "#aaa",
          fontFamily: "'Courier New',monospace"
        }}>
          {value ? "ON" : "OFF"}
        </span>
      </label>
    </div>
  );

  const TabButton = ({ id, label, isActive }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: "8px 16px",
        fontSize: 11,
        fontWeight: 700,
        background: isActive ? "#1D9E75" : "#f8fbfe",
        color: isActive ? "#fff" : "#666",
        border: `1.5px solid ${isActive ? "#1D9E75" : "#c5dff0"}`,
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "'Courier New',monospace",
        letterSpacing: 0.3,
        transition: "all 0.2s"
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #c5dff0",
      borderRadius: 14,
      padding: "16px 18px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      fontFamily: "'Segoe UI', 'Arial', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        borderBottom: "1px solid #e8f0f8",
        paddingBottom: 12
      }}>
        <div style={{
          fontWeight: 800,
          fontSize: 14,
          color: "#2a4a6a",
          fontFamily: "'Courier New',monospace",
          letterSpacing: 0.5
        }}>
          ⚙️ SYSTEM SETTINGS
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={resetSettings}
            style={{
              padding: "6px 12px",
              fontSize: 10,
              fontWeight: 700,
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #dc2626",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "'Courier New',monospace"
            }}
          >
            RESET
          </button>
          <button
            onClick={saveSettings}
            disabled={isLoading}
            style={{
              padding: "6px 12px",
              fontSize: 10,
              fontWeight: 700,
              background: isLoading ? "#ccc" : "#1D9E75",
              color: "#fff",
              border: "1px solid #1D9E75",
              borderRadius: 6,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "'Courier New',monospace"
            }}
          >
            {isLoading ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {saveStatus && (
        <div style={{
          padding: "8px 12px",
          marginBottom: 12,
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: saveStatus.includes("success") ? "#E1F5EE" : "#fef2f2",
          color: saveStatus.includes("success") ? "#0F6E56" : "#dc2626",
          border: `1px solid ${saveStatus.includes("success") ? "#5DCAA5" : "#dc2626"}`,
          fontFamily: "'Courier New',monospace"
        }}>
          {saveStatus}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <TabButton id="tank" label="TANK CONFIG" isActive={activeTab === "tank"} />
        <TabButton id="thresholds" label="THRESHOLDS" isActive={activeTab === "thresholds"} />
        <TabButton id="control" label="CONTROL" isActive={activeTab === "control"} />
        <TabButton id="cleaning" label="CLEANING" isActive={activeTab === "cleaning"} />
        <TabButton id="notifications" label="NOTIFICATIONS" isActive={activeTab === "notifications"} />
        <TabButton id="system" label="SYSTEM" isActive={activeTab === "system"} />
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 400 }}>
        {/* Tank Configuration Tab */}
        {activeTab === "tank" && (
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#2a6fa8",
              marginBottom: 12,
              fontFamily: "'Courier New',monospace"
            }}>
              TANK DEFAULT SETTINGS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <InputField
                  label="Default Weight"
                  value={settings.tankSettings.defaultWeight}
                  onChange={(v) => updateSetting('tankSettings', 'defaultWeight', v)}
                  type="number"
                  min={1}
                  max={500}
                  unit="kg"
                />
                <InputField
                  label="Default Target Salinity"
                  value={settings.tankSettings.defaultTargetSalinity}
                  onChange={(v) => updateSetting('tankSettings', 'defaultTargetSalinity', v)}
                  type="number"
                  min={10}
                  max={60}
                  step="0.5"
                  unit="PPT"
                />
                <InputField
                  label="Default Target Temperature"
                  value={settings.tankSettings.defaultTargetTemp}
                  onChange={(v) => updateSetting('tankSettings', 'defaultTargetTemp', v)}
                  type="number"
                  min={20}
                  max={42}
                  unit="°C"
                />
              </div>
              <div>
                <InputField
                  label="Max Weight"
                  value={settings.tankSettings.maxWeight}
                  onChange={(v) => updateSetting('tankSettings', 'maxWeight', v)}
                  type="number"
                  min={100}
                  max={1000}
                  unit="kg"
                />
                <InputField
                  label="Max Salinity"
                  value={settings.tankSettings.maxSalinity}
                  onChange={(v) => updateSetting('tankSettings', 'maxSalinity', v)}
                  type="number"
                  min={40}
                  max={80}
                  unit="PPT"
                />
                <InputField
                  label="Max Temperature"
                  value={settings.tankSettings.maxTemp}
                  onChange={(v) => updateSetting('tankSettings', 'maxTemp', v)}
                  type="number"
                  min={35}
                  max={60}
                  unit="°C"
                />
              </div>
            </div>
          </div>
        )}

        {/* Thresholds Tab */}
        {activeTab === "thresholds" && (
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#2a6fa8",
              marginBottom: 12,
              fontFamily: "'Courier New',monospace"
            }}>
              ALERT THRESHOLDS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 11, color: "#666", marginBottom: 8, fontFamily: "'Courier New',monospace" }}>Temperature (°C)</h4>
                <InputField label="High" value={settings.thresholds.temperature.high} onChange={(v) => updateNestedSetting('thresholds', 'temperature', 'high', v)} type="number" min={30} max={40} />
                <InputField label="Critical" value={settings.thresholds.temperature.critical} onChange={(v) => updateNestedSetting('thresholds', 'temperature', 'critical', v)} type="number" min={35} max={45} />
                <InputField label="Low" value={settings.thresholds.temperature.low} onChange={(v) => updateNestedSetting('thresholds', 'temperature', 'low', v)} type="number" min={18} max={25} />
              </div>
              <div>
                <h4 style={{ fontSize: 11, color: "#666", marginBottom: 8, fontFamily: "'Courier New',monospace" }}>pH Levels</h4>
                <InputField label="High" value={settings.thresholds.ph.high} onChange={(v) => updateNestedSetting('thresholds', 'ph', 'high', v)} type="number" min={7.5} max={9} step="0.1" />
                <InputField label="Critical" value={settings.thresholds.ph.critical} onChange={(v) => updateNestedSetting('thresholds', 'ph', 'critical', v)} type="number" min={8} max={9.5} step="0.1" />
                <InputField label="Low" value={settings.thresholds.ph.low} onChange={(v) => updateNestedSetting('thresholds', 'ph', 'low', v)} type="number" min={6} max={7} step="0.1" />
              </div>
            </div>
          </div>
        )}

        {/* Control Tab */}
        {activeTab === "control" && (
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#2a6fa8",
              marginBottom: 12,
              fontFamily: "'Courier New',monospace"
            }}>
              CONTROL SYSTEM SETTINGS
            </div>
            <ToggleField
              label="Auto Control Enabled"
              value={settings.controlSettings.autoControl}
              onChange={(v) => updateSetting('controlSettings', 'autoControl', v)}
            />
            <InputField
              label="Update Interval"
              value={settings.controlSettings.updateInterval}
              onChange={(v) => updateSetting('controlSettings', 'updateInterval', v)}
              type="number"
              min={1000}
              max={10000}
              step={100}
              unit="ms"
            />
            <InputField
              label="Salt Calculation Precision"
              value={settings.controlSettings.saltCalculationPrecision}
              onChange={(v) => updateSetting('controlSettings', 'saltCalculationPrecision', v)}
              type="number"
              min={1}
              max={6}
            />
            <ToggleField
              label="Enable Auto Alerts"
              value={settings.controlSettings.enableAutoAlerts}
              onChange={(v) => updateSetting('controlSettings', 'enableAutoAlerts', v)}
            />
            <ToggleField
              label="Enable Data Logging"
              value={settings.controlSettings.enableDataLogging}
              onChange={(v) => updateSetting('controlSettings', 'enableDataLogging', v)}
            />
          </div>
        )}

        {/* Cleaning Tab */}
        {activeTab === "cleaning" && (
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#2a6fa8",
              marginBottom: 12,
              fontFamily: "'Courier New',monospace"
            }}>
              CLEANING SYSTEM SETTINGS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <InputField
                  label="Default Filter Power"
                  value={settings.cleaningSettings.defaultFilterPower}
                  onChange={(v) => updateSetting('cleaningSettings', 'defaultFilterPower', v)}
                  type="number"
                  min={0}
                  max={100}
                  unit="%"
                />
                <InputField
                  label="Default UV Intensity"
                  value={settings.cleaningSettings.defaultUVIntensity}
                  onChange={(v) => updateSetting('cleaningSettings', 'defaultUVIntensity', v)}
                  type="number"
                  min={0}
                  max={100}
                  unit="%"
                />
              </div>
              <div>
                <InputField
                  label="Default Flow Rate"
                  value={settings.cleaningSettings.defaultFlowRate}
                  onChange={(v) => updateSetting('cleaningSettings', 'defaultFlowRate', v)}
                  type="number"
                  min={10}
                  max={200}
                  unit="L/m"
                />
                <InputField
                  label="Max Flow Rate"
                  value={settings.cleaningSettings.maxFlowRate}
                  onChange={(v) => updateSetting('cleaningSettings', 'maxFlowRate', v)}
                  type="number"
                  min={100}
                  max={500}
                  unit="L/m"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#2a6fa8",
              marginBottom: 12,
              fontFamily: "'Courier New',monospace"
            }}>
              NOTIFICATION SETTINGS
            </div>
            <ToggleField
              label="Desktop Notifications"
              value={settings.notificationSettings.desktopNotifications}
              onChange={(v) => updateSetting('notificationSettings', 'desktopNotifications', v)}
            />
            <ToggleField
              label="Email Alerts"
              value={settings.notificationSettings.emailAlerts}
              onChange={(v) => updateSetting('notificationSettings', 'emailAlerts', v)}
            />
            <ToggleField
              label="SMS Alerts"
              value={settings.notificationSettings.smsAlerts}
              onChange={(v) => updateSetting('notificationSettings', 'smsAlerts', v)}
            />
            <ToggleField
              label="Critical Alert Override"
              value={settings.notificationSettings.criticalAlertOverride}
              onChange={(v) => updateSetting('notificationSettings', 'criticalAlertOverride', v)}
            />
            <InputField
              label="Alert Cooldown"
              value={settings.notificationSettings.alertCooldown}
              onChange={(v) => updateSetting('notificationSettings', 'alertCooldown', v)}
              type="number"
              min={30000}
              max={300000}
              step={1000}
              unit="ms"
            />
          </div>
        )}

        {/* System Tab */}
        {activeTab === "system" && (
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: "#2a6fa8",
              marginBottom: 12,
              fontFamily: "'Courier New',monospace"
            }}>
              SYSTEM INFORMATION
            </div>
            <InputField
              label="System Name"
              value={settings.systemName}
              onChange={(v) => updateSetting('systemName', v)}
            />
            <InputField
              label="Location"
              value={settings.location}
              onChange={(v) => updateSetting('location', v)}
            />
            <InputField
              label="Timezone"
              value={settings.timezone}
              onChange={(v) => updateSetting('timezone', v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
