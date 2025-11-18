import { useState, useEffect, lazy, Suspense } from 'react';
import { Product, getProducts, searchProducts, subscribeToProducts, getFilteredProducts } from './api/supabase';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import Header from './components/Header';
import FilterModal, { FilterOptions } from './components/FilterModal';
import OrderHistory from './components/OrderHistory';
import NotificationSystem from './components/NotificationSystem';

// Lazy load heavy components for better performance
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Declare Telegram types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe: { user?: any };
        ready: () => void;
        expand: () => void;
        colorScheme: string;
        showAlert: (message: string) => void;
        hapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
        };
        openTelegramLink: (url: string) => void;
      };
    };
  }
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  // Get user language with fallback logic
  const getUserLanguage = (): 'uz' | 'ru' | 'en' => {
    // Priority: Telegram user language_code > saved preference > default
    if (user?.language_code) {
      const telegramLang = user.language_code.toLowerCase();
      if (telegramLang.startsWith('ru')) return 'ru';
      if (telegramLang.startsWith('en')) return 'en';
      return 'uz';
    }
    
    // Fallback to saved preference or default
    const savedLang = localStorage.getItem('user_language') as 'uz' | 'ru' | 'en';
    return savedLang || 'uz';
  };

  const language = getUserLanguage();

  // Load products with filters
  const loadProducts = async (searchQuery?: string, filterOptions?: FilterOptions) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = {
        ...filters,
        ...filterOptions,
        searchQuery: searchQuery !== undefined ? searchQuery : filters.searchQuery,
        language
      };
      
      const data = await getFilteredProducts(currentFilters);
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await loadProducts(query, filters);
  };

  // Handle filter apply
  const handleFilterApply = async (newFilters: FilterOptions) => {
    setFilters(newFilters);
    await loadProducts(searchQuery, newFilters);
  };


  // Initialize Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();
      
      // Apply theme
      if (webapp.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      const telegramUser = webapp.initDataUnsafe.user;
      setUser(telegramUser);
      
      // Sync user session data
      if (telegramUser) {
        // Save user data to localStorage for persistence
        localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
        
        // Save language preference if detected from Telegram
        if (telegramUser.language_code) {
          const telegramLang = telegramUser.language_code.toLowerCase();
          let detectedLang = 'uz';
          if (telegramLang.startsWith('ru')) detectedLang = 'ru';
          else if (telegramLang.startsWith('en')) detectedLang = 'en';
          
          localStorage.setItem('user_language', detectedLang);
          console.log(`🌐 Language synced: ${detectedLang} (from Telegram: ${telegramUser.language_code})`);
        }
      }
    } else {
      // Development mode - try to restore user from localStorage
      const savedUser = localStorage.getItem('telegram_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }
    }
  }, []);

  // Load initial products and set up real-time subscription
  useEffect(() => {
    loadProducts();
    
    // Set up real-time subscription for product changes
    const subscription = subscribeToProducts((updatedProducts) => {
      console.log('🔄 Real-time update: Products changed in database');
      setProducts(updatedProducts);
      
      // Show a subtle notification that data was updated
      if (window.Telegram?.WebApp?.hapticFeedback) {
        window.Telegram.WebApp.hapticFeedback.impactOccurred('light');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Reload when filters or search change
  useEffect(() => {
    if (searchQuery || Object.keys(filters).length > 0) {
      loadProducts(searchQuery, filters);
    }
  }, [language]); // Reload when language changes

  // Handle product click
  const handleProductClick = (product: Product) => {
    // Haptic feedback
    if (window.Telegram?.WebApp?.hapticFeedback) {
      window.Telegram.WebApp.hapticFeedback.impactOccurred('light');
    }
    setSelectedProduct(product);
  };

  // Handle order
  const handleOrder = (product: Product) => {
    // Haptic feedback
    if (window.Telegram?.WebApp?.hapticFeedback) {
      window.Telegram.WebApp.hapticFeedback.impactOccurred('medium');
    }
    
    // Create deep link to bot
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'YourBotUsername';
    const orderLink = `https://t.me/${botUsername}?start=order_${product.id}`;
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(orderLink);
    } else {
      // Fallback for development
      window.open(orderLink, '_blank');
    }
    
    setSelectedProduct(null);
  };

  // Get text labels
  const getLabels = () => {
    switch (language) {
      case 'ru':
        return {
          title: '🏪 BPS Каталог',
          greeting: user ? `Привет, ${user.first_name}! 👋` : null,
          devMode: '⚠️ Режим разработки - функции Telegram отключены',
          loading: 'Загрузка товаров...',
          error: 'Произошла ошибка',
          retry: 'Повторить',
          noProducts: 'Товары не найдены',
          refresh: 'Обновить',
          devNote: 'Режим разработки: Откройте в Telegram для полного функционала'
        };
      case 'en':
        return {
          title: '🏪 BPS Catalogue',
          greeting: user ? `Hello, ${user.first_name}! 👋` : null,
          devMode: '⚠️ Development mode - Telegram features disabled',
          loading: 'Loading products...',
          error: 'An error occurred',
          retry: 'Retry',
          noProducts: 'No products found',
          refresh: 'Refresh',
          devNote: 'Development Mode: Open in Telegram to see Mini App features'
        };
      default:
        return {
          title: '🏪 BPS Katalog',
          greeting: user ? `Assalomu alaykum, ${user.first_name}! 👋` : null,
          devMode: '⚠️ Development mode - Telegram funksiyalari o\'chirilgan',
          loading: 'Mahsulotlar yuklanmoqda...',
          error: 'Xatolik yuz berdi',
          retry: 'Qayta urinish',
          noProducts: 'Mahsulotlar topilmadi',
          refresh: 'Yangilash',
          devNote: 'Development Mode: Telegram Mini App funksiyalarini ko\'rish uchun Telegramda oching'
        };
    }
  };

  const labels = getLabels();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            {labels.error}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadProducts}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {labels.retry}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{labels.loading}</p>
        </div>
      </div>
    );
  }

  // Check if filters are active
  const hasActiveFilters = !!(filters.minPrice || filters.maxPrice || filters.inStock);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Search and Filters */}
      <Header
        user={user}
        language={language}
        onSearch={handleSearch}
        onFilterClick={() => setShowFilters(true)}
        onOrderHistoryClick={() => setShowOrderHistory(true)}
        onAnalyticsClick={() => setShowAdminDashboard(true)}
        hasActiveFilters={hasActiveFilters}
      />


      {/* Main Content */}
      <main className="pb-6">
        {products.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
              {searchQuery ? labels.noProducts : 'Hozircha mahsulotlar mavjud emas'}
            </p>
            <button 
              onClick={searchQuery ? () => handleSearch('') : loadProducts}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              {searchQuery ? 'Tozalash' : labels.refresh}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {products.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                language={language}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          language={language}
          onClose={() => setSelectedProduct(null)}
          onOrder={() => handleOrder(selectedProduct)}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
        language={language}
      />

      {/* Order History Modal */}
      <OrderHistory
        isOpen={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
        userId={user?.id}
        language={language}
      />

      {/* Admin Dashboard Modal */}
      <Suspense fallback={
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      }>
        <AdminDashboard
          isOpen={showAdminDashboard}
          onClose={() => setShowAdminDashboard(false)}
          language={language}
        />
      </Suspense>

      {/* Real-time Notification System */}
      <NotificationSystem
        language={language}
        userId={user?.id}
      />

      {/* Development Info */}
      {!user && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Development Mode:</strong> {labels.devNote}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;