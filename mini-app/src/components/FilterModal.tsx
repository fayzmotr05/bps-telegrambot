import { useState } from 'react';

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchQuery?: string;
  language?: 'uz' | 'ru' | 'en';
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  language: 'uz' | 'ru' | 'en';
}

export default function FilterModal({ 
  isOpen, 
  onClose, 
  onApply, 
  currentFilters, 
  language 
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  if (!isOpen) return null;

  const getLabels = () => {
    switch (language) {
      case 'ru':
        return {
          title: 'Фильтры',
          priceRange: 'Диапазон цен',
          minPrice: 'Мин. цена',
          maxPrice: 'Макс. цена',
          availability: 'Наличие',
          inStock: 'Только в наличии',
          reset: 'Сбросить',
          apply: 'Применить'
        };
      case 'en':
        return {
          title: 'Filters',
          priceRange: 'Price Range',
          minPrice: 'Min. Price',
          maxPrice: 'Max. Price',
          availability: 'Availability',
          inStock: 'In stock only',
          reset: 'Reset',
          apply: 'Apply'
        };
      default:
        return {
          title: 'Filtrlar',
          priceRange: 'Narx oralig\'i',
          minPrice: 'Minimal narx',
          maxPrice: 'Maksimal narx',
          availability: 'Mavjudlik',
          inStock: 'Faqat mavjud mahsulotlar',
          reset: 'Tozalash',
          apply: 'Qo\'llash'
        };
    }
  };

  const labels = getLabels();

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      searchQuery: filters.searchQuery, // Keep search query
      language: filters.language
    };
    setFilters(resetFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  // Common price presets
  const pricePresets = [
    { label: language === 'ru' ? 'До 10,000' : language === 'en' ? 'Under 10,000' : '10,000 gacha', max: 10000 },
    { label: language === 'ru' ? '10,000 - 50,000' : language === 'en' ? '10,000 - 50,000' : '10,000 - 50,000', min: 10000, max: 50000 },
    { label: language === 'ru' ? '50,000 - 100,000' : language === 'en' ? '50,000 - 100,000' : '50,000 - 100,000', min: 50000, max: 100000 },
    { label: language === 'ru' ? 'Более 100,000' : language === 'en' ? 'Over 100,000' : '100,000 dan yuqori', min: 100000 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-h-[80vh] rounded-t-2xl animate-slide-up">
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
        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Price Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {labels.priceRange}
            </h3>
            
            {/* Price Presets */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {pricePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setFilters({
                    ...filters,
                    minPrice: preset.min,
                    maxPrice: preset.max
                  })}
                  className={`p-2 text-xs rounded-lg border transition-colors duration-200 ${
                    filters.minPrice === preset.min && filters.maxPrice === preset.max
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Price Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {labels.minPrice}
                </label>
                <input
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    minPrice: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {labels.maxPrice}
                </label>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    maxPrice: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="∞"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {labels.availability}
            </h3>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => setFilters({
                  ...filters,
                  inStock: e.target.checked || undefined
                })}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-900 dark:text-white">
                {labels.inStock}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
          <button
            onClick={handleReset}
            className="py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200"
          >
            {labels.reset}
          </button>
          <button
            onClick={handleApply}
            className="py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {labels.apply}
          </button>
        </div>
      </div>
    </div>
  );
}