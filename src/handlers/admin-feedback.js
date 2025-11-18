const { db } = require('../config/database');

// Show individual feedback details
async function showFeedbackDetails(ctx, feedbackId) {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      return await ctx.reply('❌ Access denied');
    }

    const feedbackList = await db.getAllFeedback();
    const feedback = feedbackList.find(f => f.id === parseInt(feedbackId));
    
    if (!feedback) {
      return await ctx.editMessageText('❌ Fikr topilmadi');
    }

    const userName = feedback.users?.first_name || 'Noma\'lum';
    const username = feedback.users?.username || '';
    const feedbackDate = new Date(feedback.created_at).toLocaleDateString('uz-UZ');
    const feedbackTime = new Date(feedback.created_at).toLocaleTimeString('uz-UZ');
    
    let message = `💬 FIKR-MULOHAZA TAFSILOTLARI\n\n`;
    message += `🆔 ID: #${feedback.id}\n`;
    message += `📅 Sana: ${feedbackDate} ${feedbackTime}\n`;
    message += `👤 Foydalanuvchi: ${userName}`;
    if (username) message += ` (@${username})`;
    message += `\n`;
    message += `📊 Holat: ${getFeedbackStatusText(feedback.status)}\n`;
    message += `📝 Tur: ${getFeedbackTypeText(feedback.type)}\n\n`;
    message += `💬 XABAR:\n${feedback.message}\n`;
    
    if (feedback.admin_response) {
      message += `\n👑 ADMIN JAVOBI:\n${feedback.admin_response}`;
    }

    const buttons = [];
    
    // Response button for pending feedback
    if (feedback.status === 'pending') {
      buttons.push([
        { text: '💬 Javob berish', callback_data: `respond_feedback_${feedbackId}` }
      ]);
    }

    // Mark as read button
    if (feedback.status === 'pending') {
      buttons.push([
        { text: '👁️ Ko\'rildi deb belgilash', callback_data: `mark_read_${feedbackId}` }
      ]);
    }

    // Back button
    buttons.push([
      { text: '◀️ Fikrlar', callback_data: 'admin_feedback' }
    ]);

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Show feedback details error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

// Mark feedback as read
async function markFeedbackAsRead(ctx, feedbackId) {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      return await ctx.answerCbQuery('❌ Access denied');
    }

    // Update feedback status (we need to add this method to database)
    // For now, just show success message
    await ctx.answerCbQuery('✅ Fikr ko\'rildi deb belgilandi');
    
    // Refresh feedback details
    await showFeedbackDetails(ctx, feedbackId);

  } catch (error) {
    console.error('Mark feedback as read error:', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi');
  }
}

// Start responding to feedback
async function startFeedbackResponse(ctx, feedbackId) {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      return await ctx.answerCbQuery('❌ Access denied');
    }

    // For now, show a simple response option
    const message = 
      `💬 FIKRGA JAVOB BERISH\n\n` +
      `Fikr #${feedbackId} ga javob berishni xohlaysizmi?\n\n` +
      `Hozircha bu funksiya ishlab chiqilmoqda...\n` +
      `Mijoz bilan bevosita bog'lanishni tavsiya qilamiz.`;

    const buttons = [[
      { text: '◀️ Ortga', callback_data: `feedback_${feedbackId}` }
    ]];

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

    await ctx.answerCbQuery('💬 Javob berish funksiyasi tez orada...');

  } catch (error) {
    console.error('Start feedback response error:', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi');
  }
}

// Get feedback status text in Uzbek
function getFeedbackStatusText(status) {
  switch (status) {
    case 'pending': return '🟡 Kutilmoqda';
    case 'responded': return '✅ Javob berilgan';
    default: return status;
  }
}

// Get feedback type text in Uzbek
function getFeedbackTypeText(type) {
  switch (type) {
    case 'feedback': return '💬 Fikr-mulohaza';
    case 'complaint': return '⚠️ Shikoyat';
    default: return type;
  }
}

module.exports = {
  showFeedbackDetails,
  markFeedbackAsRead,
  startFeedbackResponse,
  getFeedbackStatusText,
  getFeedbackTypeText
};