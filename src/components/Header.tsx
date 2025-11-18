import SearchBar from './SearchBar';

interface HeaderProps {
  user: any;
  language: 'uz' | 'ru' | 'en';
  onSearch: (query: string) => void;
  onFilterClick: () => void;
  onOrderHistoryClick?: () => void;
  onAnalyticsClick?: () => void;
  hasActiveFilters: boolean;
}

export default function Header({ 
  user, 
  language, 
  onSearch, 
  onFilterClick, 
  onOrderHistoryClick,
  onAnalyticsClick,
  hasActiveFilters 
}: HeaderProps) {
  const getLabels = () => {
    switch (language) {
      case 'ru':
        return {
          title: '🏪 BPS Каталог',
          greeting: user ? `Привет, ${user.first_name}! 👋` : null,
          devMode: '⚠️ Режим разработки - функции Telegram отключены',
        };
      case 'en':
        return {
          title: '🏪 BPS Catalogue',
          greeting: user ? `Hello, ${user.first_name}! 👋` : null,
          devMode: '⚠️ Development mode - Telegram features disabled',
        };
      default:
        return {
          title: '🏪 BPS Katalog',
          greeting: user ? `Assalomu alaykum, ${user.first_name}! 👋` : null,
          devMode: '⚠️ Development mode - Telegram funksiyalari o\'chirilgan',
        };
    }
  };

  const labels = getLabels();

  return (
    <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {labels.title}
            </h1>
            {labels.greeting ? (
              <p className="text-sm text-gray-600 font-medium">
                {labels.greeting}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {labels.devMode}
              </p>
            )}
          </div>
          
          {/* Simple Brand Icon */}
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">BPS</span>
          </div>
        </div>
      </div>
      
      {/* Search and Controls Bar */}
      <div className="px-4 pb-3 flex gap-3">
        <div className="flex-1">
          <SearchBar 
            onSearch={onSearch} 
            language={language}
          />
        </div>
        
        {/* Order History Button */}
        {user && onOrderHistoryClick && (
          <button
            onClick={onOrderHistoryClick}
            className="p-3 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </button>
        )}
        
        {/* Analytics Button (Admin Only) */}
        {user && user.id === 790208567 && onAnalyticsClick && (
          <button
            onClick={onAnalyticsClick}
            className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        )}
        
        {/* Filter Button */}
        <button
          onClick={onFilterClick}
          className={`p-3 rounded-lg transition-all duration-200 relative ${
            hasActiveFilters
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100/80 hover:bg-gray-200/80 text-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          
          {/* Active filter indicator */}
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
          )}
        </button>
      </div>
    </header>
  );
}