# Claude Code - Step-by-Step Development Commands

## 🚀 Setup Instructions

**IMPORTANT:** Copy these commands ONE AT A TIME to Claude Code. Wait for each step to complete before moving to the next.

---

## Phase 1: Project Initialization

### Step 1.1: Create Project Structure

```
Create a new Node.js project with the following structure:

bts-telegram-bot/
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── config/
│   ├── constants.js
│   ├── database.js
│   └── google-sheets.js
├── bot/
│   ├── index.js
│   ├── middleware/
│   │   ├── checkRole.js
│   │   └── logger.js
│   ├── handlers/
│   │   ├── start.js
│   │   ├── catalog.js
│   │   ├── order.js
│   │   ├── feedback.js
│   │   └── contact.js
│   ├── admin/
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── feedback.js
│   │   └── stats.js
│   ├── keyboards/
│   │   ├── main.js
│   │   ├── catalog.js
│   │   └── admin.js
│   └── utils/
│       ├── messages.js
│       └── helpers.js
├── api/
│   ├── index.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── categories.js
│   │   └── orders.js
│   └── middleware/
│       └── telegram-auth.js
├── mini-app/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── scripts/
    ├── seed-database.js
    └── setup-admin.js

Use these dependencies in package.json:
- telegraf@^4.15.0
- express@^4.18.2
- @supabase/supabase-js@^2.38.0
- dotenv@^16.3.1
- axios@^1.6.0
- googleapis@^128.0.0 (for Google Sheets)

Dev dependencies:
- nodemon@^3.0.1
```

---

### Step 1.2: Create Config Files

```
Create config/constants.js with the following mock data structure:

module.exports = {
  COMPANY: {
    name: 'BTS (Euroasia Print)',
    name_uz: 'BTS (Euroasia Print)',
    phone: '+998712345678',
    phone2: '+998901234567',
    email: 'info@bts.uz',
    address: 'Tashkent, Yunusabad tumani, Amir Temur ko\'chasi 123',
    address_uz: 'Toshkent, Yunusobod tumani, Amir Temur ko\'chasi 123',
    workingHours: '09:00 - 18:00 (Mon-Fri)',
    workingHours_uz: '09:00 - 18:00 (Dush-Juma)',
    latitude: 41.311081,
    longitude: 69.240562,
    website: 'https://bts.uz',
    telegram: '@bts_uz',
    instagram: '@bts_euroasia'
  },

  ADMIN_IDS: [
    123456789  // REPLACE WITH REAL TELEGRAM ID
  ],

  MESSAGES: {
    welcome: {
      uz: '👋 Assalomu aleykum! BTS kompaniyasining botiga xush kelibsiz.\n\n📚 Biz yuqori sifatli daftar va qadoqlar ishlab chiqaramiz.',
      ru: '👋 Здравствуйте! Добро пожаловать в бот компании BTS.\n\n📚 Мы производим высококачественные тетради и упаковку.'
    },
    orderReceived: {
      uz: '✅ Buyurtmangiz qabul qilindi!\n\nMenejerimiz tez orada siz bilan bog\'lanadi.',
      ru: '✅ Ваш заказ принят!\n\nНаш менеджер скоро свяжется с вами.'
    },
    orderError: {
      uz: '❌ Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.',
      ru: '❌ Произошла ошибка. Пожалуйста, попробуйте снова.'
    }
  },

  MOCK_CATEGORIES: [
    { name: 'Notebooks', name_uz: 'Daftarlar', icon: '📚' },
    { name: 'Packages', name_uz: 'Qadoqlar', icon: '📦' },
    { name: 'Office Supplies', name_uz: 'Kantselyariya', icon: '✏️' }
  ],

  MOCK_PRODUCTS: [
    {
      name: 'A4 Notebook 48 pages',
      name_uz: 'A4 daftar 48 varaq',
      category: 'Notebooks',
      price: 5000,
      stock: 500,
      description: 'High quality notebook for school and office',
      description_uz: 'Maktab va ofis uchun yuqori sifatli daftar',
      minOrder: 10,
      image_url: 'https://via.placeholder.com/400x400?text=A4+Notebook'
    },
    {
      name: 'A5 Notebook 96 pages',
      name_uz: 'A5 daftar 96 varaq',
      category: 'Notebooks',
      price: 8000,
      stock: 300,
      description: 'Premium quality thick notebook',
      description_uz: 'Premium sifatli qalin daftar',
      minOrder: 5,
      image_url: 'https://via.placeholder.com/400x400?text=A5+Notebook'
    },
    {
      name: 'Cardboard Box Medium',
      name_uz: 'Karton quti (o\'rta)',
      category: 'Packages',
      price: 3000,
      stock: 1000,
      description: 'Durable cardboard packaging box',
      description_uz: 'Mustahkam karton qadoqlash qutisi',
      minOrder: 50,
      image_url: 'https://via.placeholder.com/400x400?text=Box'
    }
  ]
};

IMPORTANT: Keep all company data in this file. Never hardcode it elsewhere.
```

