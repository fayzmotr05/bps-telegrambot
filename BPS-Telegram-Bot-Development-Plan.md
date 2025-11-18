# BPS Telegram Bot - Agile Development Plan

## 🎯 Project Overview

**Project:** BPS Telegram Bot - Simplified & Clean  
**Developer:** Claude Code  
**Approach:** Agile development with phase-by-phase approval  
**Main Admin:** @fayzmotr (790208567)  

## ✅ Phase 0: Project Archive & Setup [COMPLETED]
- [x] Archived old project with all credentials
- [x] Cleared old complex structure 
- [x] Preserved .env file with working credentials
- [x] Ready for fresh start

---

## 🏗️ Phase 1: Foundation & Database Setup

### Database Schema (Supabase)
```sql
-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'uz',
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table (no categories - simplified)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name_uz TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_uz TEXT,
  description_ru TEXT,
  description_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  min_order INTEGER DEFAULT 1,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'feedback', -- 'feedback', 'complaint'
  status TEXT DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Bot Foundation
- Clean Telegraf setup
- Multilingual system (UZ/RU/EN) 
- Language selection on /start
- Basic role detection for admin

### Tasks:
1. Create new package.json with minimal dependencies
2. Setup Supabase database tables
3. Create basic bot structure
4. Implement language system
5. Test /start command with language selection

**Deliverable:** Bot responds to /start with language selection, saves user to database

---

## 📱 Phase 2: Core Bot Features

### Main Menu (Language-aware)
```
📦 Mahsulotlar | 📦 Товары | 📦 Products
📝 Buyurtma | 📝 Заказ | 📝 Order  
💬 Fikr bildirish | 💬 Отзыв | 💬 Feedback
📞 Kontakt | 📞 Контакт | 📞 Contact
ℹ️ Ma'lumot | ℹ️ Информация | ℹ️ Info
🌐 Til | 🌐 Язык | 🌐 Language
```

### Product Catalog (Simple List)
- Display all active products (no categories)
- Show: Name, Price, Stock status
- Simple text-based list with inline buttons
- "Order" button for each product

### Order Flow
```
1. User clicks "Order" on product
2. Bot: "Nechta kerak? (Minimum: X dona)"
3. User enters quantity (text input)
4. Bot: "Ismingiz?"
5. User enters name
6. Bot: "Telefon raqamingiz?"
7. User enters phone
8. Bot: "Qo'shimcha izoh? (/skip)"
9. User enters notes or /skip
10. Bot: "Buyurtma tasdiqlandi!" + order summary
```

### Tasks:
1. Create multilingual message system
2. Implement main menu with proper buttons
3. Create product display handler
4. Build conversational order flow using Telegraf scenes
5. Save orders to database

**Deliverable:** Complete order flow working with database

---

## 👨‍💼 Phase 3: Admin Panel

### Admin Detection
- Check if user ID = 790208567 (@fayzmotr)
- Show additional "👑 Admin Panel" button
- Separate admin buttons from user buttons

### Admin Menu
```
📦 Mahsulot qo'shish | Add Product
📝 Mahsulotlar | Products List  
📋 Buyurtmalar | Orders
💬 Fikrlar | Feedback
◀️ Asosiy menyu | Main Menu
```

### Product Management (Bot-based CRUD)
**Add Product:**
```
1. Admin: clicks "Mahsulot qo'shish"
2. Bot: "Mahsulot nomini kiriting (UZ):"
3. Admin: enters name_uz
4. Bot: "Rus tilida nomi:"
5. Admin: enters name_ru  
6. Bot: "Ingliz tilida nomi:"
7. Admin: enters name_en
8. Bot: "Narxi (so'mda):"
9. Admin: enters price
10. Bot: "Minimal buyurtma soni:"
11. Admin: enters min_order
12. Bot: "Rasm yuboring yoki /skip:"
13. Admin: sends photo or /skip
14. Bot: "Tavsif (UZ) yoki /skip:"
15. Admin: enters description or /skip
16. Bot: "Mahsulot qo'shildi!"
```

### Tasks:
1. Create admin role middleware  
2. Build admin menu system
3. Implement add product conversation
4. Create product list/edit handlers
5. Orders viewing for admin
6. Feedback viewing for admin

**Deliverable:** Admin can manage products via bot conversation

---

## 📢 Phase 4: Group Integration

### Order Notifications
- All orders sent to designated Telegram group
- Format: Customer info + Product + Quantity + Total
- Admin can reply directly to customer

### Feedback to Group
- All feedback/complaints forwarded to group
- Admin can respond via bot

### Tasks:
1. Setup group bot integration
2. Create order notification format
3. Create feedback forwarding
4. Test group messaging
5. Add group management commands

**Deliverable:** Orders and feedback auto-sent to admin group

---

## 📱 Phase 6: Mini App (Catalog Only)

### Simple Product Catalog
- Grid layout with product images
- Product detail view (tap to expand)
- Swipe between products
- "View in Bot" button (no ordering)

### Features
- Connected to same Supabase data
- Responsive design
- Telegram Web App SDK integration
- Simple navigation

### Tasks:
1. Create HTML/CSS/JS mini app
2. Connect to Supabase API
3. Implement product grid
4. Add detail modals
5. Deploy to Vercel

**Deliverable:** Working Mini App showing product catalog

---

## ✅ Phase 7: Testing & Polish

### Testing Checklist
- [ ] All language switches working
- [ ] Order flow complete end-to-end  
- [ ] Admin CRUD operations working
- [ ] Admin CRUD via bot only
- [ ] Group notifications working
- [ ] Mini App displays products
- [ ] Error handling robust

### Performance & Polish
- [ ] Bot response times < 2 seconds
- [ ] Database queries optimized
- [ ] Error messages user-friendly
- [ ] Admin feedback on usability

**Deliverable:** Production-ready bot with full functionality

---

## 🚀 Deployment Plan

### Environment Setup
- Railway for bot hosting
- Vercel for Mini App
- Supabase for database (only source of truth)

### Final Handover
- Admin training session
- Documentation
- Bot usage training
- Support period (2 weeks)

---

## 📋 Current Status

**Phase 0: ✅ COMPLETED**
**Phase 1: 🚧 NEXT - Ready to begin**

---

## 🤝 Next Steps

Say "**next phase**" when ready to proceed with Phase 1: Foundation & Database Setup

---

## ⚠️ Important Notes

- Each phase requires approval before proceeding
- Testing happens after each phase
- Admin feedback incorporated before next phase
- Clean, simple code - no over-engineering
- Focus on core functionality first