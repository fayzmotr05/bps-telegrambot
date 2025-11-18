import { useState } from 'react';
import { Product, getProductName, getProductDescription, formatPrice, getStockStatus, getImageUrl } from '../api/supabase';
import ImageGallery from './ImageGallery';

interface ProductModalProps {
  product: Product;
  language: 'uz' | 'ru' | 'en';
  onClose: () => void;
  onOrder: () => void;
}

export default function ProductModal({ product, language, onClose, onOrder }: ProductModalProps) {
  const [showGallery, setShowGallery] = useState(false);
  
  const name = getProductName(product, language);
  const description = getProductDescription(product, language);
  const price = formatPrice(product.price, language);
  const stockStatus = getStockStatus(product, language);
  const canOrder = stockStatus.available && product.stock_quantity >= product.min_order;
  
  // Create array of images (for now just the main photo, but ready for multiple images)
  const images = [getImageUrl(product)];

  const getOrderButtonText = () => {
    if (!stockStatus.available) {
      return language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Tugagan';
    }
    return language === 'ru' ? '🛒 Заказать' : language === 'en' ? '🛒 Order' : '🛒 Buyurtma berish';
  };

  const getLabels = () => {
    switch (language) {
      case 'ru':
        return {
          details: 'Детали товара',
          price: 'Цена:',
          inStock: 'В наличии:',
          minOrder: 'Мин. заказ:',
          status: 'Статус:',
          orderNote: 'Нажмите для перехода к боту и оформления заказа'
        };
      case 'en':
        return {
          details: 'Product details',
          price: 'Price:',
          inStock: 'In stock:',
          minOrder: 'Min. order:',
          status: 'Status:',
          orderNote: 'Tap to go to bot and complete order'
        };
      default:
        return {
          details: 'Mahsulot tafsilotlari',
          price: 'Narx:',
          inStock: 'Qoldiq:',
          minOrder: 'Minimal:',
          status: 'Holat:',
          orderNote: 'Buyurtma berish uchun botga o\'tish'
        };
    }
  };

  const labels = getLabels();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-h-[85vh] rounded-t-2xl animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.details}
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
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Product Image */}
          <div 
            className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer relative group max-w-full"
            onClick={() => setShowGallery(true)}
          >
            <img 
              src={getImageUrl(product)}
              alt={name}
              className="w-full h-auto object-contain max-h-80 transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=400&fit=crop&auto=format';
              }}
            />
              {/* Zoom icon overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
              </div>
            </div>

          {/* Product Info */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {name}
            </h3>
            
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">
                  {labels.price}
                </span>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {price}
                </p>
              </div>
              
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">
                  {labels.inStock}
                </span>
                <p className={`font-semibold ${stockStatus.color}`}>
                  {product.stock_quantity} {language === 'ru' ? 'шт' : language === 'en' ? 'pcs' : 'dona'}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">
                  {labels.minOrder}
                </span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {product.min_order} {language === 'ru' ? 'шт' : language === 'en' ? 'pcs' : 'dona'}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">
                  {labels.status}
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
            className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              canOrder
                ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {getOrderButtonText()}
          </button>
          
          {canOrder && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {labels.orderNote}
            </p>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          productName={name}
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}