---

### Step 1.3: Create Database Config

```
Create config/database.js:

Import @supabase/supabase-js and create Supabase client using environment variables:
- SUPABASE_URL
- SUPABASE_ANON_KEY

Export a singleton instance of the client.
Add error handling for missing environment variables.

Also export helper functions:
- getProducts(filters): Get products with optional category filter
- getProductById(id): Get single product
- createOrder(orderData): Create new order
- getOrders(filters): Get orders with optional status filter
- updateOrderStatus(orderId, status): Update order status
- createFeedback(feedbackData): Create feedback entry
- getUserRole(telegramId): Get user role (returns 'admin' or 'client')

Use async/await and proper error handling for all functions.
```

---

### Step 1.4: Create Environment Template

```
Create .env.example file with:

# Telegram Bot
BOT_TOKEN=your_bot_token_here
WEBHOOK_URL=https://your-app.up.railway.app
MINI_APP_URL=https://your-app.vercel.app

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Google Sheets (Optional)
GOOGLE_SHEETS_ENABLED=false
GOOGLE_SPREADSHEET_ID=your_sheet_id
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key_here

# Server
PORT=3000
NODE_ENV=development

# Admin
FIRST_ADMIN_ID=123456789

Also create .gitignore with node_modules, .env, and common patterns.
```

---

## Phase 2: Bot Core

### Step 2.1: Create Main Bot File

```
Create bot/index.js:

1. Import Telegraf and dotenv
2. Load environment variables
3. Import constants from config/constants.js
4. Import database helpers from config/database.js
5. Create bot instance with BOT_TOKEN
6. Import and use middleware (checkRole, logger)
7. Import and register all handlers (start, catalog, order, feedback, contact)
8. Import and register admin handlers
9. Add error handling middleware
10. Export bot instance

Use webhooks if WEBHOOK_URL is set, otherwise use polling for development.

Add graceful shutdown handling (SIGINT, SIGTERM).
```

---

### Step 2.2: Create Role Checking Middleware

```
Create bot/middleware/checkRole.js:

Function: checkRole(requiredRole)

1. Returns middleware function that checks user role from database
2. If user not found, create with role 'client'
3. Check if user.id is in ADMIN_IDS array (from constants), set role to 'admin'
4. Store role in ctx.state.userRole
5. If requiredRole is 'admin' and user is not admin, send error message and return
6. Call next() if authorized

Use getUserRole() from database.js
Add proper error handling
```

---

### Step 2.3: Create Main Keyboards

```
Create bot/keyboards/main.js:

Export two keyboard functions:

1. getClientKeyboard():
   Returns Telegraf keyboard with buttons:
   - 📦 Mahsulotlar | 📊 Qoldiqlar
   - 📝 Buyurtma | 💬 Fikr bildirish
   - 📞 Kontakt | ℹ️ Ma'lumot

2. getAdminKeyboard():
   Returns same as client keyboard plus:
   - 👨‍💼 Admin Panel (in new row)

Use Telegraf's Markup.keyboard() and resize_keyboard: true
```

---

### Step 2.4: Create Start Handler

```
Create bot/handlers/start.js:

1. Import MESSAGES and COMPANY from config/constants.js
2. Import getClientKeyboard, getAdminKeyboard from keyboards/main.js
3. Import getUserRole from config/database.js

Handler logic:
- Get user data from ctx.from
- Check user role using getUserRole()
- Send welcome message (use MESSAGES.welcome.uz)
- Show appropriate keyboard (client or admin)
- If new user, save to database with role 'client'

Export function: startHandler(ctx)
Use async/await
Add error handling
```

