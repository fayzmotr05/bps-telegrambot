const { Scenes, Markup } = require('telegraf');
const { db } = require('../config/database');
const { getMessage } = require('../config/messages');
const { getUserLanguage } = require('./products');

// Create order scene
const orderScene = new Scenes.BaseScene('order');

// Scene entry - ask for quantity
orderScene.enter(async (ctx) => {
  try {
    const productId = ctx.scene.state.productId;
    const userId = ctx.from.id;
    const language = await getUserLanguage(userId);
    
    if (!productId) {
      await ctx.reply('❌ Mahsulot ma\'lumoti topilmadi');
      return ctx.scene.leave();
    }

    // Get product details
    const product = await db.getProduct(productId);
    if (!product) {
      await ctx.reply('❌ Mahsulot topilmadi');
      return ctx.scene.leave();
    }

    // Store product in scene state
    ctx.scene.state.product = product;
    
    const name = product[`name_${language}`] || product.name_uz;
    
    const priceLabel = language === 'uz' ? '💰 Narx:' : language === 'ru' ? '💰 Цена:' : '💰 Price:';
    const stockLabel = language === 'uz' ? '📦 Mavjud:' : language === 'ru' ? '📦 Доступно:' : '📦 Available:';
    const minOrderLabel = language === 'uz' ? '📊 Minimal:' : language === 'ru' ? '📊 Мин.:' : '📊 Min.:';
    const unitLabel = language === 'uz' ? 'dona' : language === 'ru' ? 'шт' : 'pcs';
    const currencyLabel = language === 'uz' ? "so'm" : language === 'ru' ? 'сум' : 'UZS';
    const quantityQuestion = language === 'uz' ? '❓ Necha dona buyurtma berishni xohlaysiz?' :
                            language === 'ru' ? '❓ Сколько штук вы хотите заказать?' :
                            '❓ How many pieces would you like to order?';
    const exampleText = language === 'uz' ? '(Raqam yozing, masalan:' :
                       language === 'ru' ? '(Напишите число, например:' :
                       '(Write a number, for example:';

    const message = 
      `📦 ${name}\n` +
      `${priceLabel} ${product.price.toLocaleString()} ${currencyLabel}\n` +
      `${stockLabel} ${product.stock_quantity} ${unitLabel}\n` +
      `${minOrderLabel} ${product.min_order} ${unitLabel}\n\n` +
      `${quantityQuestion}\n` +
      `${exampleText} ${product.min_order})`;

    const cancelButton = [[{
      text: language === 'uz' ? '❌ Bekor qilish' :
            language === 'ru' ? '❌ Отмена' :
            '❌ Cancel',
      callback_data: 'cancel_order'
    }]];

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: cancelButton
      }
    });

  } catch (error) {
    console.error('Order scene enter error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
    ctx.scene.leave();
  }
});

