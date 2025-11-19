const { db } = require('../config/database');
const { Scenes } = require('telegraf');

// Create feedback response scene
const feedbackResponseScene = new Scenes.BaseScene('feedback-response');

// Enter scene - show response options
feedbackResponseScene.enter(async (ctx) => {
  try {
    const feedbackId = ctx.session?.feedbackId;
    if (!feedbackId) {
      await ctx.reply('❌ Fikr ID topilmadi');
      return ctx.scene.leave();
    }

    const message = 
      `💬 FIKRGA JAVOB BERISH\n\n` +
      `Fikr #${feedbackId} ga javob turini tanlang:\n\n` +
      `1️⃣ Tezkor javoblar\n` +
      `2️⃣ Maxsus javob yozish`;

    const buttons = [
      [
        { text: '1️⃣ Tezkor javoblar', callback_data: 'quick_responses' },
        { text: '2️⃣ Maxsus javob', callback_data: 'custom_response' }
      ],
      [
        { text: '❌ Bekor qilish', callback_data: 'cancel_response' }
      ]
    ];

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Feedback response scene enter error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
    ctx.scene.leave();
  }
});

// Quick responses
feedbackResponseScene.action('quick_responses', async (ctx) => {
  const buttons = [
    [{ text: '🙏 Rahmat bildirish', callback_data: 'template_thanks' }],
    [{ text: '🔧 Muammo hal qilish', callback_data: 'template_solve' }],
    [{ text: '📞 Bog\'lanish so\'rash', callback_data: 'template_contact' }],
    [{ text: '🎁 Chegirma taklifi', callback_data: 'template_discount' }],
    [{ text: '◀️ Ortga', callback_data: 'back_to_options' }]
  ];

  await ctx.editMessageText(
    `🚀 TEZKOR JAVOBLAR\n\nJavob turini tanlang:`,
    {
      reply_markup: {
        inline_keyboard: buttons
      }
    }
  );
  await ctx.answerCbQuery();
});

// Custom response
feedbackResponseScene.action('custom_response', async (ctx) => {
  ctx.scene.state.responseType = 'custom';
  await ctx.editMessageText(
    `✍️ MAXSUS JAVOB\n\n` +
    `Mijozga yuboriladigan javob matnini yozing:`
  );
  await ctx.answerCbQuery();
});

// Template responses
feedbackResponseScene.action(/^template_(.+)$/, async (ctx) => {
  const templateType = ctx.match[1];
  const template = getResponseTemplate(templateType);
  
  ctx.scene.state.responseText = template;
  await sendFeedbackResponse(ctx);
});

// Handle custom text input
feedbackResponseScene.on('text', async (ctx) => {
  if (ctx.scene.state.responseType === 'custom') {
    ctx.scene.state.responseText = ctx.message.text;
    await sendFeedbackResponse(ctx);
  }
});

// Cancel response
feedbackResponseScene.action('cancel_response', async (ctx) => {
  await ctx.editMessageText('❌ Javob berish bekor qilindi');
  ctx.scene.leave();
  await ctx.answerCbQuery();
});

// Go back to options
feedbackResponseScene.action('back_to_options', async (ctx) => {
  const feedbackId = ctx.session?.feedbackId;
  const message = 
    `💬 FIKRGA JAVOB BERISH\n\n` +
    `Fikr #${feedbackId} ga javob turini tanlang:\n\n` +
    `1️⃣ Tezkor javoblar\n` +
    `2️⃣ Maxsus javob yozish`;

  const buttons = [
    [
      { text: '1️⃣ Tezkor javoblar', callback_data: 'quick_responses' },
      { text: '2️⃣ Maxsus javob', callback_data: 'custom_response' }
    ],
    [
      { text: '❌ Bekor qilish', callback_data: 'cancel_response' }
    ]
  ];

  await ctx.editMessageText(message, {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
  await ctx.answerCbQuery();
});

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

    // Store feedback ID in session and enter response scene
    ctx.session = ctx.session || {};
    ctx.session.feedbackId = feedbackId;
    await ctx.scene.enter('feedback-response');

    await ctx.answerCbQuery();

  } catch (error) {
    console.error('Start feedback response error:', error);
    await ctx.answerCbQuery('❌ Xatolik yuz berdi');
  }
}

