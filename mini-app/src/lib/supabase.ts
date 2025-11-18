/**
 * Supabase API Client for Mini App
 */
import { useState, useEffect } from 'react';

export interface Product {
  id: number;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  price: number;
  stock_quantity: number;
  min_order: number;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export type Language = 'uz' | 'ru' | 'en';

class SupabaseAPI {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    // Use environment variables or fallback to parent project's values
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aptvkdrqjcjpuqjakxvg.supabase.co';
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdHZrZHJxamNqcHVxamFreHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzc4MTUsImV4cCI6MjA3ODcxMzgxNX0.t6ZUC-QdY7ZtJ0hOQ3GnWUyuhMgEYbIVsWY_Sle3MgI';
    
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/rest/v1/${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all active products
  async getAllProducts(): Promise<Product[]> {
    try {
      const products = await this.request<Product[]>('products?is_active=eq.true&order=id.asc');
      return products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  // Get single product by ID
  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await this.request<Product[]>(`products?id=eq.${id}&is_active=eq.true`);
      return response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }

  // Search products by name
  async searchProducts(query: string, language: Language = 'uz'): Promise<Product[]> {
    if (!query.trim()) return [];
    
    try {
      const nameField = `name_${language}`;
      const products = await this.request<Product[]>(
        `products?${nameField}=ilike.*${encodeURIComponent(query)}*&is_active=eq.true&order=id.asc`
      );
      return products;
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  }

  // Get products with filters
  async getFilteredProducts(filters: {
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    searchQuery?: string;
    language?: Language;
  }): Promise<Product[]> {
    try {
      let query = 'products?is_active=eq.true';
      
      // Price filters
      if (filters.minPrice !== undefined) {
        query += `&price=gte.${filters.minPrice}`;
      }
      if (filters.maxPrice !== undefined) {
        query += `&price=lte.${filters.maxPrice}`;
      }
      
      // Stock filter
      if (filters.inStock) {
        query += `&stock_quantity=gt.0`;
      }
      
      // Search query
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const language = filters.language || 'uz';
        const nameField = `name_${language}`;
        query += `&${nameField}=ilike.*${encodeURIComponent(filters.searchQuery)}*`;
      }
      
      query += '&order=id.asc';
      
      const products = await this.request<Product[]>(query);
      return products;
    } catch (error) {
      console.error('Failed to fetch filtered products:', error);
      return [];
    }
  }

  // Get product name in specific language
  getProductName(product: Product, language: Language): string {
    return product[`name_${language}`] || product.name_uz;
  }

  // Get product description in specific language
  getProductDescription(product: Product, language: Language): string {
    return product[`description_${language}`] || product.description_uz || '';
  }

  // Format price with localization
  formatPrice(price: number, language: Language = 'uz'): string {
    const formatted = price.toLocaleString();
    switch (language) {
      case 'ru':
        return `${formatted} сум`;
      case 'en':
        return `${formatted} sum`;
      default:
        return `${formatted} so'm`;
    }
  }

  // Get stock status text
  getStockStatus(product: Product, language: Language = 'uz'): {
    text: string;
    color: string;
    available: boolean;
  } {
    const { stock_quantity, min_order } = product;
    
    if (stock_quantity === 0) {
      return {
        text: language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Tugagan',
        color: 'text-red-500',
        available: false
      };
    }
    
    if (stock_quantity < min_order * 2) {
      return {
        text: language === 'ru' ? 'Заканчивается' : language === 'en' ? 'Low stock' : 'Kam qolgan',
        color: 'text-yellow-500',
        available: true
      };
    }
    
    return {
      text: language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'Mavjud',
      color: 'text-green-500',
      available: true
    };
  }

  // Check if product can be ordered
  canOrder(product: Product, quantity: number = 1): boolean {
    return product.is_active && 
           product.stock_quantity >= quantity && 
           quantity >= product.min_order;
  }

  // Generate deep link to bot for ordering
  generateOrderLink(productId: number, botUsername: string = 'YourBotUsername'): string {
    return `https://t.me/${botUsername}?start=order_${productId}`;
  }
}

// Create singleton instance
export const supabaseAPI = new SupabaseAPI();

// React hook for products
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseAPI.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error('Products loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string, language: Language = 'uz') => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseAPI.searchProducts(query, language);
      setProducts(data);
    } catch (err) {
      setError('Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = async (filters: Parameters<typeof supabaseAPI.getFilteredProducts>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseAPI.getFilteredProducts(filters);
      setProducts(data);
    } catch (err) {
      setError('Filter failed');
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    searchProducts,
    filterProducts,
    refresh: loadProducts
  };
};

// React hook for single product
export const useProduct = (id: number) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await supabaseAPI.getProduct(id);
        setProduct(data);
      } catch (err) {
        setError('Failed to load product');
        console.error('Product loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  return { product, loading, error };
};

export default supabaseAPI;