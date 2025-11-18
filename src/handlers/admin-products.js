const { Scenes } = require('telegraf');
const { db } = require('../config/database');
const { getUserLanguage } = require('./products');

// Add Product Scene
const addProductScene = new Scenes.BaseScene('add-product');

// Scene entry
addProductScene.enter(async (ctx) => {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      await ctx.reply('❌ Access denied');
      return ctx.scene.leave();
    }

    ctx.scene.state.step = 'name_uz';
    
    const message = 
      `➕ YANGI MAHSULOT QO'SHISH\n\n` +
      `1-qadam: Mahsulot nomini yozing (O'zbek tilida)\n` +
      `Masalan: A4 daftar 48 varaq`;

    const cancelButton = [[{
      text: '❌ Bekor qilish',
      callback_data: 'cancel_add_product'
    }]];

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: cancelButton
      }
    });

  } catch (error) {
    console.error('Add product scene enter error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
    ctx.scene.leave();
  }
});

// Handle text inputs for product creation
addProductScene.on('text', async (ctx) => {
  try {
    const step = ctx.scene.state.step;
    const text = ctx.message.text.trim();

    switch (step) {
      case 'name_uz':
        if (text.length < 3) {
          return await ctx.reply('❌ Mahsulot nomi kamida 3 ta belgi bo\'lishi kerak');
        }
        ctx.scene.state.name_uz = text;
        ctx.scene.state.step = 'name_ru';
        await ctx.reply(`✅ O'zbek: ${text}\n\n2-qadam: Rus tilidagi nomini yozing:`);
        break;

      case 'name_ru':
        if (text.length < 3) {
          return await ctx.reply('❌ Rus tilidagi nom kamida 3 ta belgi bo\'lishi kerak');
        }
        ctx.scene.state.name_ru = text;
        ctx.scene.state.step = 'name_en';
        await ctx.reply(`✅ Rus: ${text}\n\n3-qadam: Ingliz tilidagi nomini yozing:`);
        break;

      case 'name_en':
        if (text.length < 3) {
          return await ctx.reply('❌ Ingliz tilidagi nom kamida 3 ta belgi bo\'lishi kerak');
        }
        ctx.scene.state.name_en = text;
        ctx.scene.state.step = 'price';
        await ctx.reply(`✅ English: ${text}\n\n4-qadam: Narxini yozing (so'mda, faqat raqam):`);
        break;

      case 'price':
        const price = parseFloat(text.replace(/\s/g, ''));
        if (isNaN(price) || price <= 0) {
          return await ctx.reply('❌ To\'g\'ri narx kiriting (masalan: 5000)');
        }
        ctx.scene.state.price = price;
        ctx.scene.state.step = 'stock_quantity';
        await ctx.reply(`✅ Narx: ${price.toLocaleString()} so'm\n\n5-qadam: Qoldiq miqdorini yozing:`);
        break;

      case 'stock_quantity':
        const stock = parseInt(text);
        if (isNaN(stock) || stock < 0) {
          return await ctx.reply('❌ To\'g\'ri miqdor kiriting (masalan: 100)');
        }
        ctx.scene.state.stock_quantity = stock;
        ctx.scene.state.step = 'min_order';
        await ctx.reply(`✅ Qoldiq: ${stock} dona\n\n6-qadam: Minimal buyurtma miqdori:`);
        break;

      case 'min_order':
        const minOrder = parseInt(text);
        if (isNaN(minOrder) || minOrder <= 0) {
          return await ctx.reply('❌ To\'g\'ri miqdor kiriting (masalan: 10)');
        }
        ctx.scene.state.min_order = minOrder;
        ctx.scene.state.step = 'description_uz';
        
        const skipButton = [[{
          text: '⏭️ O\'tkazib yuborish',
          callback_data: 'skip_description'
        }]];
        
        await ctx.reply(
          `✅ Minimal: ${minOrder} dona\n\n7-qadam: Mahsulot haqida qisqacha ma'lumot (ixtiyoriy):`,
          {
            reply_markup: {
              inline_keyboard: skipButton
            }
          }
        );
        break;

      case 'description_uz':
        ctx.scene.state.description_uz = text;
        ctx.scene.state.step = 'photo';
        
        const photoSkipButton = [[{
          text: '⏭️ Fotosiz saqlash',
          callback_data: 'skip_photo'
        }]];
        
        await ctx.reply(
          `✅ Tavsif: ${text}\n\n8-qadam: Mahsulot rasmini yuboring (ixtiyoriy):`,
          {
            reply_markup: {
              inline_keyboard: photoSkipButton
            }
          }
        );
        break;
    }

  } catch (error) {
    console.error('Add product scene text error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
    ctx.scene.leave();
  }
});

// Handle photo uploads
addProductScene.on('photo', async (ctx) => {
  const step = ctx.scene.state.step;
  
  if (step === 'photo') {
    try {
      // Get the largest photo
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      
      // Get file path from Telegram to create web URL
      const fileInfo = await ctx.telegram.getFile(photo.file_id);
      const webUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;
      
      // Store both formats:
      // - file_id for Telegram bot (native support)
      // - web URL for Mini App (browser support)
      ctx.scene.state.photo_url = photo.file_id;  // For bot
      ctx.scene.state.image_url = webUrl;         // For web
      
      console.log('📷 Photo stored:');
      console.log('  File ID (bot):', photo.file_id);
      console.log('  Web URL (app):', webUrl);
      
      await ctx.reply('📸 Rasm saqlandi!\n\nMahsulot yaratilmoqda...');
      await createProductInDB(ctx);
    } catch (error) {
      console.error('Photo handling error:', error);
      await ctx.reply('❌ Rasm yuklanmadi, qayta urinib ko\'ring');
    }
  }
});

// Skip description
addProductScene.action('skip_description', async (ctx) => {
  ctx.scene.state.description_uz = '';
  ctx.scene.state.step = 'photo';
  
  const photoSkipButton = [[{
    text: '⏭️ Fotosiz saqlash',
    callback_data: 'skip_photo'
  }]];
  
  await ctx.editMessageText(
    `✅ Tavsif o'tkazildi\n\n8-qadam: Mahsulot rasmini yuboring (ixtiyoriy):`,
    {
      reply_markup: {
        inline_keyboard: photoSkipButton
      }
    }
  );
  await ctx.answerCbQuery();
});

// Skip photo
addProductScene.action('skip_photo', async (ctx) => {
  ctx.scene.state.photo_url = null;
  await ctx.editMessageText('✅ Fotosiz saqlash\n\nMahsulot yaratilmoqda...');
  await createProductInDB(ctx);
  await ctx.answerCbQuery();
});

// Cancel product creation
addProductScene.action('cancel_add_product', async (ctx) => {
  await ctx.editMessageText('❌ Mahsulot qo\'shish bekor qilindi');
  ctx.scene.leave();
  await ctx.answerCbQuery();
});

// Create product in database
async function createProductInDB(ctx) {
  try {
    const state = ctx.scene.state;
    
    const productData = {
      name_uz: state.name_uz,
      name_ru: state.name_ru,
      name_en: state.name_en,
      price: state.price,
      stock_quantity: state.stock_quantity,
      min_order: state.min_order,
      description_uz: state.description_uz || null,
      description_ru: state.description_uz || null, // Copy UZ description for now
      description_en: state.description_uz || null,
      photo_url: state.photo_url || null,  // Telegram file_id
      image_url: state.image_url || null,  // Web URL
      is_active: true
    };

    const product = await db.createProduct(productData);
    
    if (product) {
      const successMessage = 
        `✅ MAHSULOT QO'SHILDI!\n\n` +
        `📦 Nom: ${state.name_uz}\n` +
        `💰 Narx: ${state.price.toLocaleString()} so'm\n` +
        `📊 Qoldiq: ${state.stock_quantity} dona\n` +
        `📋 ID: ${product.id}\n\n` +
        `Mahsulot muvaffaqiyatli qo'shildi va foydalanuvchilar uchun mavjud!`;

      await ctx.reply(successMessage);
      
      // Back to admin products
      setTimeout(async () => {
        const { showAdminProducts } = require('./admin');
        const buttons = [[{
          text: '📦 Mahsulotlar boshqaruvi',
          callback_data: 'admin_products'
        }]];
        
        await ctx.reply('Yana mahsulot qo\'shishni xohlaysizmi?', {
          reply_markup: {
            inline_keyboard: buttons
          }
        });
      }, 2000);
      
    } else {
      await ctx.reply('❌ Mahsulot yaratishda xatolik');
    }

  } catch (error) {
    console.error('Create product error:', error);
    await ctx.reply('❌ Ma\'lumotlar bazasida xatolik');
  } finally {
    ctx.scene.leave();
  }
}

// Edit Product Scene
const editProductScene = new Scenes.BaseScene('edit-product');

// Scene entry
editProductScene.enter(async (ctx) => {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      await ctx.reply('❌ Access denied');
      return ctx.scene.leave();
    }

    const productId = ctx.session?.editProductId;
    if (!productId) {
      await ctx.reply('❌ Mahsulot ID topilmadi');
      return ctx.scene.leave();
    }

    // Get product data
    console.log('🔍 GETTING PRODUCT:', { productId });
    const product = await db.getProduct(productId);
    console.log('📦 PRODUCT FOUND:', product);
    
    if (!product) {
      await ctx.reply('❌ Mahsulot topilmadi');
      return ctx.scene.leave();
    }

    // Store product data in scene state
    ctx.scene.state.product = product;
    ctx.scene.state.productId = productId;
    console.log('💾 SCENE STATE SET:', { productId, productName: product.name_uz });
    
    const message = 
      `✏️ MAHSULOT TAHRIRLASH\n\n` +
      `📦 ${product.name_uz}\n` +
      `💰 ${product.price.toLocaleString()} so'm\n` +
      `📊 Qoldiq: ${product.stock_quantity} dona\n` +
      `📋 Minimal: ${product.min_order} dona\n\n` +
      `Nimani o'zgartirmoqchisiz?`;

    const buttons = [
      [
        { text: '📝 Nomi', callback_data: 'edit_name' },
        { text: '💰 Narxi', callback_data: 'edit_price' }
      ],
      [
        { text: '📊 Qoldig\'i', callback_data: 'edit_stock' },
        { text: '📋 Minimal', callback_data: 'edit_min_order' }
      ],
      [
        { text: '📄 Tavsifi', callback_data: 'edit_description' },
        { text: '📸 Rasmi', callback_data: 'edit_photo' }
      ],
      [
        { text: '🗑️ O\'chirish', callback_data: 'delete_product' },
        { text: '❌ Bekor qilish', callback_data: 'cancel_edit' }
      ]
    ];

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Edit product scene enter error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
    ctx.scene.leave();
  }
});

