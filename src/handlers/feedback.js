const { Scenes } = require('telegraf');
const { db } = require('../config/database');
const { getUserLanguage } = require('./products');

// Create feedback scene
const feedbackScene = new Scenes.BaseScene('feedback');

// Scene entry
feedbackScene.enter(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const language = await getUserLanguage(userId);
    
    let message;
    if (language === 'uz') {
      message = 
        `💬 FIKR BILDIRISH\n\n` +
        `Bizga fikr-mulohaza, taklif yoki shikoyatingizni yozing.\n` +
        `Barcha xabarlar admin tomonidan ko'rib chiqiladi.\n\n` +
        `Xabaringizni yozing:`;
    } else if (language === 'ru') {
      message = 
        `💬 ОБРАТНАЯ СВЯЗЬ\n\n` +
        `Напишите нам свои отзывы, предложения или жалобы.\n` +
        `Все сообщения будут рассмотрены администратором.\n\n` +
        `Напишите ваше сообщение:`;
    } else {
      message = 
        `💬 FEEDBACK\n\n` +
        `Write us your feedback, suggestions or complaints.\n` +
        `All messages will be reviewed by the administrator.\n\n` +
        `Write your message:`;
    }

    const cancelButton = [[{
      text: language === 'uz' ? '❌ Bekor qilish' :
            language === 'ru' ? '❌ Отмена' :
            '❌ Cancel',
      callback_data: 'cancel_feedback'
    }]];

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: cancelButton
      }
    });

  } catch (error) {
    console.error('Feedback scene enter error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
    ctx.scene.leave();
  }
});

// Handle feedback text
feedbackScene.on('text', async (ctx) => {
  try {
    const message = ctx.message.text.trim();
    const userId = ctx.from.id;
    const language = await getUserLanguage(userId);
    
    if (message.length < 5) {
      return await ctx.reply('❌ Iltimos, batafsil yozing (kamida 5 ta belgi)');
    }

    // Create feedback in database
    const feedbackData = {
      user_id: userId,
      message: message,
      type: 'feedback'
    };

    const feedback = await db.createFeedback(feedbackData);

    if (feedback) {
      let successMessage;
      if (language === 'uz') {
        successMessage = 
          `✅ FIKRINGIZ QABUL QILINDI!\n\n` +
          `Rahmat! Sizning xabaringiz admin tomonidan ` +
          `ko'rib chiqiladi va javob beriladi.\n\n` +
          `Xabar #${feedback.id}`;
      } else if (language === 'ru') {
        successMessage = 
          `✅ ВАШ ОТЗЫВ ПРИНЯТ!\n\n` +
          `Спасибо! Ваше сообщение будет рассмотрено ` +
          `администратором и получит ответ.\n\n` +
          `Сообщение #${feedback.id}`;
      } else {
        successMessage = 
          `✅ YOUR FEEDBACK RECEIVED!\n\n` +
          `Thank you! Your message will be reviewed ` +
          `by the administrator and answered.\n\n` +
          `Message #${feedback.id}`;
      }

      await ctx.reply(successMessage);
      
      // Send notification to admin group
      try {
        const { sendFeedbackNotification } = require('../utils/notifications');
        const userData = await db.getUser(userId);
        await sendFeedbackNotification(feedback, userData);
      } catch (notificationError) {
        console.error('Feedback notification error:', notificationError);
        // Don't fail the feedback if notification fails
      }
      
    } else {
      await ctx.reply('❌ Xatolik yuz berdi');
    }

  } catch (error) {
    console.error('Feedback creation error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  } finally {
    ctx.scene.leave();
  }
});

// Handle cancel
feedbackScene.action('cancel_feedback', async (ctx) => {
  const language = await getUserLanguage(ctx.from.id);
  const message = language === 'uz' ? '❌ Bekor qilindi' :
                  language === 'ru' ? '❌ Отменено' :
                  '❌ Cancelled';
  await ctx.editMessageText(message);
  ctx.scene.leave();
  await ctx.answerCbQuery();
});

// Start feedback function
async function startFeedback(ctx) {
  try {
    await ctx.scene.enter('feedback');
  } catch (error) {
    console.error('Start feedback error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

module.exports = {
  feedbackScene,
  startFeedback
};