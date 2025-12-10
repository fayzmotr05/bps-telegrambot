const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Database operations
const db = {
  // User operations
  async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userData.id,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          language_code: userData.language_code || 'uz',
          role: userData.role || 'client'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - createUser:', error.message);
      throw error;
    }
  },

  async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Database error - getUser:', error.message);
      return null;
    }
  },

  async updateUserLanguage(userId, languageCode) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ language_code: languageCode })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - updateUserLanguage:', error.message);
      throw error;
    }
  },

  // Product operations
  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error - getAllProducts:', error.message);
      return [];
    }
  },

  async getProduct(productId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - getProduct:', error.message);
      return null;
    }
  },

  async createProduct(productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - createProduct:', error.message);
      throw error;
    }
  },

  async updateProduct(productId, productData) {
    try {
      productData.updated_at = new Date().toISOString();
      
      console.log('🗄️ DB UPDATE - Input:', { productId, productData });
      
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      console.log('🗄️ DB UPDATE - Response:', { data, error });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('🔥 Database error - updateProduct:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
  },

  async deleteProduct(productId) {
    try {
      // First check if there are any orders for this product
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('product_id', productId);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        // Product has orders, cannot delete - throw a custom error
        const error = new Error(`Mahsulotni o'chirib bo'lmaydi: ${orders.length} ta buyurtma mavjud. Avval barcha buyurtmalarni hal qiling.`);
        error.code = 'FOREIGN_KEY_CONSTRAINT';
        error.orderCount = orders.length;
        throw error;
      }

      // No orders exist, safe to delete
      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .select();

      if (error) throw error;
      return data && data.length > 0 ? data[0] : true;
    } catch (error) {
      console.error('🔥 Database error - deleteProduct:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        productId: productId,
        orderCount: error.orderCount
      });
      throw error;
    }
  },

  // Order operations
  async createOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - createOrder:', error.message);
      throw error;
    }
  },

  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (first_name, username),
          products (name_uz, name_ru, name_en)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error - getAllOrders:', error.message);
      return [];
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - updateOrderStatus:', error.message);
      throw error;
    }
  },

  // Feedback operations
  async createFeedback(feedbackData) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert(feedbackData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - createFeedback:', error.message);
      throw error;
    }
  },

  async getAllFeedback() {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          users (first_name, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error - getAllFeedback:', error.message);
      return [];
    }
  },

  // Inventory management functions
  async getLowStockProducts(threshold = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .lte('stock_quantity', threshold)
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error - getLowStockProducts:', error.message);
      return [];
    }
  },

  async getOutOfStockProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('stock_quantity', 0);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error - getOutOfStockProducts:', error.message);
      return [];
    }
  },

  async updateProductStock(productId, newStock) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - updateProductStock:', error.message);
      throw error;
    }
  },

  async addStockToAllProducts(amount) {
    try {
      const { data, error } = await supabase
        .rpc('add_stock_to_all_products', { add_amount: amount });

      if (error) throw error;
      return { count: data };
    } catch (error) {
      console.error('Database error - addStockToAllProducts:', error.message);
      throw error;
    }
  },

  async getRestockRules() {
    try {
      // This would require a separate table for restock rules
      // For now, return empty array (could be implemented later)
      return [];
    } catch (error) {
      console.error('Database error - getRestockRules:', error.message);
      return [];
    }
  },

  // Analytics helper functions
  async getProductAnalytics() {
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, stock_quantity, price, created_at')
        .eq('is_active', true);

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_price, created_at, status, product_id, quantity');

      if (productsError || ordersError) {
        throw new Error('Analytics query failed');
      }

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
      console.error('Database error - getProductAnalytics:', error.message);
      return null;
    }
  },

  // Phone Registry functions
  async createUserPhone(userData) {
    try {
      const { data, error } = await supabase
        .from('user_phones')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - createUserPhone:', error.message);
      throw error;
    }
  },

  async updateUserPhone(telegramId, userData) {
    try {
      const { data, error } = await supabase
        .from('user_phones')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database error - updateUserPhone:', error.message);
      throw error;
    }
  },

  async getUserPhone(telegramId) {
    try {
      const { data, error } = await supabase
        .from('user_phones')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_registered', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Database error - getUserPhone:', error.message);
      return null;
    }
  },

  async getUserByPhone(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('user_phones')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_registered', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Database error - getUserByPhone:', error.message);
      return null;
    }
  },

  async getAllUserPhones() {
    try {
      const { data, error } = await supabase
        .from('user_phones')
        .select('*')
        .eq('is_registered', true)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Database error - getAllUserPhones:', error.message);
      return [];
    }
  }
};

module.exports = { supabase, db };