// Handle edit actions
editProductScene.action('edit_name', async (ctx) => {
  ctx.scene.state.editField = 'name';
  await ctx.editMessageText(
    `✏️ YANGI NOM\n\n` +
    `Hozirgi nom: ${ctx.scene.state.product.name_uz}\n\n` +
    `Yangi nomni yozing (O'zbek tilida):`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '❌ Bekor qilish', callback_data: 'cancel_edit' }
        ]]
      }
    }
  );
  await ctx.answerCbQuery();
});

editProductScene.action('edit_price', async (ctx) => {
  ctx.scene.state.editField = 'price';
  await ctx.editMessageText(
    `💰 YANGI NARX\n\n` +
    `Hozirgi narx: ${ctx.scene.state.product.price.toLocaleString()} so'm\n\n` +
    `Yangi narxni yozing (so'mda):`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '❌ Bekor qilish', callback_data: 'cancel_edit' }
        ]]
      }
    }
  );
  await ctx.answerCbQuery();
});

editProductScene.action('edit_stock', async (ctx) => {
  ctx.scene.state.editField = 'stock';
  await ctx.editMessageText(
    `📊 YANGI QOLDIQ\n\n` +
    `Hozirgi qoldiq: ${ctx.scene.state.product.stock_quantity} dona\n\n` +
    `Yangi qoldiq miqdorini yozing:`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '❌ Bekor qilish', callback_data: 'cancel_edit' }
        ]]
      }
    }
  );
  await ctx.answerCbQuery();
});

