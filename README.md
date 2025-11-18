# BPS Telegram Bot v2.0

**Clean & Simple Version**

## 📋 Project Overview

A simplified Telegram bot for BPS (Euroasia Print) company with:
- Multi-language support (Uzbek, Russian, English)
- Product ordering system
- Admin management via bot
- Google Sheets integration
- Mini App catalog

## 🏗️ Project Structure

```
src/
├── bot.js                 # Main bot entry point
├── config/
│   ├── database.js        # Supabase connection
│   ├── messages.js        # Multi-language messages
│   └── google-sheets.js   # Google Sheets integration
├── handlers/
│   ├── start.js           # /start command & language selection
│   ├── products.js        # Product catalog & ordering
│   ├── admin.js           # Admin management
│   └── feedback.js        # Feedback handling
├── keyboards/
│   ├── main.js            # Main menu keyboards
│   └── admin.js           # Admin keyboards
├── utils/
│   ├── helpers.js         # Utility functions
│   └── validators.js      # Input validation
└── miniapp/
    ├── server.js          # Express server for Mini App
    ├── index.html         # Mini App HTML
    ├── app.js             # Mini App JavaScript
    └── style.css          # Mini App styles
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run development:**
   ```bash
   npm run dev
   ```

4. **Run Mini App:**
   ```bash
   npm run miniapp
   ```

## 📊 Database Schema

Located in Supabase:
- `users` - User profiles and language preferences
- `products` - Product catalog (no categories)
- `orders` - Customer orders
- `feedback` - Customer feedback/complaints

## 🌟 Features

### For Customers:
- Browse products in their preferred language
- Simple text-based ordering
- Submit feedback/complaints
- View company information

### For Admins:
- Manage products via bot conversation
- View and respond to orders
- Handle customer feedback
- Google Sheets integration for product management

### Mini App:
- Beautiful product catalog
- Image gallery
- Product details
- Connects to main bot for ordering

## 🔧 Development Phases

- [x] **Phase 0:** Project setup and cleanup
- [ ] **Phase 1:** Foundation & Database setup
- [ ] **Phase 2:** Core bot features
- [ ] **Phase 3:** Admin panel
- [ ] **Phase 4:** Google Sheets integration
- [ ] **Phase 5:** Group notifications
- [ ] **Phase 6:** Mini App
- [ ] **Phase 7:** Testing & polish

## 📝 Environment Variables

```env
# Telegram Bot
BOT_TOKEN=your_bot_token
ADMIN_USER_ID=790208567  # @fayzmotr

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Google Sheets
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_email
GOOGLE_PRIVATE_KEY=your_private_key

# Groups (optional)
ORDERS_GROUP_ID=your_orders_group
FEEDBACK_GROUP_ID=your_feedback_group
```

## 👥 Team

- **Main Admin:** @fayzmotr (790208567)
- **Development:** Claude Code
- **Approach:** Agile, phase-by-phase

## 📞 Support

For questions about this bot implementation, refer to the development plan in `BPS-Telegram-Bot-Development-Plan.md`.

---

**Status:** ALL PHASES COMPLETE ✅  
**Ready for:** Production Deployment 🚀

## 🚀 DEPLOYMENT GUIDE

### Step 1: Deploy Bot to Railway

1. **Go to Railway**: https://railway.app
2. **Connect GitHub** and select this repository
3. **Set Environment Variables** in Railway dashboard:
   ```
   BOT_TOKEN=your_telegram_bot_token
   ADMIN_USER_ID=your_telegram_user_id
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Deploy** - Railway will automatically build and deploy!

### Step 2: Deploy Mini App to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Import Project** from your GitHub repository
3. **Set Framework**: Vite
4. **Set Root Directory**: `mini-app`
5. **Add Environment Variables**:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
6. **Deploy** - Vercel will build and deploy your Mini App!

### Step 3: Test Everything

- ✅ Bot responds to `/start`
- ✅ Product editing works
- ✅ Orders can be placed
- ✅ Mini App loads and shows products
- ✅ Photo uploads working

---

**🎉 Your BPS Telegram Bot is ready for production!**