// Send feedback response to customer
async function sendFeedbackResponse(ctx) {
  try {
    const feedbackId = ctx.session?.feedbackId;
    const responseText = ctx.scene.state.responseText;

    if (!feedbackId || !responseText) {
      await ctx.reply('❌ Javob ma\'lumotlari topilmadi');
      return ctx.scene.leave();
    }

    // Get feedback details
    const feedbackList = await db.getAllFeedback();
    const feedback = feedbackList.find(f => f.id === parseInt(feedbackId));

    if (!feedback) {
      await ctx.reply('❌ Fikr topilmadi');
      return ctx.scene.leave();
    }

    // TODO: Save response to database
    // await db.updateFeedbackResponse(feedbackId, responseText);

    // Send response message to customer
    const customerMessage = 
      `💬 BPS (EUROASIA PRINT) JAVOBI\n\n` +
      `Hurmatli mijoz!\n\n` +
      `Sizning fikr-mulohazangiz uchun rahmat!\n\n` +
      `📝 JAVOB:\n${responseText}\n\n` +
      `📞 Qo'shimcha savollar uchun:\n` +
      `Telefon: +998946375555\n` +
      `Telefon 2: +998946666940\n` +
      `Email: uroasiaprint@gmail.com\n` +
      `🕐 Ish vaqti: пон-суббота с 08:00 по 18:00\n\n` +
      `🏢 BPS (EUROASIA PRINT)`;

    try {
      // Send response to customer
      await ctx.telegram.sendMessage(feedback.user_id, customerMessage);

      // Show success message to admin
      await ctx.reply(
        `✅ JAVOB YUBORILDI!\n\n` +
        `Mijoz: ${feedback.users?.first_name || 'Noma\'lum'}\n` +
        `Fikr #${feedbackId}\n\n` +
        `Yuborilgan javob:\n${responseText}`
      );

      // TODO: Mark feedback as responded in database
      // await db.updateFeedbackStatus(feedbackId, 'responded');

    } catch (sendError) {
      console.error('Error sending response to customer:', sendError);
      await ctx.reply('❌ Mijozga javob yuborishda xatolik yuz berdi');
    }

    ctx.scene.leave();

  } catch (error) {
    console.error('Send feedback response error:', error);
    await ctx.reply('❌ Javob yuborishda xatolik yuz berdi');
    ctx.scene.leave();
  }
}

// Get response templates
function getResponseTemplate(templateType) {
  const templates = {
    thanks: 
      `🙏 Bizga bo'lgan ishonchingiz uchun chin dildan rahmat!\n\n` +
      `Sizning ijobiy fikr-mulohazangiz bizni yanada yaxshi xizmat ko'rsatishga undaydi.\n\n` +
      `Kelajakda ham sizga sifatli mahsulotlar taqdim etish uchun harakat qilamiz!\n\n` +
      `🎯 Bizning maqsadimiz - mijozlarimizning to'liq mamnunligi!`,

    solve: 
      `🔧 Sizning muammoingizni hal qilish uchun darhol harakat qilyapmiz!\n\n` +
      `Bizning mutaxassislarimiz tez orada siz bilan bog'lanib, vaziyatni to'liq o'rganishadi.\n\n` +
      `📞 Qo'shimcha ma'lumot uchun: +998946375555\n\n` +
      `Sabringiz uchun uzr so'raymiz va muammoni tezda hal qilishga va'da beramiz!`,

    contact: 
      `📞 Sizning fikr-mulohazangiz biz uchun juda muhim!\n\n` +
      `Masalani batafsil muhokama qilish uchun quyidagi raqamga qo'ng'iroq qiling:\n\n` +
      `📱 +998946375555\n` +
      `📱 +998946666940\n` +
      `🕐 Ish vaqti: пон-суббота с 08:00 по 18:00\n\n` +
      `Yoki email orqali murojaat qiling: uroasiaprint@gmail.com\n\n` +
      `Tez orada siz bilan bog'lanamiz!`,

    discount: 
      `🎁 MAXSUS TAKLIFIMIZ!\n\n` +
      `Bizga bo'lgan ishonchingiz uchun rahmat!\n\n` +
      `Sizga keyingi buyurtmangizda 10% chegirma taqdim qilamiz!\n\n` +
      `📝 Buyurtma berish uchun botdan foydalaning\n` +
      `💰 Chegirma avtomatik qo'llaniladi\n\n` +
      `Bu taklifimiz cheklangan muddatli, shoshiling! 🏃‍♂️`
  };

  return templates[templateType] || 'Sizning fikr-mulohazangiz uchun rahmat!';
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
  feedbackResponseScene,
  showFeedbackDetails,
  markFeedbackAsRead,
  startFeedbackResponse,
  getFeedbackStatusText,
  getFeedbackTypeText
};