// Handle quantity input
orderScene.on('text', async (ctx) => {
  try {
    const step = ctx.scene.state.step || 'quantity';
    const userId = ctx.from.id;
    const language = await getUserLanguage(userId);
    
    if (step === 'quantity') {
      // Validate quantity
      const quantity = parseInt(ctx.message.text.trim());
      const product = ctx.scene.state.product;
      
      if (isNaN(quantity) || quantity <= 0) {
        return await ctx.reply('❌ Iltimos, to\'g\'ri raqam kiriting (masalan: 10)');
      }
      
      if (quantity < product.min_order) {
        return await ctx.reply(`❌ Minimal buyurtma: ${product.min_order} dona`);
      }
      
      if (quantity > product.stock_quantity) {
        return await ctx.reply(`❌ Qoldiqda faqat ${product.stock_quantity} dona bor`);
      }
      
      // Save quantity and ask for customer name
      ctx.scene.state.quantity = quantity;
      ctx.scene.state.totalPrice = quantity * product.price;
      ctx.scene.state.step = 'customer_name';
      
      await ctx.reply(
        `✅ Miqdor: ${quantity} dona\n` +
        `💰 Jami: ${ctx.scene.state.totalPrice.toLocaleString()} so'm\n\n` +
        `👤 Ismingizni yozing:`
      );
      
    } else if (step === 'customer_name') {
      // Save customer name and ask for phone
      const name = ctx.message.text.trim();
      
      if (name.length < 2) {
        return await ctx.reply('❌ Iltimos, to\'liq ismingizni yozing');
      }
      
      ctx.scene.state.customerName = name;
      ctx.scene.state.step = 'customer_phone';
      
      await ctx.reply(
        `👤 Ism: ${name}\n\n` +
        `📞 Telefon raqamingizni yozing:\n` +
        `(Masalan: +998901234567)`
      );
      
    } else if (step === 'customer_phone') {
      // Save phone and ask for notes
      const phone = ctx.message.text.trim();
      
      // Basic phone validation
      if (phone.length < 9) {
        return await ctx.reply('❌ Iltimos, to\'g\'ri telefon raqam yozing');
      }
      
      ctx.scene.state.customerPhone = phone;
      ctx.scene.state.step = 'notes';
      
      const skipButton = [[{
        text: language === 'uz' ? '⏭️ O\'tkazib yuborish' :
              language === 'ru' ? '⏭️ Пропустить' :
              '⏭️ Skip',
        callback_data: 'skip_notes'
      }]];
      
      await ctx.reply(
        `📞 Telefon: ${phone}\n\n` +
        `📝 Qo'shimcha izoh yoki talab yozing:\n` +
        `(Yoki o'tkazib yuboring)`,
        {
          reply_markup: {
            inline_keyboard: skipButton
          }
        }
      );
      
    } else if (step === 'notes') {
      // Save notes and create order
      const notes = ctx.message.text.trim();
      ctx.scene.state.notes = notes;
      
      await createOrder(ctx);
    }

  } catch (error) {
    console.error('Order scene text error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
    ctx.scene.leave();
  }
});

// Handle skip notes
orderScene.action('skip_notes', async (ctx) => {
  ctx.scene.state.notes = '';
  await createOrder(ctx);
  await ctx.answerCbQuery();
});

// Handle cancel
orderScene.action('cancel_order', async (ctx) => {
  const language = await getUserLanguage(ctx.from.id);
  await ctx.editMessageText(getMessage('cancel', language));
  ctx.scene.leave();
  await ctx.answerCbQuery();
});

// Create order function
async function createOrder(ctx) {
  try {
    const state = ctx.scene.state;
    const userId = ctx.from.id;
    const language = await getUserLanguage(userId);
    
    // Create order in database
    const orderData = {
      user_id: userId,
      product_id: state.product.id,
      quantity: state.quantity,
      total_price: state.totalPrice,
      customer_name: state.customerName,
      customer_phone: state.customerPhone,
      notes: state.notes || null
    };
    
    const order = await db.createOrder(orderData);
    
    if (order) {
      const product = state.product;
      const name = product[`name_${language}`] || product.name_uz;
      
      // Success message
      const successMessage = 
        `✅ BUYURTMA QABUL QILINDI!\n\n` +
        `📦 Mahsulot: ${name}\n` +
        `🔢 Miqdor: ${state.quantity} dona\n` +
        `💰 Jami: ${state.totalPrice.toLocaleString()} so'm\n` +
        `👤 Ism: ${state.customerName}\n` +
        `📞 Telefon: ${state.customerPhone}\n` +
        `${state.notes ? `📝 Izoh: ${state.notes}\n` : ''}` +
        `🆔 Buyurtma #${order.id}\n\n` +
        `Tez orada siz bilan bog'lanamiz!`;

      await ctx.reply(successMessage);
      
      // Send notification to admin group
      try {
        const { sendOrderNotification } = require('../utils/notifications');
        const userData = await db.getUser(userId);
        await sendOrderNotification(order, state.product, userData);
      } catch (notificationError) {
        console.error('Order notification error:', notificationError);
        // Don't fail the order if notification fails
      }
      
      // Navigation buttons
      const buttons = [
        [{
          text: language === 'uz' ? '📱 Katalogga qaytish' :
                language === 'ru' ? '📱 Вернуться в каталог' :
                '📱 Back to Catalog',
          web_app: { url: process.env.MINI_APP_URL || 'https://bps-telegrambot.vercel.app' }
        }],
        [{
          text: language === 'uz' ? '🏠 Asosiy menyu' :
                language === 'ru' ? '🏠 Главное меню' :
                '🏠 Main Menu',
          callback_data: 'back_to_menu'
        }]
      ];
      
      const nextMessage = language === 'uz' ? 'Yana buyurtma berishni xohlaysizmi?' :
                          language === 'ru' ? 'Хотите сделать еще один заказ?' :
                          'Would you like to place another order?';
      
      await ctx.reply(nextMessage, {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
      
    } else {
      await ctx.reply('❌ Buyurtma yaratishda xatolik');
    }

  } catch (error) {
    console.error('🔥 DETAILED CREATE ORDER ERROR:', {
      message: error.message,
      stack: error.stack,
      orderData: {
        user_id: ctx.from.id,
        product_id: ctx.scene.state?.product?.id,
        quantity: ctx.scene.state?.quantity,
        total_price: ctx.scene.state?.totalPrice,
        customer_name: ctx.scene.state?.customerName,
        customer_phone: ctx.scene.state?.customerPhone,
        notes: ctx.scene.state?.notes
      },
      sceneState: ctx.scene.state
    });
    await ctx.reply('❌ Buyurtma yaratishda xatolik: ' + error.message);
  } finally {
    ctx.scene.leave();
  }
}

// Order handler function
async function startOrder(ctx, productId) {
  try {
    await ctx.scene.enter('order', { productId });
  } catch (error) {
    console.error('Start order error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

module.exports = {
  orderScene,
  startOrder
};