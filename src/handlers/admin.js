const { Scenes, Markup } = require('telegraf');
const { db } = require('../config/database');
const { getUserLanguage } = require('./products');

// Admin panel main menu
async function showAdminPanel(ctx) {
  try {
    const userId = ctx.from.id;
    const language = await getUserLanguage(userId);
    
    // Verify admin access
    if (parseInt(userId) !== parseInt(process.env.ADMIN_USER_ID)) {
      return await ctx.reply('❌ Access denied');
    }

    const buttons = [
      [
        { text: '📦 Mahsulotlar', callback_data: 'admin_products' },
        { text: '📋 Buyurtmalar', callback_data: 'admin_orders' }
      ],
      [
        { text: '💬 Fikrlar', callback_data: 'admin_feedback' },
        { text: '📊 Statistika', callback_data: 'admin_stats' }
      ],
      [
        { text: '🏭 Ombor boshqaruvi', callback_data: 'admin_inventory' }
      ],
      [
        { text: '◀️ Asosiy menyu', callback_data: 'back_to_menu' }
      ]
    ];

    const message = 
      `👑 ADMIN PANEL\n\n` +
      `Salom, ${ctx.from.first_name}!\n` +
      `Admin paneliga xush kelibsiz.\n\n` +
      `Quyidagi bo'limlardan birini tanlang:`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Admin panel error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

// Show admin products management
async function showAdminProducts(ctx) {
  try {
    const products = await db.getAllProducts();
    
    const buttons = [
      [
        { text: '➕ Yangi mahsulot', callback_data: 'add_product' }
      ]
    ];

    // Add existing products
    products.forEach(product => {
      buttons.push([{
        text: `✏️ ${product.name_uz} - ${product.price.toLocaleString()} so'm`,
        callback_data: `edit_product_${product.id}`
      }]);
    });

    buttons.push([
      { text: '◀️ Admin Panel', callback_data: 'admin_panel' }
    ]);

    let message = `📦 MAHSULOTLAR BOSHQARUVI\n\n`;
    message += `Jami mahsulotlar: ${products.length} ta\n\n`;
    message += `Yangi mahsulot qo'shish yoki mavjudini tahrirlash uchun tugmani bosing:`;

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Admin products error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

// Show admin orders
async function showAdminOrders(ctx) {
  try {
    const orders = await db.getAllOrders();
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    let message = `📋 BUYURTMALAR BOSHQARUVI\n\n`;
    message += `Jami buyurtmalar: ${orders.length} ta\n`;
    message += `Kutilayotgan: ${pendingOrders.length} ta\n\n`;

    const buttons = [];

    if (pendingOrders.length > 0) {
      message += `SO'NGGI BUYURTMALAR:\n\n`;
      
      // Show last 5 pending orders
      pendingOrders.slice(0, 5).forEach((order, index) => {
        const productName = order.products?.name_uz || 'Mahsulot nomi';
        const customerName = order.customer_name || 'Unknown';
        
        message += `${index + 1}. #${order.id}\n`;
        message += `👤 ${customerName}\n`;
        message += `📦 ${productName}\n`;
        message += `🔢 ${order.quantity} dona\n`;
        message += `💰 ${order.total_price.toLocaleString()} so'm\n`;
        message += `📞 ${order.customer_phone}\n\n`;

        buttons.push([{
          text: `✅ Buyurtma #${order.id}`,
          callback_data: `admin_order_${order.id}`
        }]);
      });
    } else {
      message += `📋 Hozircha yangi buyurtmalar yo'q`;
    }

    buttons.push([
      { text: '🔄 Yangilash', callback_data: 'admin_orders' },
      { text: '◀️ Admin Panel', callback_data: 'admin_panel' }
    ]);

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Admin orders error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

// Show admin feedback
async function showAdminFeedback(ctx) {
  try {
    const feedback = await db.getAllFeedback();
    const pendingFeedback = feedback.filter(f => f.status === 'pending');
    
    let message = `💬 FIKRLAR BOSHQARUVI\n\n`;
    message += `Jami fikrlar: ${feedback.length} ta\n`;
    message += `Kutilayotgan: ${pendingFeedback.length} ta\n\n`;

    const buttons = [];

    if (pendingFeedback.length > 0) {
      message += `YANGI FIKRLAR:\n\n`;
      
      // Show last 3 pending feedback
      pendingFeedback.slice(0, 3).forEach((fb, index) => {
        const userName = fb.users?.first_name || 'Unknown';
        
        message += `${index + 1}. #${fb.id}\n`;
        message += `👤 ${userName}\n`;
        message += `💬 ${fb.message.substring(0, 50)}${fb.message.length > 50 ? '...' : ''}\n\n`;

        buttons.push([{
          text: `📝 Fikr #${fb.id}`,
          callback_data: `feedback_${fb.id}`
        }]);
      });
    } else {
      message += `💬 Hozircha yangi fikrlar yo'q`;
    }

    buttons.push([
      { text: '🔄 Yangilash', callback_data: 'admin_feedback' },
      { text: '◀️ Admin Panel', callback_data: 'admin_panel' }
    ]);

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Admin feedback error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

// Show admin statistics
async function showAdminStats(ctx) {
  try {
    const [orders, feedback, products] = await Promise.all([
      db.getAllOrders(),
      db.getAllFeedback(),
      db.getAllProducts()
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.created_at.startsWith(today));
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    let totalRevenue = 0;
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        totalRevenue += parseFloat(order.total_price);
      }
    });

    let message = `📊 STATISTIKA\n\n`;
    message += `📅 Bugungi buyurtmalar: ${todayOrders.length} ta\n`;
    message += `📋 Kutilayotgan: ${pendingOrders.length} ta\n`;
    message += `📦 Jami mahsulotlar: ${products.length} ta\n`;
    message += `💬 Fikrlar: ${feedback.length} ta\n`;
    message += `💰 Jami daromad: ${totalRevenue.toLocaleString()} so'm\n\n`;

    // Most ordered products
    const productOrders = {};
    orders.forEach(order => {
      if (order.products?.name_uz) {
        const name = order.products.name_uz;
        productOrders[name] = (productOrders[name] || 0) + order.quantity;
      }
    });

    const sortedProducts = Object.entries(productOrders)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (sortedProducts.length > 0) {
      message += `🏆 ENG KO'P BUYURTMA QILINGAN:\n`;
      sortedProducts.forEach(([name, count], index) => {
        message += `${index + 1}. ${name} - ${count} ta\n`;
      });
    }

    const buttons = [[
      { text: '🔄 Yangilash', callback_data: 'admin_stats' },
      { text: '◀️ Admin Panel', callback_data: 'admin_panel' }
    ]];

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

module.exports = {
  showAdminPanel,
  showAdminProducts,
  showAdminOrders,
  showAdminFeedback,
  showAdminStats
};