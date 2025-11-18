const { Markup } = require('telegraf');
const { db } = require('../config/database');
const { getMessage } = require('../config/messages');

// Show products with interactive buttons
async function showProducts(ctx) {
  try {
    const userId = ctx.from.id;
    const user = await db.getUser(userId);
    const language = user?.language_code || 'uz';
    
    // Get all active products
    const products = await db.getAllProducts();
    
    if (products.length === 0) {
      return await ctx.reply(getMessage('noProducts', language));
    }

    // Create inline keyboard with product buttons
    const productButtons = [];
    
    products.forEach((product) => {
      const name = product[`name_${language}`] || product.name_uz;
      const price = product.price.toLocaleString();
      const stock = product.stock_quantity;
      
      const buttonText = `${name} - ${price} so'm (${stock} dona)`;
      
      productButtons.push([{
        text: buttonText,
        callback_data: `product_${product.id}`
      }]);
    });

    // Add back button
    const backText = language === 'uz' ? '◀️ Asosiy menyu' : 
                     language === 'ru' ? '◀️ Главное меню' : 
                     '◀️ Main Menu';
    
    productButtons.push([{
      text: backText,
      callback_data: 'back_to_menu'
    }]);

    const headerText = getMessage('productList', language);
    
    await ctx.reply(headerText, {
      reply_markup: {
        inline_keyboard: productButtons
      }
    });

  } catch (error) {
    console.error('Show products error:', error);
    const language = await getUserLanguage(ctx.from.id);
    await ctx.reply(getMessage('error', language));
  }
}

// Show individual product details
async function showProductDetails(ctx, productId) {
  try {
    const userId = ctx.from.id;
    const user = await db.getUser(userId);
    const language = user?.language_code || 'uz';
    
    const product = await db.getProduct(productId);
    
    if (!product) {
      return await ctx.reply('❌ Mahsulot topilmadi');
    }

    const name = product[`name_${language}`] || product.name_uz;
    const description = product[`description_${language}`] || product.description_uz || '';
    
    let message = `📦 ${name}\n\n`;
    
    if (description) {
      message += `📝 ${description}\n\n`;
    }
    
    message += `💰 Narx: ${product.price.toLocaleString()} so'm\n`;
    message += `📦 Qoldiq: ${product.stock_quantity} dona\n`;
    message += `📊 Minimal buyurtma: ${product.min_order} dona\n`;

    const buttons = [
      [{
        text: language === 'uz' ? '🛒 Buyurtma berish' :
              language === 'ru' ? '🛒 Заказать' :
              '🛒 Order',
        callback_data: `order_${productId}`
      }],
      [{
        text: language === 'uz' ? '◀️ Mahsulotlar' :
              language === 'ru' ? '◀️ Товары' :
              '◀️ Products',
        callback_data: 'show_products'
      }]
    ];

    if (product.photo_url) {
      await ctx.replyWithPhoto(product.photo_url, {
        caption: message,
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    } else {
      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    }

  } catch (error) {
    console.error('Product details error:', error);
    await ctx.reply('❌ Xatolik yuz berdi');
  }
}

// Helper function to get user language
async function getUserLanguage(userId) {
  try {
    const user = await db.getUser(userId);
    return user?.language_code || 'uz';
  } catch (error) {
    return 'uz';
  }
}

module.exports = {
  showProducts,
  showProductDetails,
  getUserLanguage
};