---

## Phase 3: Client Features

### Step 3.1: Create Product Catalog Handler

```
Create bot/handlers/catalog.js:

1. Import getProducts from config/database.js
2. Import MOCK_CATEGORIES from config/constants.js
3. Import Telegraf's Markup

Features:
- catalogHandler(ctx): Show category buttons
- showCategory(ctx, categoryName): Show products in category
- showProduct(ctx, productId): Show product details with image and "Buyurtma berish" button

Product display format:
📦 [Product Name]
💰 Narx: [price] so'm
📦 Qoldiq: [stock] dona
📝 [description]

[Buyurtma berish] [◀️ Ortga]

Use ctx.replyWithPhoto() for products with images
Handle callback queries for button clicks
Add pagination if more than 10 products
```

---

### Step 3.2: Create Order Flow Handler

```
Create bot/handlers/order.js:

Use Telegraf Scenes for conversational flow:

Scene: 'order-scene'

Step 1 (enter): Ask for product name or show catalog
Step 2: Ask for quantity (validate against min_order)
Step 3: Ask for phone number (validate format)
Step 4: Ask for comment (optional, allow /skip)
Step 5 (final): 
  - Save order to database using createOrder()
  - Send confirmation to user
  - Send notification to all admins
  - Clear scene state
  - Return to main menu

Validation:
- Check if product exists and has sufficient stock
- Phone format: +998XXXXXXXXX
- Quantity >= product.min_order

Error handling:
- Invalid product
- Insufficient stock
- Database errors

Export: orderScene and orderHandler to trigger scene
```

---

### Step 3.3: Create Stock Check Handler

```
Create bot/handlers/stock.js:

Function: stockHandler(ctx)

1. Get all products from database grouped by category
2. Format message:

📊 OMBORDAGI QOLDIQLAR

📚 Daftarlar:
• A4 daftar 48v - 500 dona ✅
• A5 daftar 96v - 50 dona ⚠️

📦 Qadoqlar:
• Karton quti - 1000 dona ✅

Use emojis:
- ✅ if stock > 100
- ⚠️ if stock 1-100
- ❌ if stock = 0

3. Send message with back button
4. Handle errors gracefully

Export stockHandler(ctx)
```

---

### Step 3.4: Create Feedback Handler

```
Create bot/handlers/feedback.js:

Use Telegraf Scene: 'feedback-scene'

Step 1 (enter): Ask user to write feedback
Step 2: 
  - Save to database using createFeedback()
  - Send confirmation to user
  - Notify admins
  - Leave scene

Function: feedbackHandler(ctx) - triggers scene

Export both feedbackScene and feedbackHandler

Add validation:
- Message not empty
- Max 500 characters

Store in database with:
- user_id
- type: 'suggestion' (default)
- message
- status: 'new'
```

---

### Step 3.5: Create Contact Handler

```
Create bot/handlers/contact.js:

Function: contactHandler(ctx)

1. Import COMPANY from config/constants.js
2. Format and send message:

📞 ALOQA MA'LUMOTLARI

🏢 ${COMPANY.name}

📱 Telefon:
${COMPANY.phone}
${COMPANY.phone2}

📧 Email: ${COMPANY.email}

📍 Manzil:
${COMPANY.address_uz}

🕐 Ish vaqti:
${COMPANY.workingHours_uz}

🌐 ${COMPANY.website}
📱 ${COMPANY.telegram}
📸 ${COMPANY.instagram}

3. Send location using ctx.replyWithVenue()
   - latitude: COMPANY.latitude
   - longitude: COMPANY.longitude

4. Add back button

Export contactHandler(ctx)
```

---

## Phase 4: Admin Features

### Step 4.1: Create Admin Menu

```
Create bot/keyboards/admin.js:

Function: getAdminMenu()

Returns keyboard:
[📋 Buyurtmalar] [📦 Mahsulotlar]
[💬 Fikrlar]     [📊 Statistika]
[⚙️ Sozlamalar]  [◀️ Asosiy menyu]

Function: adminPanelHandler(ctx)
- Check if user is admin (use checkRole middleware)
- Show admin menu with message: "👨‍💼 ADMIN PANEL"
- Use reply_markup with admin keyboard

Export both functions
```

