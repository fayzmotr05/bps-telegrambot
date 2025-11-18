# BTS Telegram Bot - Product Requirements Document (PRD)

## Project Overview

**Project Name:** BTS (Euroasia Print) Telegram Bot  
**Version:** 1.0 (Simplified)  
**Budget:** $400  
**Timeline:** 7-10 days  
**Developer:** Using Claude Code

---

## 1. Project Goals

Create a Telegram bot for BTS company that allows:
- Customers to browse products and place orders
- Admins to manage products and view orders through bot commands
- Beautiful product catalog via Telegram Mini App
- Simple inventory sync with Google Sheets

---

## 2. Technical Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Bot Library:** Telegraf (v4.x)
- **Database:** Supabase (PostgreSQL)
- **External APIs:** Google Sheets API v4

### Frontend (Mini App)
- **Framework:** Vanilla JavaScript (no React/Vue to keep simple)
- **Styling:** Tailwind CSS (CDN)
- **SDK:** Telegram Web App SDK

### Hosting
- **Bot + API:** Railway (free tier)
- **Mini App:** Vercel (free tier)
- **Database:** Supabase (free tier)
- **Files:** Supabase Storage

### Development
- **AI Tool:** Claude Code
- **Version Control:** Git + GitHub
- **Environment:** .env files

---

## 3. Database Schema (Supabase)

### Tables

```sql
-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY,                    -- Telegram user_id
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'client',               -- 'client' or 'admin'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_uz TEXT NOT NULL,
  icon TEXT,                                -- emoji
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  name_uz TEXT NOT NULL,
  description TEXT,
  description_uz TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,                           -- Supabase Storage URL
  stock_quantity INT DEFAULT 0,
  min_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,               -- snapshot at order time
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,             -- snapshot at order time
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  comment TEXT,
  status TEXT DEFAULT 'new',                -- 'new', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  type TEXT NOT NULL,                       -- 'complaint', 'suggestion'
  message TEXT NOT NULL,
  admin_response TEXT,
  status TEXT DEFAULT 'new',                -- 'new', 'responded'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings table (key-value store)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_feedback_status ON feedback(status);
```

---

## 4. Project Structure

```
bts-telegram-bot/
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
├── README.md
│
├── config/
│   ├── constants.js             # Company info (mock data)
│   ├── database.js              # Supabase client
│   └── google-sheets.js         # Google Sheets API setup
│
├── bot/
│   ├── index.js                 # Main bot entry point
│   ├── middleware/
│   │   ├── checkRole.js         # Role-based access control
│   │   └── logger.js            # Request logging
│   ├── handlers/
│   │   ├── start.js             # /start command
│   │   ├── catalog.js           # Catalog navigation
│   │   ├── order.js             # Order creation flow
│   │   ├── feedback.js          # Feedback submission
│   │   └── contact.js           # Contact info
│   ├── admin/
│   │   ├── products.js          # Product management
│   │   ├── orders.js            # Order management
│   │   ├── feedback.js          # Feedback management
│   │   └── stats.js             # Simple statistics
│   ├── keyboards/
│   │   ├── main.js              # Main menu keyboards
│   │   ├── catalog.js           # Catalog keyboards
│   │   └── admin.js             # Admin keyboards
│   └── utils/
│       ├── messages.js          # Text templates (UZ/RU)
│       └── helpers.js           # Helper functions
│
├── api/
│   ├── index.js                 # Express API server
│   ├── routes/
│   │   ├── products.js          # GET /api/products
│   │   ├── categories.js        # GET /api/categories
│   │   └── orders.js            # POST /api/orders
│   └── middleware/
│       └── telegram-auth.js     # Verify Telegram WebApp data
│
├── mini-app/
│   ├── index.html               # Single page app
│   ├── style.css                # Styling
│   ├── app.js                   # Main logic
│   └── telegram-web-app.js      # Telegram SDK
│
├── scripts/
│   ├── seed-database.js         # Populate mock data
│   ├── sync-sheets.js           # Google Sheets sync
│   └── setup-admin.js           # Create first admin
│
└── docs/
    ├── SETUP.md                 # Setup instructions
    ├── API.md                   # API documentation
    └── DEPLOYMENT.md            # Deployment guide
```

