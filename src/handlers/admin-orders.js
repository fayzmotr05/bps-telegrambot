const { db } = require('../config/database');

// Show individual order details
async function showOrderDetails(ctx, orderId) {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      return await ctx.reply('❌ Access denied');
    }

    const orders = await db.getAllOrders();
    const order = orders.find(o => o.id === parseInt(orderId));
    
    if (!order) {
      return await ctx.editMessageText('❌ Buyurtma topilmadi');
    }

    const productName = order.products?.name_uz || 'Mahsulot nomi noma\'lum';
    const orderDate = new Date(order.created_at).toLocaleDateString('uz-UZ');
    const orderTime = new Date(order.created_at).toLocaleTimeString('uz-UZ');
    
    let message = `📋 BUYURTMA TAFSILOTLARI\n\n`;
    message += `🆔 ID: #${order.id}\n`;
    message += `📅 Sana: ${orderDate} ${orderTime}\n`;
    message += `👤 Mijoz: ${order.customer_name}\n`;
    message += `📞 Telefon: ${order.customer_phone}\n\n`;
    message += `📦 Mahsulot: ${productName}\n`;
    message += `🔢 Miqdor: ${order.quantity} dona\n`;
    message += `💰 Jami: ${order.total_price.toLocaleString()} so'm\n`;
    message += `📊 Holat: ${getStatusText(order.status)}\n`;
    
    if (order.notes) {
      message += `📝 Izoh: ${order.notes}\n`;
    }

    const buttons = [];
    
    // Status change buttons
    if (order.status === 'pending') {
      buttons.push([
        { text: '✅ Qabul qilish', callback_data: `order_status_${orderId}_completed` },
        { text: '❌ Rad etish', callback_data: `order_status_${orderId}_cancelled` }
      ]);
    } else if (order.status === 'completed') {
      buttons.push([
        { text: '↩️ Qayta kutilayotgan', callback_data: `order_status_${orderId}_pending` }
      ]);
    } else if (order.status === 'cancelled') {
      buttons.push([
        { text: '↩️ Qayta faollashtirish', callback_data: `order_status_${orderId}_pending` }
      ]);
    }

    // Phone call button
    buttons.push([
      { text: `📞 ${order.customer_phone}`, url: `tel:${order.customer_phone}` }
    ]);

    // Back button
    buttons.push([
      { text: '◀️ Buyurtmalar', callback_data: 'admin_orders' }
    ]);

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('🔥 DETAILED ORDER DETAILS ERROR:', {
      message: error.message,
      stack: error.stack,
      orderId: orderId,
      orderType: typeof orderId,
      adminUserId: process.env.ADMIN_USER_ID,
      currentUserId: ctx.from.id
    });
    await ctx.reply('❌ Buyurtma ko\'rishda xatolik: ' + error.message);
  }
}

// Update order status
async function updateOrderStatus(ctx, orderId, newStatus) {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      return await ctx.answerCbQuery('❌ Access denied');
    }

    const order = await db.updateOrderStatus(orderId, newStatus);
    
    if (order) {
      const statusText = getStatusText(newStatus);
      await ctx.answerCbQuery(`✅ Buyurtma ${statusText} qilindi`);
      
      // Refresh order details
      await showOrderDetails(ctx, orderId);
    } else {
      await ctx.answerCbQuery('❌ Xatolik yuz berdi');
    }

  } catch (error) {
    console.error('🔥 DETAILED ORDER STATUS UPDATE ERROR:', {
      message: error.message,
      stack: error.stack,
      orderId: orderId,
      newStatus: newStatus,
      adminUserId: process.env.ADMIN_USER_ID,
      currentUserId: ctx.from.id
    });
    await ctx.answerCbQuery('❌ Status yangilashda xatolik: ' + error.message);
  }
}

// Get status text in Uzbek
function getStatusText(status) {
  switch (status) {
    case 'pending': return '🟡 Kutilmoqda';
    case 'completed': return '✅ Bajarildi';
    case 'cancelled': return '❌ Bekor qilindi';
    default: return status;
  }
}

module.exports = {
  showOrderDetails,
  updateOrderStatus,
  getStatusText
};