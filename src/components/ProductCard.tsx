import { Product, getProductName, formatPrice, getStockStatus, getImageUrl } from '../api/supabase';

interface ProductCardProps {
  product: Product;
  language: 'uz' | 'ru' | 'en';
  onClick: () => void;
}

export default function ProductCard({ product, language, onClick }: ProductCardProps) {
  const name = getProductName(product, language);
  const price = formatPrice(product.price, language);
  const stockStatus = getStockStatus(product, language);

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200/50 hover:-translate-y-1"
    >
      {/* Clean Product Image Container - Apple Style */}
      <div className="relative aspect-square bg-gray-50/50 overflow-hidden">
        <img 
          src={getImageUrl(product)}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=400&fit=crop&auto=format';
            target.onerror = () => {
              target.style.display = 'none';
              const placeholder = target.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            };
          }}
        />
        
        {/* Elegant placeholder */}
        <div className="absolute inset-0 hidden items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">No Image</p>
          </div>
        </div>

        {/* Minimal Status Badge */}
        {!stockStatus.available && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-red-600 border border-red-200/50">
              {stockStatus.text}
            </span>
          </div>
        )}
      </div>

      {/* Clean Product Information - Inspired by Apple Store */}
      <div className="p-4">
        <div className="space-y-2">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {name}
          </h3>

          {/* Price - Prominent like Apple */}
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {price}
            </span>
            <span className="text-xs text-gray-500">
              {product.stock_quantity} {language === 'ru' ? 'шт' : language === 'en' ? 'pcs' : 'dona'}
            </span>
          </div>

          {/* Subtle Action Indicator */}
          <div className="pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <span className="text-xs text-blue-600 font-medium">
              {language === 'ru' ? 'Подробнее' : language === 'en' ? 'Learn more' : 'Batafsil'}
            </span>
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}