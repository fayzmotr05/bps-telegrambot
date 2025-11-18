import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationSystemProps {
  language: 'uz' | 'ru' | 'en';
  userId?: number;
}

export default function NotificationSystem({ language, userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Set up real-time subscriptions for notifications
    const ordersSubscription = supabase
      .channel('new_orders')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders'
        }, 
        (payload) => {
          console.log('New order notification:', payload);
          addNotification({
            type: 'info',
            title: getLabel('newOrder'),
            message: getLabel('newOrderMessage', payload.new.customer_name),
            timestamp: new Date()
          });
        }
      )
      .subscribe();

    // Low stock notifications
    const productSubscription = supabase
      .channel('product_updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'products'
        }, 
        (payload) => {
          const product = payload.new;
          if (product.stock_quantity <= 10 && product.is_active) {
            addNotification({
              type: 'warning',
              title: getLabel('lowStock'),
              message: getLabel('lowStockMessage', product[`name_${language}`] || product.name_uz),
              timestamp: new Date()
            });
          }
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      productSubscription.unsubscribe();
    };
  }, [userId, language]);

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 latest
    setIsVisible(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    // Haptic feedback if available
    if (window.Telegram?.WebApp?.hapticFeedback) {
      window.Telegram.WebApp.hapticFeedback.impactOccurred('light');
    }
  };

  const getLabel = (key: string, param?: string) => {
    const labels = {
      newOrder: {
        uz: 'Yangi buyurtma',
        ru: 'Новый заказ',
        en: 'New Order'
      },
      newOrderMessage: {
        uz: `${param || 'Mijoz'} tomonidan yangi buyurtma`,
        ru: `Новый заказ от ${param || 'клиента'}`,
        en: `New order from ${param || 'customer'}`
      },
      lowStock: {
        uz: 'Kam qoldiq',
        ru: 'Низкий остаток',
        en: 'Low Stock'
      },
      lowStockMessage: {
        uz: `${param || 'Mahsulot'} qoldiq kam`,
        ru: `Низкий остаток: ${param || 'Товар'}`,
        en: `Low stock: ${param || 'Product'}`
      }
    };
    
    return labels[key as keyof typeof labels]?.[language] || key;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const getNotificationColor = (type: Notification['type']) => {
    const colors = {
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
      success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
      error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    };
    return colors[type];
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type];
  };

  if (notifications.length === 0) return null;

  return (
    <>
      {/* Active notification toast */}
      {isVisible && notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className={`p-4 rounded-lg border shadow-lg max-w-sm ${getNotificationColor(notifications[0].type)}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{getNotificationIcon(notifications[0].type)}</span>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{notifications[0].title}</h4>
                <p className="text-xs mt-1 opacity-90">{notifications[0].message}</p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification history (can be toggled) */}
      <div className="hidden">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 border rounded-lg ${getNotificationColor(notification.type)} ${notification.read ? 'opacity-50' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start gap-2">
              <span>{getNotificationIcon(notification.type)}</span>
              <div className="flex-1">
                <h5 className="font-medium text-sm">{notification.title}</h5>
                <p className="text-xs">{notification.message}</p>
                <p className="text-xs opacity-60 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}