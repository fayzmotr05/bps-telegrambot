import { useState, useEffect } from 'react';
import { Category, getCategories, getCategoryName } from '../api/supabase';

interface CategoryFilterProps {
  language: 'uz' | 'ru' | 'en';
  selectedCategory?: string;
  onCategorySelect: (categoryId?: string) => void;
}

export default function CategoryFilter({ language, selectedCategory, onCategorySelect }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLabels = () => {
    switch (language) {
      case 'ru':
        return {
          all: 'Все категории'
        };
      case 'en':
        return {
          all: 'All Categories'
        };
      default:
        return {
          all: 'Barcha kategoriyalar'
        };
    }
  };

  const labels = getLabels();

  if (loading || categories.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* All Categories Button */}
        <button
          onClick={() => onCategorySelect(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
            !selectedCategory
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {labels.all}
        </button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors duration-200 ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.icon && (
              <span className="text-base">{category.icon}</span>
            )}
            <span>{getCategoryName(category, language)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}