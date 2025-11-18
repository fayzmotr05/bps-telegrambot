import { useState } from 'react';
import { useTelegram } from '../lib/telegram';
import { Product, supabaseAPI } from '../lib/supabase';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const { user, hapticFeedback, openTelegramLink } = useTelegram();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const language = user?.language_code as 'uz' | 'ru' | 'en' || 'uz';

  const handleProductClick = (product: Product) => {
    hapticFeedback('light');
    setSelectedProduct(product);
  };

  const handleOrderClick = (product: Product) => {
    hapticFeedback('medium');
    
    // Generate deep link to bot with product ID
    const botUsername = 'YourBotUsername'; // Replace with actual bot username
    const orderLink = `https://t.me/${botUsername}?start=order_${product.id}`;
    
    openTelegramLink(orderLink);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 p-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            language={language}
            onClick={() => handleProductClick(product)}
          />
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          language={language}
          onClose={handleCloseModal}
          onOrder={() => handleOrderClick(selectedProduct)}
        />
      )}
    </>
  );
}

interface ProductCardProps {
  product: Product;
  language: 'uz' | 'ru' | 'en';
  onClick: () => void;
}

function ProductCard({ product, language, onClick }: ProductCardProps) {
  const name = supabaseAPI.getProductName(product, language);
  const price = supabaseAPI.formatPrice(product.price, language);
  const stockStatus = supabaseAPI.getStockStatus(product, language);

  return (
    <div 
      onClick={onClick}
      className="product-card cursor-pointer"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {product.photo_url ? (
          <img 
            src={product.photo_url}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-4xl text-gray-400">📦</span>
          </div>
        )}
        
        {/* Stock Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            stockStatus.available 
              ? stockStatus.color === 'text-green-500' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {stockStatus.text}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {price}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {product.stock_quantity} {language === 'ru' ? 'шт' : language === 'en' ? 'pcs' : 'dona'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ProductModalProps {
  product: Product;
  language: 'uz' | 'ru' | 'en';
  onClose: () => void;
  onOrder: () => void;
}

function ProductModal({ product, language, onClose, onOrder }: ProductModalProps) {
  const name = supabaseAPI.getProductName(product, language);
  const description = supabaseAPI.getProductDescription(product, language);
  const price = supabaseAPI.formatPrice(product.price, language);
  const stockStatus = supabaseAPI.getStockStatus(product, language);
  const canOrder = supabaseAPI.canOrder(product);

  const getOrderButtonText = () => {
    if (!stockStatus.available) {
      return language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Tugagan';
    }
    return language === 'ru' ? '🛒 Заказать' : language === 'en' ? '🛒 Order' : '🛒 Buyurtma berish';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-h-[80vh] rounded-t-2xl animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'ru' ? 'Детали товара' : language === 'en' ? 'Product details' : 'Mahsulot tafsilotlari'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <span className="text-xl">❌</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Product Image */}
          {product.photo_url && (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img 
                src={product.photo_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Product Info */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {name}
            </h3>
            
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  {language === 'ru' ? 'Цена:' : language === 'en' ? 'Price:' : 'Narx:'}
                </span>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {price}
                </p>
              </div>
              
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  {language === 'ru' ? 'В наличии:' : language === 'en' ? 'In stock:' : 'Qoldiq:'}
                </span>
                <p className={`font-semibold ${stockStatus.color}`}>
                  {product.stock_quantity} {language === 'ru' ? 'шт' : language === 'en' ? 'pcs' : 'dona'}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  {language === 'ru' ? 'Мин. заказ:' : language === 'en' ? 'Min. order:' : 'Minimal:'}
                </span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {product.min_order} {language === 'ru' ? 'шт' : language === 'en' ? 'pcs' : 'dona'}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  {language === 'ru' ? 'Статус:' : language === 'en' ? 'Status:' : 'Holat:'}
                </span>
                <p className={`font-semibold ${stockStatus.color}`}>
                  {stockStatus.text}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={canOrder ? onOrder : undefined}
            disabled={!canOrder}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-lg ${
              canOrder
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            } transition-colors duration-200`}
          >
            {getOrderButtonText()}
          </button>
          
          {canOrder && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {language === 'ru' 
                ? 'Нажмите для перехода к боту и оформления заказа'
                : language === 'en' 
                ? 'Tap to go to bot and complete order'
                : 'Buyurtma berish uchun botga o\'tish'
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}