---

## 5. Feature Specifications

### 5.1 Client Features (Regular Users)

#### 5.1.1 Main Menu
**Commands:** `/start`, `/menu`

**Keyboard Layout:**
```
[📦 Mahsulotlar] [📊 Qoldiqlar]
[📝 Buyurtma]   [💬 Fikr bildirish]
[📞 Kontakt]    [ℹ️ Ma'lumot]
```

#### 5.1.2 Product Catalog (Bot)
- Display categories as inline buttons
- Show products in each category
- Product card format:
  ```
  📦 [Product Name]
  💰 Narx: [Price] so'm
  📦 Qoldiq: [Stock] dona
  
  [Buyurtma berish] [Ortga]
  ```

#### 5.1.3 Product Catalog (Mini App)
- Open via "🌐 Chiroyli ko'rish" button
- Grid layout with images
- Filter by category
- Click product → detail view
- "Buyurtma berish" → back to bot with product_id

#### 5.1.4 Order Flow (Conversational)
```
State 1: User clicks "Buyurtma berish"
Bot: "Mahsulot nomini yozing yoki katalogdan tanlang"

State 2: User types or selects
Bot: "Nechta kerak? (minimum: [min_order])"

State 3: User enters quantity
Bot: "Telefon raqamingiz? (Masalan: +998901234567)"

State 4: User enters phone
Bot: "Qo'shimcha izoh? (Ixtiyoriy, /skip bosing)"

State 5: User enters comment or /skip
Bot: "✅ Buyurtmangiz qabul qilindi!
     
     📦 Mahsulot: [name]
     🔢 Miqdor: [qty]
     💰 Narx: [price] so'm
     📞 Telefon: [phone]
     
     Tez orada bog'lanamiz!"

Admin notification sent.
```

#### 5.1.5 Stock Check
- Display list of products with stock
- Format:
  ```
  📊 OMBORDAGI QOLDIQLAR
  
  📚 Daftarlar:
  • A4 daftar 48v - 500 dona
  • A5 daftar 96v - 300 dona
  
  📦 Qadoqlar:
  • Kartон quti - 1000 dona
  ```

#### 5.1.6 Feedback
```
Bot: "Fikringizni yozing (shikoyat yoki taklif)"
User: [writes message]
Bot: "✅ Fikringiz qabul qilindi. Rahmat!"
```

#### 5.1.7 Contact
Display:
- Company name
- Phone numbers
- Address
- Working hours
- Location (send venue)

---

### 5.2 Admin Features

#### 5.2.1 Admin Menu
**Trigger:** Automatic if user.role === 'admin'

**Additional Buttons:**
```
[👨‍💼 Admin Panel]
```

**Admin Panel Menu:**
```
[📋 Buyurtmalar] [📦 Mahsulotlar]
[💬 Fikrlar]     [📊 Statistika]
[⚙️ Sozlamalar]  [◀️ Asosiy menyu]
```

#### 5.2.2 View Orders
```
📋 BUYURTMALAR

🆕 Yangi (3):
────────────────
👤 Sardor Alimov
📦 A4 daftar 48v
🔢 100 dona
💰 500,000 so'm
📞 +998901234567
🕐 15-Nov 14:30

[✅ Bajarildi] [❌ Bekor qilish] [📞 Qo'ng'iroq]
────────────────
[Keyingi ▶️]
```

#### 5.2.3 Add Product (Conversational)
```
Admin: /add_product

Bot: "Mahsulot nomini kiriting"
Admin: "A4 daftar 48 varaq"

Bot: "Kategoriyani tanlang:"
[Daftarlar] [Qadoqlar]

Bot: "Narxini kiriting (so'm)"
Admin: "5000"

Bot: "Minimal buyurtma miqdori?"
Admin: "10"

Bot: "Rasmni yuboring (ixtiyoriy, /skip)"
Admin: [sends image or /skip]

Bot: "Tavsif yozing (ixtiyoriy, /skip)"
Admin: "Yuqori sifatli, 48 varaqli"

Bot: "✅ Mahsulot qo'shildi!"
```

