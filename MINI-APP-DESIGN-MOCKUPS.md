# 🎨 BPS Mini App - Design Mockups & Visual Concepts

## 📱 **Mobile Interface Layouts**

### **Main Product Catalogue**
```
┌─────────────────────────┐
│ 🔍 [Search products...] │ ← Search bar with icon
├─────────────────────────┤
│ 📦 All  💰 Sale  ⭐ New │ ← Category pills (scrollable)
├─────────────────────────┤
│ ┌─────────┐ ┌─────────┐ │
│ │  [IMG]  │ │  [IMG]  │ │ ← Product grid (2 columns)
│ │A4 Daftar│ │Qalam Set│ │
│ │50,000 ↗️│ │15,000 ↗️│ │ ← Price + order arrow
│ │✅ Mavjud│ │❌ Tugagan│ │ ← Stock status
│ └─────────┘ └─────────┘ │
│ ┌─────────┐ ┌─────────┐ │
│ │  [IMG]  │ │  [IMG]  │ │
│ │Notebook │ │Pen Blue │ │
│ │25,000 ↗️│ │5,000  ↗️│ │
│ │⚠️ Kam   │ │✅ Mavjud│ │
│ └─────────┘ └─────────┘ │
└─────────────────────────┘
```

### **Product Detail Modal**
```
┌─────────────────────────┐
│           ❌           │ ← Close button
│ ┌─────────────────────┐ │
│ │                     │ │
│ │      [PRODUCT]      │ │ ← Large product image
│ │       [IMAGE]       │ │
│ │                     │ │
│ └─────────────────────┘ │
│ **A4 Daftar 48 varaq** │ ← Product name
│ 💰 **50,000 so'm**      │ ← Price (bold)
│                         │
│ 📦 **Qoldiq:** 150 dona │ ← Stock info
│ 📊 **Minimal:** 10 dona │ ← Minimum order
│                         │
│ 📝 Yuqori sifatli...    │ ← Description
│                         │
│ ┌─────────────────────┐ │
│ │   🛒 BUYURTMA       │ │ ← Order button (prominent)
│ │      BERISH         │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### **Search & Filter Interface**
```
┌─────────────────────────┐
│ 🔍 [daftar____________] │ ← Search input
│     💡 A4 daftar        │ ← Search suggestions
│     💡 Daftar 48 varaq  │
│     💡 School daftar    │
├─────────────────────────┤
│ 🔧 **FILTRLAR**         │ ← Filter section
│                         │
│ 💰 **Narx oralig'i:**   │
│ ○ 0 - 10,000           │
│ ○ 10,000 - 50,000      │ ← Price range options
│ ● 50,000+              │
│                         │
│ 📦 **Mavjudlik:**       │
│ ☑️ Mavjud              │ ← Stock filters
│ ☐ Tugagan              │
│ ☐ Kam qolgan           │
│                         │
│ ┌─────────┐ ┌─────────┐ │
│ │  RESET  │ │ QIDIRISH│ │ ← Filter actions
│ └─────────┘ └─────────┘ │
└─────────────────────────┘
```

---

## 🎨 **Color Scheme Examples**

### **Light Theme (Default)**
```css
/* Main product card */
.product-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

/* Primary action button */
.order-button {
  background: linear-gradient(135deg, #0088cc 0%, #006ba3 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 136, 204, 0.3);
}

/* Success indicators */
.in-stock {
  color: #16a34a;
  background: #dcfce7;
}

/* Warning indicators */
.low-stock {
  color: #ca8a04;
  background: #fef3c7;
}
```

### **Dark Theme (Auto-detected)**
```css
/* Dark theme overrides */
.dark .product-card {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .text-primary {
  color: #e5e7eb;
}

.dark .order-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}
```

---

## 📐 **Component Specifications**

### **Product Card Dimensions**
```
Mobile (375px width):
┌─────────────────┐
│ Card: 170x220px │
│ Image: 170x120px│ ← 16:9 aspect ratio
│ Content: 100px  │ ← Name, price, status
└─────────────────┘

Tablet (768px width):
┌─────────────────┐
│ Card: 220x280px │
│ Image: 220x140px│
│ Content: 140px  │
└─────────────────┘
```

### **Typography Scale**
```
Product Name: 
  Mobile: 14px/18px (font-semibold)
  Tablet: 16px/20px (font-semibold)

Product Price:
  Mobile: 16px/20px (font-bold, text-blue-600)
  Tablet: 18px/22px (font-bold, text-blue-600)

Stock Status:
  Mobile: 12px/16px (font-medium)
  Tablet: 13px/17px (font-medium)
```

### **Interactive States**
```css
/* Hover state (desktop) */
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease-out;
}

