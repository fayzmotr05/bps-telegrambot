# 🧪 BPS Telegram Bot - Complete Testing Guide

This comprehensive guide will help you test all functionalities of the BPS Telegram Bot system.

## 🚀 Prerequisites

**Before Testing:**
1. ✅ Bot is running (`node src/bot.js`)
2. ✅ Supabase database is connected
3. ✅ Bot added to "bps data" group (`-5011014916`)
4. ✅ Admin user configured: @fayzmotr (ID: 790208567)

---

## 📋 Phase 1: Basic Bot Functions

### 1.1 Start Command & Language Selection
**Test:** Bot start and language selection
1. Send `/start` to the bot
2. **Expected:** Language selection buttons (🇺🇿 O'zbek | 🇷🇺 Русский | 🇺🇸 English)
3. Click each language option
4. **Expected:** Language confirmation message in selected language
5. **Expected:** Main menu appears after 1.5 seconds

**✅ Pass Criteria:** All 3 languages work, main menu appears correctly

### 1.2 Main Menu Navigation
**Test:** Main menu buttons
1. **Expected buttons:**
   - 📦 Mahsulotlar/Товары/Products
   - 📝 Buyurtma/Заказ/Order
   - 💬 Fikr bildirish/Отзыв/Feedback
   - 📞 Kontakt/Контакт/Contact
   - ℹ️ Ma'lumot/Информация/Information
   - 🌐 Til/Язык/Language
   - 👑 Admin Panel (only for admin)

2. Test each button responds appropriately

**✅ Pass Criteria:** All menu buttons work, admin panel only visible to @fayzmotr

---

## 📦 Phase 2: Product Management

### 2.1 Product Display (Client View)
**Test:** Product catalog functionality
1. Click "📦 Products" button
2. **Expected:** List of products with inline buttons
3. **Format:** `ProductName - Price so'm (Stock dona)`
4. Click on any product
5. **Expected Product Details:**
   - **With Photo:** Product image displays with caption containing details
   - **Without Photo:** Text message with product details
   - Order button present
   - Product name, price, stock, minimum order shown
   - Description shown if available
6. Test "🔙 Orqaga" (Back) button

**✅ Pass Criteria:** Products display correctly with photos when available, navigation works smoothly

### 2.2 Admin Product Management
**Test:** Admin can manage products
1. Login as admin (@fayzmotr)
2. Go to Admin Panel → Products
3. **Test Add Product (Full Flow):**
   - Click "➕ Mahsulot qo'shish"
   - Enter product names in UZ/RU/EN
   - Set price (numbers only)
   - Set stock quantity
   - Set minimum order quantity
   - Add description (optional - test skip button)
   - **Test Photo Upload:**
     - Upload a product photo (JPG/PNG)
     - **Expected:** Photo accepted with confirmation
     - **OR** Test "⏭️ Fotosiz saqlash" (Skip photo) button
   - **Expected:** Product created successfully with photo

4. **Test Product List:**
   - View all products
   - Check that products with photos display correctly
   - Check edit buttons (currently shows "coming soon")

**✅ Pass Criteria:** Admin can add products with photos, data saves to database correctly

---

## 📝 Phase 3: Order System

### 3.1 Order Flow (Client)
**Test:** Complete order process
1. Click "📦 Products" → Select any product → Click "📝 Buyurtma"
2. **Step 1 - Quantity:**
   - Enter quantity (test: less than minimum, more than stock, valid amount)
   - **Expected:** Proper validation messages
3. **Step 2 - Customer Name:**
   - Enter full name
   - **Expected:** Name validation (minimum 2 characters)
4. **Step 3 - Phone Number:**
   - Enter phone number
   - **Expected:** Phone validation (minimum 9 digits)
5. **Step 4 - Notes (Optional):**
   - Add notes or skip
   - **Expected:** Option to skip or add notes
6. **Final Confirmation:**
   - **Expected:** Order summary with ID
   - **Expected:** Notification sent to "bps data" group

**✅ Pass Criteria:** Complete order flow works, validation functions properly, group notification sent

### 3.2 Admin Order Management
**Test:** Admin order handling
1. Login as admin
2. Go to Admin Panel → Orders
3. **Expected:** List of all orders with details
4. Click on any order
5. **Expected:** Order details with status update buttons
6. Test status updates: Pending → Confirmed → Delivered

**✅ Pass Criteria:** Admin can view and update order status

### 3.3 Group Order Notifications
**Test:** Group integration for orders
1. Place a test order (follow 3.1 steps)
2. Check "bps data" group
3. **Expected notification format:**
   ```
   🆕 YANGI BUYURTMA!
   
   🆔 Buyurtma: #[ID]
   📅 Sana: [timestamp]
   
   👤 MIJOZ:
   • Ism: [customer name]
   • Telefon: [phone]
   • Username: @[username]
   • ID: [user_id]
   
   📦 MAHSULOT:
   • Nom: [product name]
   • Miqdor: [quantity] dona
   • Narx: [total] so'm
   
   📝 Izoh: [notes if any]
   
   ⚡ Tezda javob bering!
   ```
4. **Expected buttons:** ✅ Qabul qilish | ❌ Rad etish | 📞 [phone]
5. Test action buttons work

**✅ Pass Criteria:** Notifications appear in group with correct format and working buttons

---

## 💬 Phase 4: Feedback System

### 4.1 Feedback Submission (Client)
**Test:** Feedback functionality
1. Click "💬 Feedback" button
2. **Expected:** Feedback prompt in user's language
3. Enter feedback message
4. **Test validation:** Try very short message (less than 5 characters)
5. **Expected:** Proper validation message
6. Enter valid feedback
7. **Expected:** Success confirmation with feedback ID

**✅ Pass Criteria:** Feedback validation works, success message shows feedback ID

### 4.2 Admin Feedback Management
**Test:** Admin feedback handling
1. Login as admin
2. Go to Admin Panel → Feedback
3. **Expected:** List of all feedback with status
4. Click on any feedback
5. **Expected:** Full feedback details
6. Test "Mark as Read" functionality

**✅ Pass Criteria:** Admin can view and manage feedback properly

### 4.3 Group Feedback Notifications
**Test:** Group integration for feedback
1. Submit test feedback (follow 4.1 steps)
2. Check "bps data" group
3. **Expected notification format:**
   ```
   💬 YANGI FIKR!
   
   🆔 Fikr: #[ID]
   📅 Sana: [timestamp]
   
   👤 FOYDALANUVCHI:
   • Ism: [first name]
   • Username: @[username]
   • ID: [user_id]
   
   💬 XABAR:
   [feedback message]
   
   📋 Tur: 💬 Fikr
   ```
4. **Expected buttons:** 💬 Javob berish | ✅ Ko'rildi
5. Test "Ko'rildi" button works

**✅ Pass Criteria:** Feedback notifications appear in group with working buttons

---

## 👑 Phase 5: Admin Panel Functions

### 5.1 Admin Authentication
**Test:** Admin access control
1. **Test with regular user:** Admin Panel button should not appear
2. **Test with admin (@fayzmotr):** Admin Panel button visible
3. **Test unauthorized access:** Non-admin trying admin commands gets "Access denied"

**✅ Pass Criteria:** Only authorized admin can access admin functions

### 5.2 Admin Dashboard
**Test:** Admin panel navigation
1. Access Admin Panel
2. **Expected sections:**
   - 📦 Mahsulotlar (Products)
   - 📋 Buyurtmalar (Orders)  
   - 💬 Fikrlar (Feedback)
   - 📊 Statistika (Statistics)
3. Test navigation between sections
4. Test back buttons work

**✅ Pass Criteria:** All admin sections accessible and functional

### 5.3 Statistics Dashboard
**Test:** Admin statistics
1. Go to Admin Panel → Statistics
2. **Expected data:**
   - Total orders count
   - Total products count
   - Total feedback count
   - Recent activity summary

**✅ Pass Criteria:** Statistics display current data accurately

---

## 🌐 Phase 6: Multilingual Support

### 6.1 Language Switching
**Test:** All supported languages
1. Test language change button: "🌐 Til/Язык/Language"
2. Switch between: O'zbek → Русский → English → O'zbek
3. **Expected:** All interface elements change language
4. Test main menu, product names, messages in each language

**✅ Pass Criteria:** Complete interface translation works for all 3 languages

### 6.2 Product Multilingual Display
**Test:** Product names in different languages
1. Add a test product with names in UZ/RU/EN
2. Switch language and view products
3. **Expected:** Product names change according to selected language

**✅ Pass Criteria:** Products display in correct language

---

## 📱 Phase 7: Error Handling & Edge Cases

### 7.1 Database Connection
**Test:** System resilience
1. **Test:** Try operations when database might be slow
2. **Expected:** Appropriate error messages, not system crashes
3. **Test:** Invalid product IDs, order IDs

**✅ Pass Criteria:** Graceful error handling, user-friendly error messages

### 7.2 Invalid Inputs
**Test:** Input validation
1. **Order quantities:** negative numbers, text instead of numbers
2. **Phone numbers:** letters, too short numbers
3. **Product management:** empty fields, invalid prices

**✅ Pass Criteria:** Proper validation prevents invalid data entry

### 7.3 Group Integration Resilience
**Test:** Group notification failures
1. **Test:** What happens if group is unavailable
2. **Expected:** Main functionality still works, orders/feedback still saved
3. Check logs for appropriate error messages

**✅ Pass Criteria:** Main bot functions work even if group notifications fail

---

## 🔄 Phase 8: Full User Journey Testing

### 8.1 Complete Customer Flow
**Test:** End-to-end customer experience
1. **Start:** New user starts bot
2. **Select language** → **Browse products** → **Place order** → **Submit feedback**
3. **Time this process** - should be smooth and intuitive
4. **Test different paths:** Order → Feedback, Feedback → Order

**✅ Pass Criteria:** Complete customer journey is smooth, intuitive, under 5 minutes

### 8.2 Complete Admin Flow
**Test:** End-to-end admin experience
1. **Admin login** → **Add product** → **Check orders** → **Manage feedback**
2. **Handle group notifications** → **Update order status**
3. **View statistics** → **Check all admin features**

**✅ Pass Criteria:** Admin can efficiently manage all business operations

---

## 📊 Testing Checklist Summary

**Basic Functions:**
- [ ] Start command works
- [ ] Language selection (3 languages)
- [ ] Main menu navigation
- [ ] Contact/Info pages

**Product System:**
- [ ] Product catalog display
- [ ] Product details view
- [ ] Admin product creation
- [ ] Multilingual product names

**Order System:**
- [ ] Complete order flow
- [ ] Input validation
- [ ] Order confirmation
- [ ] Admin order management
- [ ] Group order notifications

**Feedback System:**
- [ ] Feedback submission
- [ ] Feedback validation
- [ ] Admin feedback viewing
- [ ] Group feedback notifications

**Admin Panel:**
- [ ] Access control
- [ ] Product management
- [ ] Order management
- [ ] Feedback management
- [ ] Statistics dashboard

**Group Integration:**
- [ ] Order notifications to group
- [ ] Feedback notifications to group
- [ ] Action buttons work in group
- [ ] Error resilience

**Multilingual:**
- [ ] All 3 languages work
- [ ] Language persistence
- [ ] Product name translation

**Edge Cases:**
- [ ] Invalid inputs handled
- [ ] Database errors handled
- [ ] Group failures handled
- [ ] User experience smooth

---

## 🎯 Success Criteria

**The bot passes testing if:**
- ✅ All basic functions work smoothly
- ✅ Order system is complete and reliable  
- ✅ Feedback system functions properly
- ✅ Admin panel provides full management capabilities
- ✅ Group notifications work reliably
- ✅ All 3 languages work completely
- ✅ Error handling is graceful
- ✅ User experience is intuitive

**🎉 When all tests pass, the bot is ready for production use!**

---

## 📷 Phase 9: Photo Functionality Testing

### 9.1 Product Photo Upload (Admin)
**Test:** Photo upload during product creation
1. **Go to Admin Panel** → Products → "➕ Mahsulot qo'shish"
2. **Complete product details** (name, price, stock, etc.)
3. **Photo Upload Test:**
   - Upload JPG/PNG photo (test different file sizes)
   - **Expected:** Photo accepted, confirmation message shown
4. **Skip Photo Test:**
   - Click "⏭️ Fotosiz saqlash" button
   - **Expected:** Product created without photo
5. **Complete creation** and verify product appears in list

**✅ Pass Criteria:** Both photo upload and skip photo options work correctly

### 9.2 Product Photo Display (Client)
**Test:** Photo display in product catalog
1. **Browse products** with and without photos
2. **Products with photos:**
   - **Expected:** Photo displays with product details as caption
   - Order button and navigation work properly
3. **Products without photos:**
   - **Expected:** Text-only message with same functionality
4. **Test photo quality** - images should be clear and properly sized

**✅ Pass Criteria:** Photos display correctly in product catalog, functionality maintained

### 9.3 Group Notification Photos
**Test:** Photos in group notifications
1. **Place order** for product WITH photo
2. **Check "bps data" group:**
   - **Expected:** Notification shows as photo message
   - Product photo displays with order details as caption
   - Action buttons work properly
3. **Place order** for product WITHOUT photo
4. **Check group:**
   - **Expected:** Notification shows as text message
   - All information still included, buttons work

**✅ Pass Criteria:** Group notifications adapt correctly based on photo availability

### 9.4 Photo Error Handling
**Test:** Edge cases and error scenarios
1. **Large file upload** (>20MB) - should be rejected by Telegram
2. **Invalid file types** (test .txt, .pdf) - should be ignored
3. **Multiple photos** sent at once - should accept largest one
4. **Slow network** - photo upload should not break the flow

**✅ Pass Criteria:** Error scenarios handled gracefully, product creation continues

---

## 📋 Updated Testing Checklist Summary

**Basic Functions:**
- [ ] Start command works
- [ ] Language selection (3 languages)
- [ ] Main menu navigation
- [ ] Contact/Info pages

**Product System:**
- [ ] Product catalog display
- [ ] Product details view (with/without photos)
- [ ] Admin product creation with photo upload
- [ ] Photo skip functionality
- [ ] Multilingual product names

**Order System:**
- [ ] Complete order flow
- [ ] Input validation
- [ ] Order confirmation
- [ ] Admin order management
- [ ] Group order notifications (with/without photos)

**Feedback System:**
- [ ] Feedback submission
- [ ] Feedback validation
- [ ] Admin feedback viewing
- [ ] Group feedback notifications

**Admin Panel:**
- [ ] Access control
- [ ] Product management with photos
- [ ] Order management
- [ ] Feedback management
- [ ] Statistics dashboard

**Group Integration:**
- [ ] Order notifications to group (with photos)
- [ ] Feedback notifications to group
- [ ] Action buttons work in group
- [ ] Error resilience

**Photo Features:**
- [ ] Photo upload during product creation
- [ ] Photo display in product catalog
- [ ] Photo inclusion in group notifications
- [ ] Skip photo functionality
- [ ] Error handling for photos

**Multilingual:**
- [ ] All 3 languages work
- [ ] Language persistence
- [ ] Product name translation

**Edge Cases:**
- [ ] Invalid inputs handled
- [ ] Database errors handled
- [ ] Group failures handled
- [ ] Photo upload errors handled
- [ ] User experience smooth

**🎉 When all tests pass, the bot is ready for production use!**

---

## 📞 Support

If any tests fail:
1. Check bot logs for error messages
2. Verify database connection
3. Confirm group configuration
4. Check environment variables

**Next Step:** After successful testing → Mini App development for product catalog