---

### Step 4.2: Create Orders Management

```
Create bot/admin/orders.js:

Functions:

1. viewOrdersHandler(ctx):
   - Get orders from database (status: 'new' first)
   - Paginate (5 per page)
   - Format each order:
   
   ────────────────
   👤 [user name]
   📦 [product name]
   🔢 [quantity] dona
   💰 [total price] so'm
   📞 [phone]
   💬 [comment]
   🕐 [date time]
   
   [✅ Bajarildi] [❌ Bekor] [▶️ Keyingi]
   ────────────────

2. completeOrderHandler(ctx, orderId):
   - Update order status to 'completed'
   - Notify customer
   - Show success message

3. cancelOrderHandler(ctx, orderId):
   - Update order status to 'cancelled'
   - Show confirmation

Use callback queries for buttons
Add pagination support
Export all functions
```

---

### Step 4.3: Create Product Management

```
Create bot/admin/products.js:

Use Telegraf Scene: 'add-product-scene'

Steps:
1. Ask for product name (uz)
2. Show category buttons
3. Ask for price
4. Ask for min order quantity
5. Ask for stock quantity
6. Ask for image (optional, /skip)
7. Ask for description (optional, /skip)
8. Save to database
9. Confirm and show product

Function: addProductHandler(ctx) - triggers scene

Also create:
- editProductHandler(ctx): Show product list to edit
- deleteProductHandler(ctx): Show product list to delete
- Product selection uses inline keyboard

Validation:
- Price must be number > 0
- Quantity must be number >= 0
- Image must be photo

Export all functions
```

---

### Step 4.4: Create Feedback Management

```
Create bot/admin/feedback.js:

Functions:

1. viewFeedbackHandler(ctx):
   - Get feedback from database (status: 'new' first)
   - Format:
   
   💬 FIKR-MULOHAZALAR
   
   ────────────────
   👤 [user name]
   📝 "[message]"
   🕐 [date]
   
   [💬 Javob] [✅ Ko'rildi] [▶️ Keyingi]
   ────────────────

2. respondFeedbackScene:
   - Step 1: Ask admin for response
   - Step 2: Send response to user via bot
   - Update feedback status to 'responded'
   - Show confirmation

3. markFeedbackSeenHandler(ctx, feedbackId):
   - Update status to 'responded' (without reply)
   - Show confirmation

Use callback queries for buttons
Export all functions
```

---

### Step 4.5: Create Statistics

```
Create bot/admin/stats.js:

Function: statsHandler(ctx)

Query database and show:

📊 STATISTIKA

📅 Bugun:
• Buyurtmalar: [count]
• Yangi foydalanuvchilar: [count]

📦 Eng ko'p buyurtma qilingan (bugun):
1. [product name] - [count] ta
2. [product name] - [count] ta
3. [product name] - [count] ta

📈 Umumiy:
• Jami foydalanuvchilar: [count]
• Jami buyurtmalar: [count]
• Bajarilgan: [count]
• Kutilmoqda: [count]

💬 Fikr-mulohazalar:
• Jami: [count]
• Yangi: [count]

Use database aggregation queries
Format numbers nicely (e.g., 1,234)
Add refresh button
Export statsHandler(ctx)
```

---

## Phase 5: API Server

### Step 5.1: Create Express Server

```
Create api/index.js:

1. Import express, cors, dotenv
2. Load environment variables
3. Create Express app
4. Use cors middleware
5. Use express.json() middleware
6. Import and mount routes:
   - /api/products (from routes/products.js)
   - /api/categories (from routes/categories.js)
   - /api/orders (from routes/orders.js)
7. Add 404 handler
8. Add error handler middleware
9. Start server on PORT (default 3000)
10. Export app for testing

Add health check endpoint: GET /health
Log all requests in development mode
```

---

### Step 5.2: Create Product Routes

```
Create api/routes/products.js:

GET /api/products
- Query params: category (optional), search (optional)
- Get products from database using getProducts()
- Filter by category if provided
- Search by name if provided
- Return JSON:
  {
    success: true,
    data: [products array]
  }

GET /api/products/:id
- Get product by ID
- Return 404 if not found
- Return JSON with product data

Use async/await
Add error handling
Export router
```

