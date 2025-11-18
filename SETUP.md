# 🚀 Quick Setup Guide

Get your BPS Telegram Bot running in 15 minutes!

## 📋 What You Need

Before starting, get these:

1. **Telegram Bot Token**
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Choose a name and username
   - Copy the bot token

2. **Your Telegram ID**
   - Message @userinfobot on Telegram
   - Send any message
   - Copy your user ID number

3. **Supabase Account**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note the project URL and API keys

## ⚡ Quick Setup

### 1. Clone and Install
```bash
git clone <repository-url> bps-telegram-bot
cd bps-telegram-bot
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Edit `.env` with your details:
```env
BOT_TOKEN=your_bot_token_here
FIRST_ADMIN_ID=your_telegram_id_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### 3. Create Database Tables

In your Supabase SQL editor, run:

```sql
-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_uz TEXT NOT NULL,
  icon TEXT,
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
  image_url TEXT,
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
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  comment TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  admin_response TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Seed Database and Setup Admin
```bash
npm run seed
npm run setup-admin YOUR_TELEGRAM_ID
```

### 5. Start the Bot
```bash
npm run dev
```

### 6. Test Your Bot

1. Find your bot on Telegram using the username you chose
2. Send `/start`
3. You should see the BPS welcome message and menu
4. As an admin, you should see the "👨‍💼 Admin Panel" button

## ✅ Success Checklist

- [ ] Bot responds to `/start`
- [ ] Main menu appears with all buttons
- [ ] Product catalog shows sample products
- [ ] Admin panel is visible (for admin users)
- [ ] Orders can be placed
- [ ] Feedback can be submitted

## 🎯 What's Next?

Your bot is now running locally! To make it available 24/7:

1. **Deploy to Production** - Follow `DEPLOYMENT.md`
2. **Customize Products** - Add your real products via admin panel
3. **Update Company Info** - Edit `config/constants.js`
4. **Setup Mini App** - Deploy to Vercel for beautiful product browsing

## 🔧 Customize for Your Business

### Update Company Information

Edit `config/constants.js`:

```javascript
COMPANY: {
  name: 'Your Company Name',
  phone: '+998901234567',
  email: 'info@yourcompany.com',
  address: 'Your business address',
  // ... update all fields
}
```

### Add Your Admin Users

```javascript
ADMIN_IDS: [
  123456789,  // Your Telegram ID
  987654321   // Another admin's ID
]
```

### Add Real Products

1. Use the bot's admin panel
2. Go to "📦 Mahsulotlar" → "➕ Mahsulot qo'shish"
3. Follow the step-by-step product creation

## 🚨 Troubleshooting

### Bot Not Responding
- Check bot token is correct
- Verify bot is started with `npm run dev`
- Check console for error messages

### Database Errors
- Verify Supabase credentials in `.env`
- Ensure database tables are created
- Check Supabase dashboard for connection issues

### Permission Errors
- Use the service key (not anon key) in `.env`
- Verify admin ID is correct in constants.js

## 📞 Need Help?

- Check the full `README.md` for detailed documentation
- Review `DEPLOYMENT.md` for production setup
- Check console logs for specific error messages

---

**🎉 Congratulations!** Your BPS Telegram Bot is ready to serve customers!