/* Active/Tap state (mobile) */
.product-card:active {
  transform: scale(0.98);
  transition: transform 0.1s ease-in;
}

/* Focus state (accessibility) */
.product-card:focus {
  outline: 2px solid #0088cc;
  outline-offset: 2px;
}
```

---

## 🔄 **User Flow Diagrams**

### **Main User Journey**
```
[Open Mini App] 
       ↓
[Browse Products] → [Use Search/Filter] → [View More Products]
       ↓                                          ↑
[Tap Product]                                    │
       ↓                                          │
[View Details] → [Back to List] ─────────────────┘
       ↓
[Tap Order Button]
       ↓
[Switch to Bot] → [Complete Order] → [Back to Mini App]
                         ↓                    ↓
                  [Order Confirmed]    [Continue Shopping]
```

### **Search & Discovery Flow**
```
[Land on Catalogue]
       ↓
[See Featured Products] → [Scroll Down] → [See More Products]
       ↓
[Use Search Bar] → [See Suggestions] → [Tap Suggestion] → [See Results]
       ↓                                                        │
[Apply Filters] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←─┘
       ↓
[Refined Results] → [Find Product] → [Order]
```

---

## 📊 **Performance Considerations**

### **Image Optimization Strategy**
```
Original Upload: High resolution (1200x800px)
                       ↓
Mini App Display Sizes:
├── Thumbnail: 170x120px (WebP, 15KB max)
├── Card View: 340x240px (WebP, 30KB max)
└── Detail View: 600x400px (WebP, 60KB max)

Loading Strategy:
1. Show placeholder with skeleton
2. Load thumbnail first (instant)
3. Lazy load higher resolution on demand
4. Cache images for offline viewing
```

### **Data Loading Strategy**
```
App Launch:
├── Load first 20 products (essential data only)
├── Cache product images
└── Preload search index

User Scrolling:
├── Infinite scroll with 20-item batches
├── Predictive loading (next batch when 80% scrolled)
└── Maintain max 100 items in memory

Search/Filter:
├── Debounce input (300ms delay)
├── Client-side filtering for loaded data
└── Server search for unloaded data
```

---

## 🎯 **Accessibility Features**

### **Screen Reader Support**
```jsx
// Product card example
<article 
  role="button"
  aria-label="A4 daftar 48 varaq, 50000 som, mavjud"
  tabIndex={0}
  onClick={handleProductClick}
  onKeyPress={handleKeyPress}
>
  <img 
    src={product.image} 
    alt={`${product.name} mahsuloti rasmi`}
    loading="lazy"
  />
  <h3>{product.name}</h3>
  <span aria-label="Narx">{product.price} so'm</span>
  <span aria-live="polite">{stockStatus}</span>
</article>
```

### **Keyboard Navigation**
- Tab order: Search → Filters → Products (grid order)
- Enter/Space: Activate buttons and cards
- Escape: Close modals and filters
- Arrow keys: Navigate product grid

### **Touch Accessibility**
- Minimum 44px touch targets
- Adequate spacing between interactive elements
- Visual feedback for all touches
- Support for voice control commands

---

## 🌐 **Multi-language Support**

### **Language Resources Structure**
```typescript
// translations/uz.ts
export const uzTranslations = {
  common: {
    search: "Qidirish",
    filter: "Filtr", 
    order: "Buyurtma berish",
    price: "Narx",
    stock: "Qoldiq"
  },
  product: {
    inStock: "Mavjud",
    outOfStock: "Tugagan", 
    lowStock: "Kam qolgan",
    minOrder: "Minimal buyurtma"
  }
};

// Same structure for ru.ts and en.ts
```

### **RTL Language Support**
```css
/* Future Arabic/Persian support */
[dir="rtl"] .product-grid {
  direction: rtl;
}

[dir="rtl"] .product-card {
  text-align: right;
}
```

---

## 🚀 **Technical Implementation Preview**

### **React Component Structure**
```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── SearchBar.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   └── ProductFilter.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Layout.tsx
```

### **State Management Example**
```typescript
// store/productStore.ts
interface ProductStore {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  filters: FilterState;
  
  // Actions
  loadProducts: () => Promise<void>;
  searchProducts: (query: string) => void;
  applyFilters: (filters: FilterState) => void;
  selectProduct: (id: string) => void;
}
```

---

This comprehensive design system ensures our Mini App will be:
- **Modern & Intuitive** - Easy to use for all age groups
- **Fast & Responsive** - Optimized for mobile performance  
- **Accessible** - Works for users with disabilities
- **Scalable** - Easy to add new features later
- **Brand Consistent** - Matches your business identity

**Ready to start Phase 1 development when you approve the plan!** 🚀