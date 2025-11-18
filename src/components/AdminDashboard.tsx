import { useState, useEffect } from 'react';
import { getProductAnalytics, formatPrice } from '../api/supabase';

interface AnalyticsData {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  lowStockProducts: number;
  recentOrders: number;
  averageOrderValue: number;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'uz' | 'ru' | 'en';
}

export default function AdminDashboard({ isOpen, onClose, language }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLabels = () => {
    switch (language) {
      case 'ru':
        return {
          title: 'Панель аналитики',
          totalProducts: 'Всего товаров',
          totalRevenue: 'Общая выручка',
          totalOrders: 'Всего заказов',
          lowStock: 'Товары с низким запасом',
          recentOrders: 'Заказы за неделю',
          avgOrderValue: 'Средний чек',
          loading: 'Загрузка аналитики...',
          error: 'Ошибка загрузки',
          retry: 'Повторить',
          close: 'Закрыть',
          products: 'товаров',
          orders: 'заказов',
          lastWeek: 'за последнюю неделю'
        };
      case 'en':
        return {
          title: 'Analytics Dashboard',
          totalProducts: 'Total Products',
          totalRevenue: 'Total Revenue',
          totalOrders: 'Total Orders',
          lowStock: 'Low Stock Items',
          recentOrders: 'This Week\'s Orders',
          avgOrderValue: 'Average Order Value',
          loading: 'Loading analytics...',
          error: 'Loading error',
          retry: 'Retry',
          close: 'Close',
          products: 'products',
          orders: 'orders',
          lastWeek: 'in the last week'
        };
      default:
        return {
          title: 'Analitika paneli',
          totalProducts: 'Jami mahsulotlar',
          totalRevenue: 'Umumiy daromad',
          totalOrders: 'Jami buyurtmalar',
          lowStock: 'Kam qolgan mahsulotlar',
          recentOrders: 'Haftalik buyurtmalar',
          avgOrderValue: 'O\'rtacha buyurtma',
          loading: 'Analitika yuklanmoqda...',
          error: 'Yuklashda xatolik',
          retry: 'Qayta urinish',
          close: 'Yopish',
          products: 'mahsulot',
          orders: 'buyurtma',
          lastWeek: 'oxirgi haftada'
        };
    }
  };

  const labels = getLabels();

  const StatCard = ({ icon, title, value, subtitle, color = "blue" }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "yellow" | "red" | "purple";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    };

    const iconColorClasses = {
      blue: "text-blue-600 dark:text-blue-400",
      green: "text-green-600 dark:text-green-400",
      yellow: "text-yellow-600 dark:text-yellow-400",
      red: "text-red-600 dark:text-red-400",
      purple: "text-purple-600 dark:text-purple-400"
    };

    return (
      <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <span className={`text-xl ${iconColorClasses[color]}`}>{icon}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-h-[90vh] rounded-t-2xl animate-slide-up">
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
        <div className="max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{labels.loading}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <div className="text-red-500 text-4xl mb-4">📊</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{labels.error}</p>
              <button 
                onClick={loadAnalytics}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {labels.retry}
              </button>
            </div>
          ) : analytics ? (
            <div className="p-4 space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon="📦"
                  title={labels.totalProducts}
                  value={analytics.totalProducts}
                  subtitle={`${analytics.totalProducts} ${labels.products}`}
                  color="blue"
                />
                <StatCard
                  icon="💰"
                  title={labels.totalRevenue}
                  value={formatPrice(analytics.totalRevenue, language)}
                  color="green"
                />
                <StatCard
                  icon="📋"
                  title={labels.totalOrders}
                  value={analytics.totalOrders}
                  subtitle={`${analytics.totalOrders} ${labels.orders}`}
                  color="purple"
                />
                <StatCard
                  icon="⚠️"
                  title={labels.lowStock}
                  value={analytics.lowStockProducts}
                  subtitle={`${analytics.lowStockProducts} ${labels.products}`}
                  color={analytics.lowStockProducts > 5 ? "red" : "yellow"}
                />
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 gap-4">
                <StatCard
                  icon="📈"
                  title={labels.recentOrders}
                  value={analytics.recentOrders}
                  subtitle={`${analytics.recentOrders} ${labels.orders} ${labels.lastWeek}`}
                  color="blue"
                />
                <StatCard
                  icon="🎯"
                  title={labels.avgOrderValue}
                  value={formatPrice(analytics.averageOrderValue, language)}
                  color="green"
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tezkor harakatlar | Быстрые действия | Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                    📊 {language === 'ru' ? 'Экспорт данных' : language === 'en' ? 'Export Data' : 'Ma\'lumot eksporti'}
                  </button>
                  <button className="p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                    🔄 {language === 'ru' ? 'Обновить' : language === 'en' ? 'Refresh' : 'Yangilash'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
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