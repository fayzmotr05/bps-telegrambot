// Multilingual messages for BPS Telegram Bot
// Simple structure with room for expansion

const messages = {
  // Welcome and start messages
  welcome: {
    uz: '👋 Assalomu aleykum!\n\nBPS (Euroasia Print) kompaniyasining rasmiy botiga xush kelibsiz!\n\nTilni tanlang:',
    ru: '👋 Здравствуйте!\n\nДобро пожаловать в официальный бот компании BPS (Euroasia Print)!\n\nВыберите язык:',
    en: '👋 Hello!\n\nWelcome to the official bot of BPS (Euroasia Print) company!\n\nChoose language:'
  },

  languageSet: {
    uz: '✅ Til o\'rnatildi: O\'zbek tili',
    ru: '✅ Язык установлен: Русский',
    en: '✅ Language set: English'
  },

  miniAppWelcome: {
    uz: '📱 Mini App\'dan xush kelibsiz!\n\nSiz tanlagan mahsulot uchun buyurtma berasiz.',
    ru: '📱 Добро пожаловать из Mini App!\n\nВы заказываете выбранный товар.',
    en: '📱 Welcome from Mini App!\n\nYou are ordering the selected product.'
  },

  welcomeBack: {
    uz: '🏠 Botga qaytganingiz uchun rahmat!\n\nQuyida mahsulotlar katalogi:',
    ru: '🏠 Спасибо, что вернулись в бот!\n\nВот каталог товаров:',
    en: '🏠 Thanks for returning to the bot!\n\nHere is the product catalog:'
  },

  // Main menu buttons
  mainMenu: {
    products: {
      uz: '📦 Mahsulotlar',
      ru: '📦 Товары',
      en: '📦 Products'
    },
    order: {
      uz: '📝 Buyurtma',
      ru: '📝 Заказ',
      en: '📝 Order'
    },
    catalog: {
      uz: '📱 Katalog',
      ru: '📱 Каталог',
      en: '📱 Catalog'
    },
    feedback: {
      uz: '💬 Fikr bildirish',
      ru: '💬 Отзыв',
      en: '💬 Feedback'
    },
    contact: {
      uz: '📞 Kontakt',
      ru: '📞 Контакт',
      en: '📞 Contact'
    },
    info: {
      uz: 'ℹ️ Ma\'lumot',
      ru: 'ℹ️ Информация',
      en: 'ℹ️ Information'
    },
    language: {
      uz: '🌐 Til',
      ru: '🌐 Язык',
      en: '🌐 Language'
    },
    adminPanel: {
      uz: '👑 Admin Panel',
      ru: '👑 Админ Панель',
      en: '👑 Admin Panel'
    }
  },

  // Language selection
  languageButtons: {
    uzbek: '🇺🇿 O\'zbek tili',
    russian: '🇷🇺 Русский язык',
    english: '🇺🇸 English'
  },

  // Products
  noProducts: {
    uz: '📦 Hozircha mahsulotlar mavjud emas.',
    ru: '📦 Товары пока недоступны.',
    en: '📦 No products available at the moment.'
  },

  productList: {
    uz: '📦 MAHSULOTLAR RO\'YXATI',
    ru: '📦 СПИСОК ТОВАРОВ',
    en: '📦 PRODUCTS LIST'
  },

  // Orders
  orderStart: {
    uz: 'Buyurtma berish uchun mahsulotni tanlang yoki nomini yozing:',
    ru: 'Для заказа выберите товар или напишите его название:',
    en: 'To place an order, select a product or write its name:'
  },

  // Common responses
  error: {
    uz: '❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
    ru: '❌ Произошла ошибка. Пожалуйста, попробуйте снова.',
    en: '❌ An error occurred. Please try again.'
  },

  cancel: {
    uz: '❌ Bekor qilindi',
    ru: '❌ Отменено',
    en: '❌ Cancelled'
  },

  // Contact info
  contactInfo: {
    uz: `📞 BPS (Euroasia Print)\n\n` +
         `📱 Telefon: +998946375555\n` +
         `📱 Telefon 2: +998946666940\n` +
         `📍 Manzil: Toshkent shahri\n` +
         `🕐 Ish vaqti: пон-суббота с 08:00 по 18:00\n` +
         `📧 Email: uroasiaprint@gmail.com\n` +
         `🏢 Yuqori sifatli bosma mahsulotlar`,
    ru: `📞 BPS (Euroasia Print)\n\n` +
         `📱 Телефон: +998946375555\n` +
         `📱 Телефон 2: +998946666940\n` +
         `📍 Адрес: г. Ташкент\n` +
         `🕐 Рабочее время: пон-суббота с 08:00 по 18:00\n` +
         `📧 Email: uroasiaprint@gmail.com\n` +
         `🏢 Высококачественная полиграфия`,
    en: `📞 BPS (Euroasia Print)\n\n` +
         `📱 Phone: +998946375555\n` +
         `📱 Phone 2: +998946666940\n` +
         `📍 Address: Tashkent\n` +
         `🕐 Working hours: Mon-Sat 08:00 - 18:00\n` +
         `📧 Email: uroasiaprint@gmail.com\n` +
         `🏢 High-quality printing products`
  },

  // Company info
  companyInfo: {
    uz: `🏢 BPS (EUROASIA PRINT) HAQIDA\n\n` +
         `📋 Biz yuqori sifatli bosma mahsulotlar ishlab chiqaruvchisimiz:\n\n` +
         `📚 Daftarlar va bloknotlar\n` +
         `📦 Qadoqlash materiallari\n` +
         `📄 Ofis buyumlari\n` +
         `🎨 Reklama materiallari\n\n` +
         `⭐ Bizning afzalliklarimiz:\n` +
         `✅ Yuqori sifat\n` +
         `✅ Tez yetkazib berish\n` +
         `✅ Hamyonbop narxlar\n` +
         `✅ Katta hajmdagi buyurtmalar\n` +
         `✅ Professional xizmat\n\n` +
         `📞 Buyurtma uchun bog'laning!`,
    ru: `🏢 О КОМПАНИИ BPS (EUROASIA PRINT)\n\n` +
         `📋 Мы производители высококачественной печатной продукции:\n\n` +
         `📚 Тетради и блокноты\n` +
         `📦 Упаковочные материалы\n` +
         `📄 Офисные принадлежности\n` +
         `🎨 Рекламные материалы\n\n` +
         `⭐ Наши преимущества:\n` +
         `✅ Высокое качество\n` +
         `✅ Быстрая доставка\n` +
         `✅ Доступные цены\n` +
         `✅ Крупные объемы заказов\n` +
         `✅ Профессиональное обслуживание\n\n` +
         `📞 Свяжитесь для заказа!`,
    en: `🏢 ABOUT BPS (EUROASIA PRINT)\n\n` +
         `📋 We are manufacturers of high-quality printed products:\n\n` +
         `📚 Notebooks and notepads\n` +
         `📦 Packaging materials\n` +
         `📄 Office supplies\n` +
         `🎨 Advertising materials\n\n` +
         `⭐ Our advantages:\n` +
         `✅ High quality\n` +
         `✅ Fast delivery\n` +
         `✅ Affordable prices\n` +
         `✅ Large volume orders\n` +
         `✅ Professional service\n\n` +
         `📞 Contact us to order!`
  }
};

// Helper function to get message by key and language
function getMessage(key, language = 'uz', ...args) {
  try {
    const keys = key.split('.');
    let message = messages;
    
    for (const k of keys) {
      message = message[k];
      if (!message) break;
    }
    
    if (!message) {
      console.warn(`Message not found: ${key}`);
      return `Missing: ${key}`;
    }
    
    let text = message[language] || message.uz || message;
    
    // Simple placeholder replacement {0}, {1}, etc.
    if (args.length > 0 && typeof text === 'string') {
      args.forEach((arg, index) => {
        text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
      });
    }
    
    return text;
  } catch (error) {
    console.error(`Error getting message ${key}:`, error);
    return `Error: ${key}`;
  }
}

module.exports = {
  messages,
  getMessage
};