import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  position = 'top-right'
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    // Auto-dismiss non-persistent notifications
    const timers: NodeJS.Timeout[] = [];
    
    visibleNotifications.forEach(notification => {
      if (!notification.persistent) {
        const duration = notification.duration || 5000;
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, onDismiss]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getTypeStyles = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: 'text-green-800',
          message: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          title: 'text-red-800',
          message: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <Info className="h-5 w-5 text-blue-600" />,
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: <Info className="h-5 w-5 text-gray-600" />,
          title: 'text-gray-800',
          message: 'text-gray-700'
        };
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed z-50 ${getPositionClasses()}`}>
      <div className="space-y-3 max-w-sm w-full">
        {visibleNotifications.map((notification) => {
          const styles = getTypeStyles(notification.type);
          
          return (
            <div
              key={notification.id}
              className={`${styles.bg} border rounded-lg shadow-lg p-4 animate-in slide-in-from-right-full duration-300`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {styles.icon}
                </div>
                
                <div className="ml-3 flex-1">
                  <h4 className={`text-sm font-medium ${styles.title}`}>
                    {notification.title}
                  </h4>
                  <p className={`mt-1 text-sm ${styles.message}`}>
                    {notification.message}
                  </p>
                  
                  {notification.action && (
                    <div className="mt-3">
                      <button
                        onClick={notification.action.onClick}
                        className={`text-sm font-medium underline hover:no-underline ${styles.title}`}
                      >
                        {notification.action.label}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => onDismiss(notification.id)}
                    className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Toast notification manager hook
export const useToast = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: ToastNotification = {
      ...notification,
      id
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'success', title, message, ...options });
  };

  const error = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'error', title, message, ...options });
  };

  const warning = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'warning', title, message, ...options });
  };

  const info = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'info', title, message, ...options });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
};