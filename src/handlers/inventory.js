const { Scenes } = require('telegraf');
const { db } = require('../config/database');
const { getUserLanguage } = require('./products');

// Bulk Stock Update Scene
const bulkStockScene = new Scenes.BaseScene('bulk-stock-update');

bulkStockScene.enter(async (ctx) => {
  try {
    // Verify admin access
    if (parseInt(ctx.from.id) !== parseInt(process.env.ADMIN_USER_ID)) {
      await ctx.reply('❌ Access denied');
      return ctx.scene.leave();
    }

    const message = 
      `📦 BULK STOCK UPDATE\n\n` +
      `Choose an option:\n` +
      `1. Update specific product stock\n` +
      `2. Add stock to all products\n` +
      `3. Set low stock alerts\n` +
      `4. View low stock report`;

    const buttons = [
      [{ text: '🎯 Specific Product', callback_data: 'bulk_specific' }],
      [{ text: '📈 Add to All', callback_data: 'bulk_add_all' }],
      [{ text: '🔔 Set Alerts', callback_data: 'bulk_alerts' }],
      [{ text: '📊 Low Stock Report', callback_data: 'bulk_report' }],
      [{ text: '❌ Cancel', callback_data: 'cancel_bulk' }]
    ];

    await ctx.reply(message, {
      reply_markup: { inline_keyboard: buttons }
    });

  } catch (error) {
    console.error('Bulk stock scene enter error:', error);
    await ctx.reply('❌ Error occurred');
    ctx.scene.leave();
  }
});

// Handle specific product stock update
bulkStockScene.action('bulk_specific', async (ctx) => {
  ctx.scene.state.mode = 'specific';
  ctx.scene.state.step = 'product_id';
  
  await ctx.editMessageText(
    `🎯 SPECIFIC PRODUCT UPDATE\n\n` +
    `Enter the Product ID you want to update:`
  );
  await ctx.answerCbQuery();
});

// Handle add stock to all products
bulkStockScene.action('bulk_add_all', async (ctx) => {
  ctx.scene.state.mode = 'add_all';
  ctx.scene.state.step = 'amount';
  
  await ctx.editMessageText(
    `📈 ADD STOCK TO ALL PRODUCTS\n\n` +
    `Enter the amount to add to all products:`
  );
  await ctx.answerCbQuery();
});

// Handle low stock report
bulkStockScene.action('bulk_report', async (ctx) => {
  try {
    const lowStockProducts = await db.getLowStockProducts(10); // Products with <= 10 stock
    
    if (lowStockProducts.length === 0) {
      await ctx.editMessageText('✅ All products have sufficient stock!');
    } else {
      let reportMessage = `⚠️ LOW STOCK REPORT (${lowStockProducts.length} items)\n\n`;
      
      lowStockProducts.forEach((product, index) => {
        reportMessage += 
          `${index + 1}. ${product.name_uz}\n` +
          `   📦 Stock: ${product.stock_quantity}\n` +
          `   🆔 ID: ${product.id}\n\n`;
      });
      
      reportMessage += `Use /admin → Inventory → Update to restock items.`;
      
      await ctx.editMessageText(reportMessage);
    }
    
    setTimeout(() => ctx.scene.leave(), 3000);
  } catch (error) {
    console.error('Low stock report error:', error);
    await ctx.editMessageText('❌ Error generating report');
    ctx.scene.leave();
  }
  await ctx.answerCbQuery();
});

// Handle text inputs
bulkStockScene.on('text', async (ctx) => {
  try {
    const { mode, step } = ctx.scene.state;
    const text = ctx.message.text.trim();

    if (mode === 'specific') {
      if (step === 'product_id') {
        const productId = parseInt(text);
        if (isNaN(productId)) {
          return await ctx.reply('❌ Please enter a valid Product ID (number)');
        }
        
        // Verify product exists
        const product = await db.getProduct(productId);
        if (!product) {
          return await ctx.reply('❌ Product not found. Please check the ID.');
        }
        
        ctx.scene.state.productId = productId;
        ctx.scene.state.step = 'new_stock';
        
        await ctx.reply(
          `✅ Product found: ${product.name_uz}\n` +
          `Current stock: ${product.stock_quantity}\n\n` +
          `Enter the new stock quantity:`
        );
        
      } else if (step === 'new_stock') {
        const newStock = parseInt(text);
        if (isNaN(newStock) || newStock < 0) {
          return await ctx.reply('❌ Please enter a valid stock quantity (0 or more)');
        }
        
        await updateProductStock(ctx, ctx.scene.state.productId, newStock);
      }
    } else if (mode === 'add_all') {
      if (step === 'amount') {
        const amount = parseInt(text);
        if (isNaN(amount) || amount <= 0) {
          return await ctx.reply('❌ Please enter a positive number');
        }
        
        await addStockToAllProducts(ctx, amount);
      }
    }

  } catch (error) {
    console.error('Bulk stock text error:', error);
    await ctx.reply('❌ Error occurred');
    ctx.scene.leave();
  }
});

