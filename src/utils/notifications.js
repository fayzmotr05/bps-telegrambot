// Group notification system
const { Telegraf } = require('telegraf');

// Bot instance for sending notifications
let botInstance = null;

// Initialize with bot instance
function initNotifications(bot) {
  botInstance = bot;
}

// Send order notification to admin group
async function sendOrderNotification(orderData, productData, userData) {
  try {
    const ordersGroupId = process.env.ORDERS_GROUP_ID;
    
    if (!ordersGroupId || !botInstance) {
      console.log('📢 Orders group not configured or bot not initialized');
      return false;
    }

    const orderDate = new Date().toLocaleString('uz-UZ');
    
    let message = `🆕 YANGI BUYURTMA!\n\n`;
    message += `🆔 Buyurtma: #${orderData.id}\n`;
    message += `📅 Sana: ${orderDate}\n\n`;
    message += `👤 MIJOZ:\n`;
    message += `• Ism: ${orderData.customer_name}\n`;
    message += `• Telefon: ${orderData.customer_phone}\n`;
    if (userData?.username) message += `• Username: @${userData.username}\n`;
    message += `• ID: ${orderData.user_id}\n\n`;
    message += `📦 MAHSULOT:\n`;
    message += `• Nom: ${productData?.name_uz || 'Noma\'lum'}\n`;
    message += `• Miqdor: ${orderData.quantity} dona\n`;
    message += `• Narx: ${orderData.total_price.toLocaleString()} so'm\n\n`;
    
    if (orderData.notes) {
      message += `📝 Izoh: ${orderData.notes}\n\n`;
    }
    
    message += `⚡ Tezda javob bering!`;

    // Action buttons
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Qabul qilish', callback_data: `group_order_accept_${orderData.id}` },
          { text: '❌ Rad etish', callback_data: `group_order_reject_${orderData.id}` }
        ],
        [
          { text: `📞 ${orderData.customer_phone}`, url: `tel:${orderData.customer_phone}` }
        ]
      ]
    };

    // Send with photo if available, otherwise send as text
    if (productData?.photo_url) {
      await botInstance.telegram.sendPhoto(ordersGroupId, productData.photo_url, {
        caption: message,
        reply_markup: keyboard
      });
    } else {
      await botInstance.telegram.sendMessage(ordersGroupId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
      });
    }

    console.log(`📢 Order notification sent to group for order #${orderData.id}`);
    return true;

  } catch (error) {
    console.error('📢 Error sending order notification:', error.message);
    return false;
  }
}

// Send feedback notification to admin group
async function sendFeedbackNotification(feedbackData, userData) {
  try {
    const feedbackGroupId = process.env.FEEDBACK_GROUP_ID;
    
    if (!feedbackGroupId || !botInstance) {
      console.log('📢 Feedback group not configured or bot not initialized');
      return false;
    }

    const feedbackDate = new Date().toLocaleString('uz-UZ');
    
    let message = `💬 YANGI FIKR!\n\n`;
    message += `🆔 Fikr: #${feedbackData.id}\n`;
    message += `📅 Sana: ${feedbackDate}\n\n`;
    message += `👤 FOYDALANUVCHI:\n`;
    message += `• Ism: ${userData?.first_name || 'Noma\'lum'}\n`;
    if (userData?.username) message += `• Username: @${userData.username}\n`;
    message += `• ID: ${feedbackData.user_id}\n\n`;
    message += `💬 XABAR:\n${feedbackData.message}\n\n`;
    message += `📋 Tur: ${feedbackData.type === 'complaint' ? '⚠️ Shikoyat' : '💬 Fikr'}`;

    // Action buttons
    const keyboard = {
      inline_keyboard: [
        [
          { text: '💬 Javob berish', callback_data: `group_feedback_respond_${feedbackData.id}` },
          { text: '✅ Ko\'rildi', callback_data: `group_feedback_read_${feedbackData.id}` }
        ]
      ]
    };

    await botInstance.telegram.sendMessage(feedbackGroupId, message, {
      reply_markup: keyboard
    });

    console.log(`📢 Feedback notification sent to group for feedback #${feedbackData.id}`);
    return true;

  } catch (error) {
    console.error('📢 Error sending feedback notification:', error.message);
    return false;
  }
}

// Send test message to check group configuration
async function testGroupConnection(groupType = 'orders') {
  try {
    const groupId = groupType === 'orders' ? process.env.ORDERS_GROUP_ID : process.env.FEEDBACK_GROUP_ID;
    
    if (!groupId || !botInstance) {
      return false;
    }

    const message = groupType === 'orders' 
      ? `🧪 TEST: Orders group connected successfully!\nBot can send order notifications here.`
      : `🧪 TEST: Feedback group connected successfully!\nBot can send feedback notifications here.`;

    await botInstance.telegram.sendMessage(groupId, message);
    return true;

  } catch (error) {
    console.error(`📢 Error testing ${groupType} group:`, error.message);
    return false;
  }
}

// Helper to get group chat ID (for setup)
async function getGroupChatId(ctx) {
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    console.log(`📢 Group Chat ID: ${ctx.chat.id}`);
    console.log(`📢 Group Title: ${ctx.chat.title}`);
    return ctx.chat.id;
  }
  return null;
}

module.exports = {
  initNotifications,
  sendOrderNotification,
  sendFeedbackNotification,
  testGroupConnection,
  getGroupChatId
};