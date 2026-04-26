import React, { useState, useEffect, useRef } from 'react';

const NotificationBar = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Temperature Alert',
      message: 'Chamber C temperature exceeded threshold',
      time: '2 min ago',
      read: false,
      priority: 'high',
      source: 'Temperature Sensor',
      actions: ['View Details', 'Acknowledge']
    },
    {
      id: 2,
      type: 'success',
      title: 'Maintenance Complete',
      message: 'Scheduled maintenance completed successfully',
      time: '15 min ago',
      read: false,
      priority: 'medium',
      source: 'Maintenance System',
      actions: ['View Report']
    },
    {
      id: 3,
      type: 'info',
      title: 'System Update',
      message: 'New software update available',
      time: '1 hour ago',
      read: true,
      priority: 'low',
      source: 'System',
      actions: ['Update Now', 'Later']
    },
    {
      id: 4,
      type: 'error',
      title: 'Network Issue',
      message: 'Connection to Chamber B lost',
      time: '2 hours ago',
      read: true,
      priority: 'critical',
      source: 'Network Monitor',
      actions: ['Troubleshoot', 'Retry']
    },
    {
      id: 5,
      type: 'success',
      title: 'Quality Check Passed',
      message: 'Batch #2847 quality inspection completed',
      time: '3 hours ago',
      read: true,
      priority: 'medium',
      source: 'Quality Control',
      actions: ['View Certificate']
    }
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);

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
      const newNotification = {
        id: Date.now(),
        type: ['info', 'warning', 'success', 'error'][Math.floor(Math.random() * 4)],
        title: 'System Update',
        message: `New system event at ${new Date().toLocaleTimeString()}`,
        time: 'Just now',
        read: false,
        priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        source: 'System Monitor',
        actions: ['View']
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
      default:
        return 'bg-gray-400';
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Button - Responsive */}
 

      {/* Responsive Notification Dropdown */}
      {isOpen && (
        <div className={`fixed right-0 top-16 sm:absolute sm:top-auto sm:mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden ${
          isMobile 
            ? 'left-0 right-0 bottom-0 h-screen max-h-screen' 
            : 'w-80 sm:w-96 max-h-96'
        }`}>
          {/* Header - Responsive */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium touch-manipulation"
                  >
                    {isMobile ? 'Read all' : 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Responsive Filter Tabs */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
              {[
                { value: 'all', label: isMobile ? 'All' : 'All', count: notifications.length },
                { value: 'unread', label: isMobile ? 'New' : 'Unread', count: unreadCount },
                { value: 'critical', label: isMobile ? '!' : 'Critical', count: notifications.filter(n => n.priority === 'critical').length },
                { value: 'success', label: isMobile ? '✓' : 'Success', count: notifications.filter(n => n.type === 'success').length },
                { value: 'warning', label: isMobile ? '⚠' : 'Warning', count: notifications.filter(n => n.type === 'warning').length },
                { value: 'error', label: isMobile ? '✕' : 'Error', count: notifications.filter(n => n.type === 'error').length }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-2 sm:px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors touch-manipulation ${
                    filter === tab.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}{tab.count > 0 && !isMobile && ` (${tab.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List - Responsive */}
          <div className={`overflow-y-auto ${isMobile ? 'max-h-[60vh]' : 'max-h-64'}`}>
            {filteredNotifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="text-gray-400 text-3xl sm:text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm sm:text-base">No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors touch-manipulation ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Priority Indicator - Responsive */}
                    <div className={`w-1 h-full rounded-full ${getPriorityColor(notification.priority)} min-h-[40px] sm:min-h-[60px]}`}></div>
                    
                    {/* Notification Content - Responsive */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-lg">{getNotificationIcon(notification.type)}</span>
                          <h4 className={`font-medium text-xs sm:text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'} truncate`}>
                            {notification.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 p-0.5 touch-manipulation"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                          <span>{notification.time}</span>
                          {!isMobile && <span>•</span>}
                          {!isMobile && <span>{notification.source}</span>}
                        </div>
                        
                        {/* Responsive Action Buttons */}
                        <div className="flex gap-1 flex-wrap">
                          {notification.actions.slice(0, isMobile ? 1 : 2).map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleAction(notification.id, action)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors touch-manipulation"
                            >
                              {action}
                            </button>
                          ))}
                          {isMobile && notification.actions.length > 1 && (
                            <button className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                              More
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Responsive */}
          <div className="p-2 sm:p-3 border-t border-gray-200 bg-gray-50">
            <button className="w-full text-center text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium py-2 touch-manipulation">
              {isMobile ? 'View All' : 'View All Notifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBar;