#### 5.2.4 Edit Product
```
Admin: /edit_product

Bot: Shows list of products
Admin: Selects product

Bot: "Nima o'zgartirmoqchisiz?"
[Nom] [Narx] [Rasm] [Tavsif] [Qoldiq]

Admin: Selects option
Bot: Requests new value
Admin: Provides new value
Bot: "✅ O'zgartirildi!"
```

#### 5.2.5 View Feedback
```
💬 FIKR-MULOHAZALAR

🆕 Yangi (2):
────────────────
👤 Aziza Karimova
📝 "Yetkazib berish juda sekin bo'ldi"
🕐 14-Nov 10:25

[💬 Javob berish] [✅ Ko'rildi]
────────────────
```

When admin clicks "Javob berish":
```
Bot: "Javobingizni yozing"
Admin: "Uzr so'raymiz, keyingi safar tezroq bo'ladi"
Bot: "✅ Javob yuborildi"
// Message sent to user via bot
```

#### 5.2.6 Statistics
```
📊 STATISTIKA

📅 Bugun:
• Buyurtmalar: 5 ta
• Yangi mijozlar: 2 ta

📦 Eng ko'p buyurtma qilingan:
1. A4 daftar 48v - 15 ta
2. Karton quti - 8 ta
3. A5 daftar 96v - 5 ta

👥 Jami foydalanuvchilar: 127
📋 Jami buyurtmalar: 342
```

---

### 5.3 Mini App Specifications

#### 5.3.1 Layout
```html
<!DOCTYPE html>
<html>
<head>
    <title>BTS Mahsulotlar</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow sticky top-0">
        <div class="px-4 py-3">
            <h1>BTS Mahsulotlar</h1>
            <!-- Category filter pills -->
        </div>
    </header>

    <!-- Product Grid -->
    <main class="p-4">
        <div class="grid grid-cols-2 gap-4">
            <!-- Product cards -->
        </div>
    </main>

    <!-- Product Modal -->
    <div id="productModal" class="hidden">
        <!-- Product details -->
        <!-- Order button (closes app, passes product_id) -->
    </div>
</body>
</html>
```

#### 5.3.2 Features
- Load products from API
- Category filter (pills at top)
- Product card: image, name, price, stock badge
- Click card → modal with full details
- "Buyurtma berish" button → `window.Telegram.WebApp.close()` with data

---

## 6. Mock Data Configuration

### File: `config/constants.js`