---

### Step 5.3: Create Categories Routes

```
Create api/routes/categories.js:

GET /api/categories
- Get all categories from database
- Count products in each category
- Return JSON:
  {
    success: true,
    data: [
      {
        id, name, name_uz, icon,
        productCount: [number]
      }
    ]
  }

Use async/await
Add error handling
Export router
```

---

### Step 5.4: Create Orders Route

```
Create api/routes/orders.js:

POST /api/orders
- Middleware: verifyTelegramAuth (from middleware/telegram-auth.js)
- Body: { productId, quantity, phone, name, comment }
- Validate all fields
- Check product stock
- Create order in database
- Notify admins via bot
- Return JSON:
  {
    success: true,
    data: {
      orderId: [uuid],
      message: "Buyurtma qabul qilindi"
    }
  }

Validation:
- Product exists
- Quantity >= min_order
- Quantity <= stock
- Phone format valid

Export router
```

---

### Step 5.5: Create Telegram Auth Middleware

```
Create api/middleware/telegram-auth.js:

Function: verifyTelegramAuth(req, res, next)

1. Get X-Telegram-Init-Data header
2. Parse and verify Telegram WebApp initData
3. Extract user data
4. Attach to req.telegramUser
5. Call next()

If invalid:
- Return 401 Unauthorized

This ensures requests come from real Telegram users.

Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

Export middleware function
```

---

## Phase 6: Mini App

### Step 6.1: Create HTML Structure

```
Create mini-app/index.html:

Basic structure:
- Include Telegram WebApp SDK
- Include Tailwind CSS (CDN)
- Include app.js and style.css

HTML structure:
<body>
  <div id="app">
    <!-- Header with category filters -->
    <header class="sticky top-0 bg-white shadow">
      <div id="categories"></div>
    </header>

    <!-- Loading state -->
    <div id="loading" class="text-center p-8">
      <div class="spinner"></div>
      <p>Yuklanmoqda...</p>
    </div>

    <!-- Product grid -->
    <main id="products" class="hidden">
      <div class="grid grid-cols-2 gap-4 p-4">
        <!-- Products will be inserted here -->
      </div>
    </main>

    <!-- Product detail modal -->
    <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50">
      <div class="modal-content">
        <!-- Product details -->
      </div>
    </div>

    <!-- Error state -->
    <div id="error" class="hidden text-center p-8">
      <p class="text-red-500">Xatolik yuz berdi</p>
      <button onclick="location.reload()">Qayta urinish</button>
    </div>
  </div>
</body>

Use semantic HTML
Make it responsive (mobile-first)
```

---

### Step 6.2: Create Mini App JavaScript

```
Create mini-app/app.js:

1. Initialize Telegram WebApp:
   - const tg = window.Telegram.WebApp;
   - tg.ready();
   - tg.expand();

2. Get API URL from environment (or use current origin + /api)

3. Load categories and products:
   - fetchCategories()
   - fetchProducts(categoryFilter)

4. Render functions:
   - renderCategories(categories)
   - renderProducts(products)
   - renderProductCard(product)
   - openProductModal(productId)
   - closeModal()

5. Order function:
   - orderProduct(productId)
   - Open bot with product data
   - Use: tg.close()

6. Event listeners:
   - Category filter clicks
   - Product card clicks
   - Modal close

Use async/await for API calls
Add error handling
Show loading states
Format prices with commas

IMPORTANT: Use tg.initDataUnsafe.user for user info
```

---

### Step 6.3: Create Mini App Styles

```
Create mini-app/style.css:

Style classes for:
- Product cards (hover effects, shadows)
- Category pills (active state)
- Modal (slide-up animation)
- Loading spinner
- Error state
- Responsive grid (2 cols mobile, 3+ cols tablet)

Use Tailwind utilities where possible
Add custom CSS for:
- Smooth animations
- Product image aspect ratio (1:1)
- Modal backdrop blur
- Touch-friendly buttons (min 44px)

Variables for colors:
- Primary: #0088cc (Telegram blue)
- Secondary: #64B5F6
- Success: #4CAF50
- Danger: #F44336
```