editProductScene.action('edit_min_order', async (ctx) => {
  ctx.scene.state.editField = 'min_order';
  await ctx.editMessageText(
    `📋 YANGI MINIMAL MIQDOR\n\n` +
    `Hozirgi minimal: ${ctx.scene.state.product.min_order} dona\n\n` +
    `Yangi minimal buyurtma miqdorini yozing:`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '❌ Bekor qilish', callback_data: 'cancel_edit' }
        ]]
      }
    }
  );
  await ctx.answerCbQuery();
});

editProductScene.action('edit_description', async (ctx) => {
  ctx.scene.state.editField = 'description';
  await ctx.editMessageText(
    `📄 YANGI TAVSIF\n\n` +
    `Hozirgi tavsif: ${ctx.scene.state.product.description_uz || 'Tavsif yo\'q'}\n\n` +
    `Yangi tavsifni yozing:`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '❌ Bekor qilish', callback_data: 'cancel_edit' }
        ]]
      }
    }
  );
  await ctx.answerCbQuery();
});

editProductScene.action('edit_photo', async (ctx) => {
  ctx.scene.state.editField = 'photo';
  await ctx.editMessageText(
    `📸 YANGI RASM\n\n` +
    `Yangi rasm yuboring:`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '❌ Bekor qilish', callback_data: 'cancel_edit' }
        ]]
      }
    }
  );
  await ctx.answerCbQuery();
});

