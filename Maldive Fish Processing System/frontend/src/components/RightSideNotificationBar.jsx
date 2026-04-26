import React, { useState, useEffect, useRef } from 'react';

const RightSideNotificationBar = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Temperature Alert',
      message: 'Chamber C temperature exceeded threshold by 2.5°C',
      time: '2 min ago',
      read: false,
      priority: 'high',
      source: 'Temperature Sensor',
      actions: ['View Details', 'Acknowledge'],
      chamber: 'Chamber C'
    },
    {
      id: 2,
      type: 'success',
      title: 'Maintenance Complete',
      message: 'Scheduled maintenance completed successfully on Chamber A',
      time: '15 min ago',
      read: false,
      priority: 'medium',
      source: 'Maintenance System',
      actions: ['View Report'],
      chamber: 'Chamber A'
    },
    {
      id: 3,
      type: 'error',
      title: 'Network Issue',
      message: 'Connection to Chamber B lost - attempting reconnection',
      time: '2 hours ago',
      read: true,
      priority: 'critical',
      source: 'Network Monitor',
      actions: ['Troubleshoot', 'Retry'],
      chamber: 'Chamber B'
    },
    {
      id: 4,
      type: 'info',
      title: 'System Update',
      message: 'New software update available for installation',
      time: '3 hours ago',
      read: true,
      priority: 'low',
      source: 'System',
      actions: ['Update Now', 'Later'],
      chamber: 'System'
    },
    {
      id: 5,
      type: 'success',
      title: 'Quality Check Passed',
      message: 'Batch #2847 quality inspection completed with 98% score',
      time: '4 hours ago',
      read: true,
      priority: 'medium',
      source: 'Quality Control',
      actions: ['View Certificate'],
      chamber: 'Quality Lab'
    }
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const dropdownRef = useRef(null);
  const panelRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ['info', 'warning', 'success', 'error'];
      const priorities = ['low', 'medium', 'high', 'critical'];
      const chambers = ['Chamber A', 'Chamber B', 'Chamber C', 'Chamber D', 'System'];
      
      const newNotification = {
        id: Date.now(),
        type: types[Math.floor(Math.random() * types.length)],
        title: 'System Alert',
        message: `New system event detected at ${new Date().toLocaleTimeString()}`,
        time: 'Just now',
        read: false,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        source: 'System Monitor',
        actions: ['View'],
        chamber: chambers[Math.floor(Math.random() * chambers.length)]
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': default: return 'bg-gray-400';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'critical') return notification.priority === 'critical';
    return notification.type === filter;
  });

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (notificationId, action) => {
    console.log(`Action: ${action} for notification ${notificationId}`);
    markAsRead(notificationId);
  };

  const openPanel = () => {
    setIsPanelOpen(true);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Right Side Notification Button */}
      <button
        onClick={() => isMobile ? openPanel() : setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Responsive Badges */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {criticalCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-red-600 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Desktop Dropdown */}
      {!isMobile && isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium touch-manipulation"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { value: 'all', label: 'All', count: notifications.length },
                { value: 'unread', label: 'Unread', count: unreadCount },
                { value: 'critical', label: 'Critical', count: notifications.filter(n => n.priority === 'critical').length },
                { value: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
                { value: 'warning', label: 'Warning', count: notifications.filter(n => n.type === 'warning').length },
                { value: 'error', label: 'Error', count: notifications.filter(n => n.type === 'error').length }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors touch-manipulation ${
                    filter === tab.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-64">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors touch-manipulation ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Priority Indicator */}
                    <div className={`w-1 h-full rounded-full ${getPriorityColor(notification.priority)} min-h-[60px]`}></div>
                    
                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div>
                            <h4 className={`font-medium text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-xs text-gray-500">{notification.chamber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 p-0.5 touch-manipulation"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{notification.time}</span>
                          <span>•</span>
                          <span>{notification.source}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleAction(notification.id, action)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors touch-manipulation"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 touch-manipulation">
              View All Notifications
            </button>
          </div>
        </div>
      )}

      {/* Mobile Slide-in Panel */}
      {isMobile && isPanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsPanelOpen(false)}
          />
          
          {/* Panel */}
          <div 
            ref={panelRef}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out"
            style={{ transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)' }}
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile Filter */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {[
                  { value: 'all', label: 'All', count: notifications.length },
                  { value: 'unread', label: 'New', count: unreadCount },
                  { value: 'critical', label: '!', count: notifications.filter(n => n.priority === 'critical').length }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors touch-manipulation ${
                      filter === tab.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label} {tab.count > 0 && `(${tab.count})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Notifications List */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-2">📭</div>
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors touch-manipulation ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1 h-full rounded-full ${getPriorityColor(notification.priority)} min-h-[40px]`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                            <div>
                              <h4 className={`font-medium text-xs ${!notification.read ? 'text-gray-900' : 'text-gray-700'} truncate`}>
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-500">{notification.chamber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-gray-600 p-0.5 touch-manipulation"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                        
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>{notification.time}</span>
                          </div>
                          
                          <button
                            onClick={() => handleAction(notification.id, 'View')}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors touch-manipulation"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="w-full mb-2 text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-2 touch-manipulation"
                >
                  Mark All as Read
                </button>
              )}
              <button className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-2 touch-manipulation">
                View All Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSideNotificationBar;