---

## Phase 7: Database Setup

### Step 7.1: Create Seed Script

```
Create scripts/seed-database.js:

1. Import database client
2. Import MOCK_CATEGORIES and MOCK_PRODUCTS from constants
3. Connect to Supabase

Function: seedDatabase()

Steps:
- Clear existing data (in order: feedback, orders, products, categories, users)
- Insert categories from MOCK_CATEGORIES
- For each product in MOCK_PRODUCTS:
  - Find category by name
  - Insert product with category_id
- Create test admin user (from FIRST_ADMIN_ID env)
- Create 2-3 test client users
- Log results

Run with: node scripts/seed-database.js

Add safety check: require confirmation in production
```

---

### Step 7.2: Create Admin Setup Script

```
Create scripts/setup-admin.js:

Accept Telegram user ID as argument:
node scripts/setup-admin.js 123456789

Function:
1. Check if user exists in database
2. If exists, update role to 'admin'
3. If not exists, create user with role 'admin'
4. Log success message

This is for adding admins after deployment.

Add validation:
- User ID must be number
- User ID must be valid Telegram ID (> 0)

Export function for use in other scripts
```

---

## Phase 8: Testing & Polish

### Step 8.1: Add Logging

```
Create bot/middleware/logger.js:

Middleware function that logs:
- User ID
- Username
- Command/message text
- Timestamp
- Processing time

Format:
[2024-01-15 14:30:25] User 123456789 (@username): /start (45ms)

Log to console in development
Can extend to file logging in production

Export middleware: loggerMiddleware(ctx, next)
```

---

### Step 8.2: Add Error Handler

```
In bot/index.js, add error handling:

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  
  // Send user-friendly message
  ctx.reply('❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
  
  // Log error details
  console.error({
    userId: ctx.from?.id,
    update: ctx.update,
    error: err.message,
    stack: err.stack
  });
});

Never let bot crash
Always respond to user
Log everything for debugging
```

---

### Step 8.3: Create README

```
Create README.md:

Include:
1. Project description
2. Features list
3. Tech stack
4. Prerequisites
5. Installation steps:
   - Clone repo
   - npm install
   - Copy .env.example to .env
   - Fill environment variables
   - Run seed script
   - Start bot
6. Project structure explanation
7. Available scripts:
   - npm start (production)
   - npm run dev (development with nodemon)
   - npm run seed (seed database)
   - npm run admin (setup admin)
8. Deployment instructions (Railway + Vercel)
9. Environment variables documentation
10. FAQ / Troubleshooting
11. License
12. Contact info

Make it clear and easy to follow
Add screenshots if possible
```

---

## Phase 9: Deployment

### Step 9.1: Prepare for Railway

```
Create railway.json (optional but recommended):

{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node bot/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}

Also ensure package.json has:
{
  "scripts": {
    "start": "node bot/index.js",
    "dev": "nodemon bot/index.js",
    "seed": "node scripts/seed-database.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### Step 9.2: Deploy Checklist

```
Before deploying, verify:

✅ All environment variables are set
✅ ADMIN_IDS updated with real Telegram IDs
✅ BOT_TOKEN from @BotFather
✅ Supabase project created and tables migrated
✅ Mock data seeded to database
✅ Mini App deployed to Vercel
✅ MINI_APP_URL updated in bot env
✅ Webhook URL configured
✅ Google Sheets API setup (if using)
✅ All routes tested locally
✅ Bot tested with real Telegram account
✅ Error handling working
✅ Logging working

Railway deployment:
1. Push code to GitHub
2. Create new project on Railway
3. Connect GitHub repo
4. Add environment variables
5. Deploy
6. Set webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=<RAILWAY_URL>
7. Test in production

Vercel deployment:
1. Push mini-app folder to GitHub (or separate repo)
2. Create new project on Vercel
3. Deploy
4. Update MINI_APP_URL in Railway
5. Test Mini App in Telegram
```

---

## 🎯 Final Checklist

Copy this checklist and mark off as you complete each item:

```
Project Setup:
[ ] Project structure created
[ ] Dependencies installed
[ ] Config files created
[ ] Environment variables set

Bot Core:
[ ] Main bot file working
[ ] Role middleware working
[ ] Start command working
[ ]