```javascript
module.exports = {
  // Company Information
  COMPANY: {
    name: 'BTS (Euroasia Print)',
    name_uz: 'BTS (Euroasia Print)',
    phone: '+998712345678',
    phone2: '+998901234567',
    email: 'info@bts.uz',
    address: 'Tashkent, Yunusabad tumani, Amir Temur ko\'chasi 123',
    address_uz: 'Toshkent, Yunusobod tumani, Amir Temur ko\'chasi 123',
    workingHours: '09:00 - 18:00 (Dush-Juma)',
    workingHours_uz: '09:00 - 18:00 (Dush-Juma)',
    latitude: 41.311081,
    longitude: 69.240562,
    website: 'https://bts.uz',
    telegram: '@bts_uz',
    instagram: '@bts_euroasia'
  },

  // Admin User IDs (Replace with real Telegram IDs)
  ADMIN_IDS: [
    123456789,  // Replace with real admin Telegram ID
    987654321   // Add more admin IDs
  ],

  // Bot Messages
  MESSAGES: {
    welcome: {
      uz: '👋 Assalomu aleykum! BTS kompaniyasining botiga xush kelibsiz.\n\nBiz daftar va qadoq ishlab chiqaramiz.',
      ru: '👋 Здравствуйте! Добро пожаловать в бот компании BTS.\n\nМы производим тетради и упаковку.'
    },
    orderReceived: {
      uz: '✅ Buyurtmangiz qabul qilindi! Tez orada bog\'lanamiz.',
      ru: '✅ Ваш заказ принят! Скоро свяжемся.'
    }
  },

  // Google Sheets Configuration
  GOOGLE_SHEETS: {
    spreadsheetId: '1234567890abcdefghijklmnop',  // Replace with real Sheet ID
    range: 'Products!A2:E',  // Sheet name and range
    columns: {
      name: 0,       // Column A
      category: 1,   // Column B
      price: 2,      // Column C
      stock: 3,      // Column D
      sku: 4        // Column E
    }
  },

  // Mock Categories
  MOCK_CATEGORIES: [
    { name: 'Notebooks', name_uz: 'Daftarlar', icon: '📚' },
    { name: 'Packages', name_uz: 'Qadoqlar', icon: '📦' },
    { name: 'Office Supplies', name_uz: 'Kantselyariya', icon: '✏️' }
  ],

  // Mock Products (for initial seed)
  MOCK_PRODUCTS: [
    {
      name: 'A4 Notebook 48 pages',
      name_uz: 'A4 daftar 48 varaq',
      category: 'Notebooks',
      price: 5000,
      stock: 500,
      description: 'High quality notebook',
      description_uz: 'Yuqori sifatli daftar',
      minOrder: 10
    },
    {
      name: 'A5 Notebook 96 pages',
      name_uz: 'A5 daftar 96 varaq',
      category: 'Notebooks',
      price: 8000,
      stock: 300,
      description: 'Premium notebook',
      description_uz: 'Premium daftar',
      minOrder: 5
    },
    {
      name: 'Cardboard Box Medium',
      name_uz: 'Karton quti (o\'rta)',
      category: 'Packages',
      price: 3000,
      stock: 1000,
      description: 'Durable cardboard box',
      description_uz: 'Mustahkam karton quti',
      minOrder: 50
    }
  ]
};
```

---

## 7. Environment Variables

### File: `.env.example`

```bash
# Telegram Bot
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
WEBHOOK_URL=https://your-railway-app.up.railway.app
MINI_APP_URL=https://your-vercel-app.vercel.app

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Google Sheets (Optional)
GOOGLE_SHEETS_ENABLED=false
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server
PORT=3000
NODE_ENV=development

# Admin
FIRST_ADMIN_ID=123456789
```

---

## 8. API Endpoints

### Base URL: `https://your-api.com/api`

#### GET `/products`
**Description:** Get all active products  
**Query Params:**
- `category` (optional): Filter by category
- `search` (optional): Search by name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "A4 daftar 48v",
      "category": { "id": "uuid", "name": "Daftarlar" },
      "price": 5000,
      "stock": 500,
      "image_url": "https://...",
      "description": "..."
    }
  ]
}
```

#### GET `/categories`
**Description:** Get all categories

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Daftarlar",
      "icon": "📚",
      "productCount": 15
    }
  ]
}
```

#### POST `/orders`
**Description:** Create new order (called from Mini App)

**Headers:**
- `X-Telegram-Init-Data`: Telegram WebApp initData (for auth)

**Body:**
```json
{
  "productId": "uuid",
  "quantity": 10,
  "phone": "+998901234567",
  "name": "John Doe",
  "comment": "Urgent delivery"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "message": "Buyurtmangiz qabul qilindi"
  }
}
```

---

## 9. Development Workflow

### Phase 1: Setup (Day 1)
1. Initialize Node.js project
2. Install dependencies
3. Create `.env` file
4. Setup Supabase project
5. Run database migrations
6. Create mock data seeding script
7. Test database connection

### Phase 2: Bot Core (Day 2-3)
1. Setup Telegraf bot
2. Implement `/start` command
3. Create main menu keyboards
4. Implement role checking middleware
5. Test bot locally with ngrok

### Phase 3: Client Features (Day 4-5)
1. Product catalog (bot-based)
2. Order flow (conversational)
3. Stock checking
4. Feedback submission
5. Contact information

### Phase 4: Admin Features (Day 6)
1. Admin menu
2. View orders
3. Add/edit products
4. View feedback
5. Simple statistics

