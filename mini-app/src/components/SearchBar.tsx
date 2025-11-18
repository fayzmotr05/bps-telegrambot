import { useState, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  language: 'uz' | 'ru' | 'en';
  placeholder?: string;
}

export default function SearchBar({ onSearch, language, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (language) {
      case 'ru':
        return 'Поиск товаров...';
      case 'en':
        return 'Search products...';
      default:
        return 'Mahsulotlarni qidiring...';
    }
  };

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 300);

    // Cleanup previous timeout
    return () => clearTimeout(timeoutId);
  }, [onSearch]);

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={getPlaceholder()}
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}