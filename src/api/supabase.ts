import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aptvkdrqjcjpuqjakxvg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdHZrZHJxamNqcHVxamFreHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzc4MTUsImV4cCI6MjA3ODcxMzgxNX0.t6ZUC-QdY7ZtJ0hOQ3GnWUyuhMgEYbIVsWY_Sle3MgI';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Category {
  id: string;
  name: string;
  name_uz: string;
  icon?: string;
  order_index: number;
  created_at: string;
}

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
  photo_url?: string;  // Telegram file_id
  image_url?: string;  // Web URL
  is_active: boolean;
  created_at: string;
  category_id?: string;
  
  // Relations
  category?: Category;
}

export interface Order {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  customer_name: string;
  customer_phone: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  
  // Relations
  product?: Product;
}

// Get all products
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Search products
export async function searchProducts(query: string, language: 'uz' | 'ru' | 'en' = 'uz'): Promise<Product[]> {
  if (!query.trim()) return getProducts();
  
  try {
    const nameField = `name_${language}`;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .ilike(nameField, `%${query}%`)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error searching products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Helper functions
export function getProductName(product: Product, language: 'uz' | 'ru' | 'en' = 'uz'): string {
  return product[`name_${language}`] || product.name_uz;
}

export function getProductDescription(product: Product, language: 'uz' | 'ru' | 'en' = 'uz'): string {
  return product[`description_${language}`] || product.description_uz || '';
}

export function formatPrice(price: number, language: 'uz' | 'ru' | 'en' = 'uz'): string {
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

export function getStockStatus(product: Product, language: 'uz' | 'ru' | 'en' = 'uz') {
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

// Real-time subscription for product changes
export function subscribeToProducts(callback: (products: Product[]) => void) {
  return supabase
    .channel('products_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: 'is_active=eq.true'
      }, 
      async (payload) => {
        console.log('Product change detected:', payload);
        // Reload all products when any change occurs
        const products = await getProducts();
        callback(products);
      }
    )
    .subscribe();
}

// Advanced filtering
export async function getFilteredProducts(filters: {
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchQuery?: string;
  language?: 'uz' | 'ru' | 'en';
}): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    
    // Price filters
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    
    // Stock filter
    if (filters.inStock) {
      query = query.gt('stock_quantity', 0);
    }
    
    // Search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const language = filters.language || 'uz';
      const nameField = `name_${language}`;
      query = query.ilike(nameField, `%${filters.searchQuery}%`);
    }
    
    query = query.order('id', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error filtering products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Get user orders
export async function getUserOrders(userId: number): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        product:products (
          id,
          name_uz,
          name_ru,
          name_en,
          photo_url,
          price
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Get order status text
export function getOrderStatusText(status: string, language: "uz" | "ru" | "en"): string {
  const statusTexts = {
    pending: {
      uz: "Kutilmoqda",
      ru: "Ожидает",
      en: "Pending"
    },
    confirmed: {
      uz: "Tasdiqlandi",
      ru: "Подтверждено",
      en: "Confirmed"
    },
    completed: {
      uz: "Yakunlandi",
      ru: "Завершено",
      en: "Completed"
    },
    cancelled: {
      uz: "Bekor qilindi",
      ru: "Отменено",
      en: "Cancelled"
    }
  };
  
  return statusTexts[status as keyof typeof statusTexts]?.[language] || status;
}

// Get order status color
export function getOrderStatusColor(status: string): string {
  const colors = {
    pending: "text-yellow-600 dark:text-yellow-400",
    confirmed: "text-blue-600 dark:text-blue-400",
    completed: "text-green-600 dark:text-green-400",
    cancelled: "text-red-600 dark:text-red-400"
  };
  
  return colors[status as keyof typeof colors] || "text-gray-600 dark:text-gray-400";
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Get category name based on language
export function getCategoryName(category: Category, language: 'uz' | 'ru' | 'en' = 'uz'): string {
  if (language === 'uz') return category.name_uz || category.name;
  return category.name || category.name_uz;
}

// Get products by category
export async function getProductsByCategory(categoryId: string, language: 'uz' | 'ru' | 'en' = 'uz'): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (
          id,
          name,
          name_uz,
          icon,
          order_index
        )
      `)
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Analytics functions
export async function getProductAnalytics() {
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, stock_quantity, price, created_at')
      .eq('is_active', true);

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_price, created_at, status, product_id, quantity');

    if (productsError || ordersError) {
      console.error('Analytics error:', productsError || ordersError);
      return null;
    }

    // Calculate basic metrics
    const totalProducts = products?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const lowStockProducts = products?.filter(p => p.stock_quantity <= 10).length || 0;

    // Recent orders (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentOrders = orders?.filter(o => new Date(o.created_at) >= weekAgo).length || 0;

    return {
      totalProducts,
      totalRevenue,
      totalOrders,
      lowStockProducts,
      recentOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  } catch (error) {
    console.error('Analytics calculation error:', error);
    return null;
  }
}


// Get proper image URL for display - now uses image_url field for web URLs
export function getImageUrl(product: Product): string {
  // Priority: image_url (web URL) > photo_url (fallback) > default
  let imageUrl = product.image_url || product.photo_url;
  
  if (!imageUrl) {
    // Default fallback image
    return "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=400&fit=crop&auto=format";
  }
  
  // If it is already a web URL, return as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }
  
  // If it's a Telegram file_id, return fallback image
  if (imageUrl && imageUrl.length > 50 && imageUrl.includes("AgAC")) {
    return "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=400&fit=crop&auto=format";
  }
  
  // Fallback for any other format
  return "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=400&fit=crop&auto=format";
}