### Phase 5: Mini App (Day 7)
1. Create HTML/CSS/JS
2. Integrate Telegram WebApp SDK
3. Fetch products from API
4. Product detail modal
5. Order button (close app with data)

### Phase 6: Integration (Day 8)
1. Google Sheets sync (optional)
2. Image upload to Supabase Storage
3. Admin notifications
4. Error handling

### Phase 7: Testing (Day 9)
1. End-to-end testing
2. Fix bugs
3. Performance optimization
4. User acceptance testing

### Phase 8: Deployment (Day 10)
1. Deploy API to Railway
2. Deploy Mini App to Vercel
3. Setup webhook
4. Configure production env vars
5. Final testing

---

## 10. Claude Code Instructions

### CRITICAL: Avoid Hallucinations

**When using Claude Code, follow these rules:**

1. **Use Exact File Paths**
   - Reference `config/constants.js` for all company data
   - Never hardcode company info in handlers
   - Import constants at the top of each file

2. **Database Operations**
   - Always use Supabase client from `config/database.js`
   - Never write raw SQL in handlers (use Supabase SDK methods)
   - Check for errors on every database call

3. **Error Handling**
   - Wrap all async operations in try-catch
   - Log errors to console
   - Send user-friendly error messages
   - Never crash the bot

4. **State Management**
   - Use Telegraf scenes for conversational flows
   - Store temporary data in scene state
   - Clear state after completion

5. **Testing**
   - Test each feature with mock data
   - Use real Telegram IDs for admin testing
   - Verify database writes

6. **Code Style**
   - Use async/await (not .then())
   - Use const/let (not var)
   - Comment complex logic
   - Keep functions under 50 lines

7. **Dependencies**
   - Only use npm packages listed in package.json
   - Don't invent packages
   - Check package versions

---

## 11. Deployment Checklist

### Before Deployment

- [ ] All mock data replaced with real data
- [ ] Admin IDs configured
- [ ] Supabase tables created
- [ ] Environment variables set
- [ ] Bot token obtained from @BotFather
- [ ] Google Sheets API enabled (if using)
- [ ] Images uploaded to Supabase Storage
- [ ] API endpoints tested
- [ ] Mini App tested in Telegram

### Railway Deployment

- [ ] Create Railway project
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Deploy bot
- [ ] Set webhook URL
- [ ] Test bot in production

### Vercel Deployment

- [ ] Create Vercel project
- [ ] Connect GitHub repo
- [ ] Deploy Mini App
- [ ] Update MINI_APP_URL in bot env
- [ ] Test Mini App in Telegram

---

## 12. Success Criteria

### Must Have
- ✅ Bot responds to /start
- ✅ Clients can browse products
- ✅ Clients can place orders
- ✅ Admins receive order notifications
- ✅ Admins can add/edit products via bot
- ✅ Mini App shows products with images
- ✅ Orders saved to database

### Nice to Have
- ⭐ Google Sheets sync
- ⭐ Product search
- ⭐ Order history for users
- ⭐ Admin statistics dashboard
- ⭐ Feedback responses

### Out of Scope (Future)
- ❌ Online payments
- ❌ Multi-language switching
- ❌ Email notifications
- ❌ Advanced analytics
- ❌ Customer accounts

---

## 13. Support & Maintenance

### Post-Launch (2 weeks free)
- Bug fixes
- Minor adjustments
- Help with adding initial products
- Admin training

### Future Upgrades (Paid)
- Statistics dashboard ($50)
- Broadcast messages ($30)
- Order status tracking ($40)
- Online payments ($100)

---

## 14. Contact & Access

### Development Access Needed
- Telegram Bot Token (from @BotFather)
- Supabase Project (admin will create)
- Google Sheets (if client has)
- Railway Account
- Vercel Account

### Handover Includes
- GitHub repository
- Supabase credentials
- Railway project access
- Vercel project access
- Admin documentation
- Setup guide for future devs

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Prepared For:** BTS (Euroasia Print)  
**Prepared By:** Development Team