// Cancel bulk operations
bulkStockScene.action('cancel_bulk', async (ctx) => {
  await ctx.editMessageText('❌ Bulk operation cancelled');
  ctx.scene.leave();
  await ctx.answerCbQuery();
});

// Update specific product stock
async function updateProductStock(ctx, productId, newStock) {
  try {
    const result = await db.updateProductStock(productId, newStock);
    
    if (result) {
      await ctx.reply(
        `✅ STOCK UPDATED SUCCESSFULLY!\n\n` +
        `Product ID: ${productId}\n` +
        `New stock quantity: ${newStock}\n\n` +
        `The update has been applied and customers will see the new stock level.`
      );
    } else {
      await ctx.reply('❌ Failed to update stock. Please try again.');
    }
    
  } catch (error) {
    console.error('Update product stock error:', error);
    await ctx.reply('❌ Database error occurred');
  } finally {
    ctx.scene.leave();
  }
}

// Add stock to all active products
async function addStockToAllProducts(ctx, amount) {
  try {
    const result = await db.addStockToAllProducts(amount);
    
    if (result) {
      await ctx.reply(
        `✅ BULK STOCK UPDATE COMPLETED!\n\n` +
        `Added ${amount} units to all active products.\n` +
        `${result.count || 'All'} products were updated.\n\n` +
        `This change is now reflected in the catalog.`
      );
    } else {
      await ctx.reply('❌ Failed to update stock. Please try again.');
    }
    
  } catch (error) {
    console.error('Add stock to all error:', error);
    await ctx.reply('❌ Database error occurred');
  } finally {
    ctx.scene.leave();
  }
}

// Automated inventory monitoring function
async function checkLowStock(bot) {
  try {
    const lowStockProducts = await db.getLowStockProducts(5); // Alert when <= 5 items
    
    if (lowStockProducts.length > 0) {
      const adminId = process.env.ADMIN_USER_ID;
      
      let alertMessage = 
        `🚨 LOW STOCK ALERT!\n\n` +
        `${lowStockProducts.length} product(s) need restocking:\n\n`;
      
      lowStockProducts.forEach((product, index) => {
        alertMessage += 
          `${index + 1}. ${product.name_uz}\n` +
          `   📦 Only ${product.stock_quantity} left\n` +
          `   🆔 ID: ${product.id}\n\n`;
      });
      
      alertMessage += 
        `💡 Use /admin → Inventory Management to restock.\n` +
        `⚠️ Products with 0 stock will be hidden from customers.`;
      
      const buttons = [[{
        text: '📦 Manage Inventory',
        callback_data: 'admin_inventory'
      }]];
      
      await bot.telegram.sendMessage(adminId, alertMessage, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      console.log(`📦 Low stock alert sent for ${lowStockProducts.length} products`);
    }
    
  } catch (error) {
    console.error('Low stock check error:', error);
  }
}

// Auto-restock feature (if enabled)
async function autoRestockProducts(bot) {
  try {
    const outOfStockProducts = await db.getOutOfStockProducts();
    const restockRules = await db.getRestockRules(); // Custom restock rules per product
    
    for (const product of outOfStockProducts) {
      const rule = restockRules.find(r => r.product_id === product.id);
      
      if (rule && rule.auto_restock_enabled) {
        const restockAmount = rule.restock_quantity || 50; // Default 50 units
        
        await db.updateProductStock(product.id, restockAmount);
        
        const adminId = process.env.ADMIN_USER_ID;
        await bot.telegram.sendMessage(adminId, 
          `🔄 AUTO-RESTOCKED:\n\n` +
          `📦 ${product.name_uz}\n` +
          `➕ Added: ${restockAmount} units\n` +
          `🆔 ID: ${product.id}\n\n` +
          `Product is now available in the catalog.`
        );
        
        console.log(`🔄 Auto-restocked ${product.name_uz} with ${restockAmount} units`);
      }
    }
    
  } catch (error) {
    console.error('Auto-restock error:', error);
  }
}

// Start bulk stock function
async function startBulkStock(ctx) {
  try {
    await ctx.scene.enter('bulk-stock-update');
  } catch (error) {
    console.error('Start bulk stock error:', error);
    await ctx.reply('❌ Error occurred');
  }
}

// Initialize inventory monitoring (call this from main bot file)
function initInventoryMonitoring(bot) {
  // Check low stock every hour
  setInterval(() => {
    checkLowStock(bot);
  }, 60 * 60 * 1000); // 1 hour
  
  // Auto-restock check every 6 hours (if enabled)
  setInterval(() => {
    autoRestockProducts(bot);
  }, 6 * 60 * 60 * 1000); // 6 hours
  
  console.log('📦 Inventory monitoring initialized');
}

module.exports = {
  bulkStockScene,
  startBulkStock,
  initInventoryMonitoring,
  checkLowStock,
  autoRestockProducts
};