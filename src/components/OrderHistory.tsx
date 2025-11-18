import { useState, useEffect } from 'react';
import { Order, getUserOrders, getOrderStatusText, getOrderStatusColor, getProductName, formatPrice } from '../api/supabase';

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  language: 'uz' | 'ru' | 'en';
}

export default function OrderHistory({ isOpen, onClose, userId, language }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadOrders();
    }
  }, [isOpen, userId]);

  const loadOrders = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getUserOrders(userId);
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLabels = () => {
    switch (language) {
      case 'ru':
        return {
          title: 'История заказов',
          noOrders: 'У вас пока нет заказов',
          orderNumber: 'Заказ #',
          quantity: 'Количество:',
          total: 'Итого:',
          status: 'Статус:',
          date: 'Дата:',
          loading: 'Загрузка заказов...',
          error: 'Ошибка загрузки',
          retry: 'Повторить',
          close: 'Закрыть'
        };
      case 'en':
        return {
          title: 'Order History',
          noOrders: 'You have no orders yet',
          orderNumber: 'Order #',
          quantity: 'Quantity:',
          total: 'Total:',
          status: 'Status:',
          date: 'Date:',
          loading: 'Loading orders...',
          error: 'Loading error',
          retry: 'Retry',
          close: 'Close'
        };
      default:
        return {
          title: 'Buyurtmalar tarixi',
          noOrders: 'Hozircha buyurtmalar yo\'q',
          orderNumber: 'Buyurtma #',
          quantity: 'Miqdor:',
          total: 'Jami:',
          status: 'Holat:',
          date: 'Sana:',
          loading: 'Buyurtmalar yuklanmoqda...',
          error: 'Yuklashda xatolik',
          retry: 'Qayta urinish',
          close: 'Yopish'
        };
    }
  };

  const labels = getLabels();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'ru' ? 'ru-RU' : 
      language === 'en' ? 'en-US' : 
      'uz-UZ'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-h-[85vh] rounded-t-2xl animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{labels.loading}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{labels.error}</p>
              <button 
                onClick={loadOrders}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {labels.retry}
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 dark:text-gray-400">{labels.noOrders}</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {labels.orderNumber}{order.id}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusText(order.status, language)}
                    </span>
                  </div>

                  {/* Product Info */}
                  {order.product && (
                    <div className="flex items-center space-x-3 mb-3">
                      {order.product.photo_url && (
                        <img 
                          src={order.product.photo_url}
                          alt={getProductName(order.product, language)}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getProductName(order.product, language)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {labels.quantity} {order.quantity} {language === 'ru' ? 'шт' : language === 'en' ? 'pcs' : 'dona'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{labels.total}</span>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatPrice(order.total_price, language)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{labels.date}</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span>{order.customer_name}</span>
                      {order.customer_phone && <span> • {order.customer_phone}</span>}
                    </div>
                    {order.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                        "{order.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
}