// Handle delete action
editProductScene.action('delete_product', async (ctx) => {
  const product = ctx.scene.state.product;
  
  const confirmMessage = 
    `🗑️ MAHSULOT O'CHIRISH\n\n` +
    `⚠️ OGOHLANTIRISH!\n\n` +
    `Siz "${product.name_uz}" mahsulotini o'chirmoqchisiz.\n` +
    `Bu amal qaytarib bo'lmaydi!\n\n` +
    `Rostdan ham o'chirmoqchimisiz?`;

  const buttons = [
    [
      { text: '✅ Ha, o\'chirish', callback_data: 'confirm_delete' },
      { text: '❌ Yo\'q, bekor qilish', callback_data: 'cancel_edit' }
    ]
  ];

  await ctx.editMessageText(confirmMessage, {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
  await ctx.answerCbQuery();
});

// Confirm deletion
editProductScene.action('confirm_delete', async (ctx) => {
  try {
    const product = ctx.scene.state.product;
    
    // Delete product from database
    const result = await db.deleteProduct(product.id);
    
    if (result) {
      await ctx.editMessageText(
        `✅ MAHSULOT O'CHIRILDI\n\n` +
        `"${product.name_uz}" mahsuloti muvaffaqiyatli o'chirildi.`
      );
      
      // Show admin products after delay
      setTimeout(async () => {
        const buttons = [[{
          text: '📦 Mahsulotlar boshqaruvi',
          callback_data: 'admin_products'
        }]];
        
        await ctx.reply('Admin paneliga qaytish uchun tugmani bosing:', {
          reply_markup: {
            inline_keyboard: buttons
          }
        });
      }, 1500);
    } else {
      await ctx.editMessageText('❌ Mahsulot o\'chirishda xatolik');
    }
    
  } catch (error) {
    console.error('🔥 DETAILED DELETE ERROR:', {
      message: error.message,
      stack: error.stack,
      details: error.details,
      hint: error.hint,
      code: error.code,
      product: ctx.scene.state.product,
      productId: ctx.scene.state.product?.id
    });
    await ctx.editMessageText('❌ Ma\'lumotlar bazasida xatolik: ' + error.message);
  } finally {
    ctx.scene.leave();
  }
  
  await ctx.answerCbQuery();
});

// Cancel edit
editProductScene.action('cancel_edit', async (ctx) => {
  await ctx.editMessageText('❌ Tahrirlash bekor qilindi');
  ctx.scene.leave();
  
  // Back to admin products
  setTimeout(async () => {
    const buttons = [[{
      text: '📦 Mahsulotlar boshqaruvi',
      callback_data: 'admin_products'
    }]];
    
    await ctx.reply('Admin paneliga qaytish uchun tugmani bosing:', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }, 1500);
  
  await ctx.answerCbQuery();
});

// Handle text inputs for editing
editProductScene.on('text', async (ctx) => {
  try {
    const editField = ctx.scene.state.editField;
    const text = ctx.message.text.trim();
    const product = ctx.scene.state.product;

    if (!editField) return;

    let updateData = {};
    let fieldName = '';

    switch (editField) {
      case 'name':
        if (text.length < 3) {
          return await ctx.reply('❌ Nom kamida 3 ta belgi bo\'lishi kerak');
        }
        updateData = {
          name_uz: text,
          name_ru: text, // For now, use same name
          name_en: text
        };
        fieldName = 'Nomi';
        break;

      case 'price':
        const price = parseFloat(text.replace(/\s/g, ''));
        if (isNaN(price) || price <= 0) {
          return await ctx.reply('❌ To\'g\'ri narx kiriting (masalan: 5000)');
        }
        updateData = { price: price };
        fieldName = 'Narxi';
        break;

      case 'stock':
        const stock = parseInt(text);
        if (isNaN(stock) || stock < 0) {
          return await ctx.reply('❌ To\'g\'ri miqdor kiriting (masalan: 100)');
        }
        updateData = { stock_quantity: stock };
        fieldName = 'Qoldigi';
        break;

      case 'min_order':
        const minOrder = parseInt(text);
        if (isNaN(minOrder) || minOrder <= 0) {
          return await ctx.reply('❌ To\'g\'ri miqdor kiriting (masalan: 10)');
        }
        updateData = { min_order: minOrder };
        fieldName = 'Minimal miqdori';
        break;

      case 'description':
        updateData = {
          description_uz: text,
          description_ru: text, // For now, use same description
          description_en: text
        };
        fieldName = 'Tavsifi';
        break;
    }

    // Update product in database
    console.log('🔄 UPDATING PRODUCT:', {
      productId: product.id,
      updateData: updateData,
      editField: editField
    });
    const result = await db.updateProduct(product.id, updateData);
    console.log('✅ UPDATE RESULT:', result);
    
    if (result) {
      await ctx.reply(
        `✅ YANGILANDI!\n\n` +
        `${fieldName} muvaffaqiyatli yangilandi.\n\n` +
        `Admin paneliga qaytilmoqda...`
      );
      
      // Back to admin products
      setTimeout(async () => {
        const buttons = [[{
          text: '📦 Mahsulotlar boshqaruvi',
          callback_data: 'admin_products'
        }]];
        
        await ctx.reply('Admin paneliga qaytish uchun tugmani bosing:', {
          reply_markup: {
            inline_keyboard: buttons
          }
        });
      }, 1500);
    } else {
      await ctx.reply('❌ Yangilashda xatolik');
    }

  } catch (error) {
    console.error('🔍 DETAILED ERROR - Edit product text error:', {
      error: error.message,
      stack: error.stack,
      editField: ctx.scene.state.editField,
      productId: ctx.scene.state.productId,
      text: ctx.message?.text,
      updateData: 'will show in next log'
    });
    await ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
  } finally {
    ctx.scene.leave();
  }
});

// Handle photo uploads for editing
editProductScene.on('photo', async (ctx) => {
  const editField = ctx.scene.state.editField;
  
  if (editField === 'photo') {
    try {
      const product = ctx.scene.state.product;
      
      // Get the largest photo
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      
      // Get file path from Telegram to create web URL
      const fileInfo = await ctx.telegram.getFile(photo.file_id);
      const webUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;
      
      // Update product with new photo
      const updateData = {
        photo_url: photo.file_id,  // For bot
        image_url: webUrl         // For web
      };
      
      const result = await db.updateProduct(product.id, updateData);
      
      if (result) {
        await ctx.reply(
          `📸 RASM YANGILANDI!\n\n` +
          `Mahsulot rasmi muvaffaqiyatli yangilandi.\n\n` +
          `Admin paneliga qaytilmoqda...`
        );
        
        // Back to admin products
        setTimeout(async () => {
          const buttons = [[{
            text: '📦 Mahsulotlar boshqaruvi',
            callback_data: 'admin_products'
          }]];
          
          await ctx.reply('Admin paneliga qaytish uchun tugmani bosing:', {
            reply_markup: {
              inline_keyboard: buttons
            }
          });
        }, 1500);
      } else {
        await ctx.reply('❌ Rasm yangilashda xatolik');
      }
      
    } catch (error) {
      console.error('Photo edit error:', error);
      await ctx.reply('❌ Rasm yuklanmadi, qayta urinib ko\'ring');
    } finally {
      ctx.scene.leave();
    }
  }
});

// Start add product function
async function startAddProduct(ctx) {
  try {
    await ctx.scene.enter('add-product');
  } catch (error) {
    console.error('Start add product error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

// Start edit product function
async function startEditProduct(ctx, productId) {
  try {
    // Store product ID in session before entering scene
    ctx.session = ctx.session || {};
    ctx.session.editProductId = productId;
    await ctx.scene.enter('edit-product');
  } catch (error) {
    console.error('Start edit product error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

module.exports = {
  addProductScene,
  editProductScene,
  startAddProduct,
  startEditProduct
};