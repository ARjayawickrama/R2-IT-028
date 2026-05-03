import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RightSideNotificationBar from "./RightSideNotificationBar";
import NotificationBar from "./NotificationBar";

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.dropdown-trigger')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setActiveDropdown(null);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Desktop Application Window */}
      <div className="flex-1 flex flex-col bg-white rounded-t-lg shadow-2xl overflow-hidden">
      
        {/* Desktop Menu Bar */}
        <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
          <div className="flex items-center space-x-1">
            {/* File Menu */}
           
            {/* Edit Menu */}
         
        


            {/* Tools Menu */}
            <div className="relative">
              <button 
                onClick={() => toggleDropdown('toolsMenu')}
                className="dropdown-trigger px-3 py-1 text-sm text-gray-700 hover:bg-white hover:border border border-transparent hover:border-gray-300 rounded transition-colors font-medium"
              >
                🛠️ Tools
              </button>
              {activeDropdown === 'toolsMenu' && (
                <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => { handleNavigation('/boile-control'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⚡ Fish Detection
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🧪 Quality Analysis
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⚡ Energy Monitor
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Data Analytics
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📈 Performance Monitor
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🛠️ System Tools
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🧹 Maintenance
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reports Menu */}
            <div className="relative">
              <button 
                onClick={() => toggleDropdown('reports')}
                className="dropdown-trigger px-3 py-1 text-sm text-gray-700 hover:bg-white hover:border border border-transparent hover:border-gray-300 rounded transition-colors font-medium"
              >
                📊 Reports
              </button>
              {activeDropdown === 'reports' && (
                <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📈 Production Report
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🐟 Quality Report
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⚡ Energy Report
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📅 Daily Summary
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Weekly Analysis
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📈 Monthly Report
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📤 Export Reports
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📋 Report Templates
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative">
              <button 
                onClick={() => toggleDropdown('helpMenu')}
                className="dropdown-trigger px-3 py-1 text-sm text-gray-700 hover:bg-white hover:border border border-transparent hover:border-gray-300 rounded transition-colors font-medium"
              >
                ❓ Help
              </button>
              {activeDropdown === 'helpMenu' && (
                <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📖 User Guide
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🔍 Search Help
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎥 Video Tutorials
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      💬 Contact Support
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📧 Send Feedback
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ℹ️ About
                    </button>
                    <button
                      onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🔄 Check Updates
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Status Bar */}
        <div className="bg-gray-200 border-b border-gray-300 px-4 py-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-600">🐟 FishGo Professional</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-600">Status: Ready</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-600">System: Online</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-600">📊 CPU: 45%</span>
            <span className="text-xs text-gray-600">💾 RAM: 2.1GB</span>
            <span className="text-xs text-gray-600">🌐 Network: Connected</span>
            <span className="text-xs text-gray-600">🕐 {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Logo and Navigation */}
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Logo */}
                <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">🐟</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">FishGo</span>
                </div>

  <div className="ml-8 relative pl-6 border-l-4 border-indigo-400 rounded-l-2xl group">
  {/* Optional: subtle gradient overlay on left edge */}
  
  
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <span className="text-sm font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        {user?.name?.split(' ')[0] || 'there'}
      </span>
    </div>
    
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        Operational
      </span>
      <span className="text-gray-400 text-xs">·</span>
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Updated just now
      </span>
    </div>
  </div>
</div>
              </div>

              {/* Right side - Notifications and Profile */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="flex items-center space-x-2">
                  <NotificationBar />
                  <RightSideNotificationBar />
                </div>

                {/* Profile Dropdown */}
                <div className="relative dropdown-menu">
                  <button
                    onClick={() => toggleDropdown('profile')}
                    className="dropdown-trigger flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-300 transition-all"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </button>
                  {activeDropdown === 'profile' && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                      <div className="py-1">
                        {/* User Info Header */}
                        <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 bg-gray-50">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            {user?.name || 'User'}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">{user?.email || 'user@example.com'}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ● Active
                            </span>
                            <span className="text-xs text-gray-400">Professional</span>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-1">
                          <button
                            onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3">👤</span>
                            My Profile
                          </button>
                          <button
                            onClick={() => { 
                              navigate('/dashboard'); 
                              setTimeout(() => {
                                const profileTab = document.querySelector('[data-tab="profile"]');
                                if (profileTab) {
                                  profileTab.click();
                                }
                              }, 100);
                              setActiveDropdown(null); 
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3">⚙️</span>
                            Account Settings
                          </button>
                          <button
                            onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3">🔔</span>
                            Notifications
                          </button>
                          <button
                            onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3">🔐</span>
                            Security
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => { handleNavigation('/dashboard'); setActiveDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <span className="mr-3">❓</span>
                            Help & Support
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <span className="mr-3">🚪</span>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="md:hidden">
              <div className="fixed inset-0 z-40 flex">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)}></div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    >
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                    <div className="flex-shrink-0 flex items-center px-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">🐟</span>
                      </div>
                      <span className="ml-2 text-xl font-bold text-gray-900">FishGo</span>
                    </div>
                    <nav className="mt-5 px-2 space-y-1">
                      <button
                        onClick={() => { handleNavigation('/dashboard'); setIsSidebarOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        📊 Dashboard
                      </button>
                      <button
                        onClick={() => { handleNavigation('/dried-fish-quality'); setIsSidebarOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        🐟 Dried Fish Quality
                      </button>
                      <button
                        onClick={() => { handleNavigation('/boile-control'); setIsSidebarOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        ⚡ Mechanical Salt Control
                      </button>
                      <button
                        onClick={() => { handleNavigation('/environmental-monitoring'); setIsSidebarOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        🌡️ Environmental Monitoring
                      </button>
                      <button
                        onClick={() => { handleNavigation('/raw-fish-quality'); setIsSidebarOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        🐠 Raw Fish Quality
                      </button>
                      <button
                        onClick={() => { handleNavigation('/system-settings'); setIsSidebarOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        🔧 System Settings
                      </button>
                    </nav>
                  </div>
                  <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar Panel */}
          <div className="w-64 bg-gray-50 border-r border-gray-300 flex flex-col">
            {/* Sidebar Header */}
            {/* <div className="bg-white border-b border-gray-300 p-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🐟</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">Navigation Panel</span>
              </div>
            </div> */}

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-3 space-y-2">
              <button 
                onClick={() => handleNavigation('/dashboard')}
                className="w-full text-left px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md border border-blue-200 font-semibold"
              >
                📊 Dashboard Overview
              </button>

              <button 
                onClick={() => handleNavigation('/dried-fish-quality')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🐟 Dried Fish Quality
              </button>

              <button
                onClick={() => handleNavigation('/boile-control')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                ⚡ Mechanical Salt Control
              </button>

              <button 
                onClick={() => handleNavigation('/environmental-monitoring')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🌡️ Environmental Monitoring
              </button>

              <button 
                onClick={() => handleNavigation('/raw-fish-quality')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🐠 Raw Fish Quality
              </button>
              <button 
                onClick={() => handleNavigation('/system-settings')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                🔧 System Settings
              </button>
            </nav>

            {/* Sidebar Footer */}
            <div className="bg-white border-t border-gray-300 p-3">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-medium">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>License:</span>
                  <span className="font-medium">Professional</span>
                </div>
                <div className="flex justify-between">
                  <span>Server:</span>
                  <span className="font-medium text-green-600">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;