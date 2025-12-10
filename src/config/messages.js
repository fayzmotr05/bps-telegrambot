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
         `📧 Email: euroasiaprint@gmail.com\n` +
         `🏢 Yuqori sifatli bosma mahsulotlar`,
    ru: `📞 BPS (Euroasia Print)\n\n` +
         `📱 Телефон: +998946375555\n` +
         `📱 Телефон 2: +998946666940\n` +
         `📍 Адрес: г. Ташкент\n` +
         `🕐 Рабочее время: пон-суббота с 08:00 по 18:00\n` +
         `📧 Email: euroasiaprint@gmail.com\n` +
         `🏢 Высококачественная полиграфия`,
    en: `📞 BPS (Euroasia Print)\n\n` +
         `📱 Phone: +998946375555\n` +
         `📱 Phone 2: +998946666940\n` +
         `📍 Address: Tashkent\n` +
         `🕐 Working hours: Mon-Sat 08:00 - 18:00\n` +
         `📧 Email: euroasiaprint@gmail.com\n` +
         `🏢 High-quality printing products`
  },

  // Company info
  companyInfo: {
    uz: `🏢 BPS (EUROASIA PRINT) HAQIDA\n\n` +
         `📋 Biz yuqori sifatli daftarlar ishlab chiqaruvchisimiz:\n\n` +
         `📚 Turli xil daftarlar va bloknotlar\n` +
         `📖 Maktab daftarlari\n` +
         `📔 Ishchi daftarlari\n` +
         `📕 Maxsus formatdagi daftarlar\n\n` +
         `⭐ Bizning afzalliklarimiz:\n` +
         `✅ Yuqori sifatli qog'oz\n` +
         `✅ Tez yetkazib berish\n` +
         `✅ Hamyonbop narxlar\n` +
         `✅ Katta hajmdagi buyurtmalar\n` +
         `✅ Professional xizmat\n\n` +
         `📞 Daftar buyurtma uchun bog'laning!`,
    ru: `🏢 О КОМПАНИИ BPS (EUROASIA PRINT)\n\n` +
         `📋 Мы производители высококачественных тетрадей:\n\n` +
         `📚 Различные виды тетрадей и блокнотов\n` +
         `📖 Школьные тетради\n` +
         `📔 Рабочие тетради\n` +
         `📕 Тетради специальных форматов\n\n` +
         `⭐ Наши преимущества:\n` +
         `✅ Высококачественная бумага\n` +
         `✅ Быстрая доставка\n` +
         `✅ Доступные цены\n` +
         `✅ Крупные объемы заказов\n` +
         `✅ Профессиональное обслуживание\n\n` +
         `📞 Свяжитесь для заказа тетрадей!`,
    en: `🏢 ABOUT BPS (EUROASIA PRINT)\n\n` +
         `📋 We are manufacturers of high-quality notebooks:\n\n` +
         `📚 Various types of notebooks and notepads\n` +
         `📖 School notebooks\n` +
         `📔 Working notebooks\n` +
         `📕 Special format notebooks\n\n` +
         `⭐ Our advantages:\n` +
         `✅ High-quality paper\n` +
         `✅ Fast delivery\n` +
         `✅ Affordable prices\n` +
         `✅ Large volume orders\n` +
         `✅ Professional service\n\n` +
         `📞 Contact us to order notebooks!`
  },

  // Contact Report messages
  contactReport: {
    title: {
      uz: '📊 Hisobot',
      ru: '📊 Отчет', 
      en: '📊 Report'
    },
    requestContact: {
      uz: '📞 Hisobot olish uchun telefon raqamingizni ulashing.\n\nQuyidagi tugmani bosing:',
      ru: '📞 Поделитесь номером телефона для получения отчета.\n\nНажмите кнопку ниже:',
      en: '📞 Share your phone number to get a report.\n\nPress the button below:'
    },
    shareContact: {
      uz: '📱 Telefon raqamni ulashish',
      ru: '📱 Поделиться номером',
      en: '📱 Share Phone Number'
    },
    processing: {
      uz: '⏳ Telefon raqamingiz qabul qilindi. Hisobot tayyorlanmoqda...',
      ru: '⏳ Номер телефона принят. Готовим отчет...',
      en: '⏳ Phone number received. Preparing report...'
    },
    alreadyProcessing: {
      uz: '⚠️ Bu raqam uchun hisobot allaqachon tayyorlanmoqda. Iltimos kutib turing.',
      ru: '⚠️ Отчет для этого номера уже готовится. Пожалуйста, подождите.',
      en: '⚠️ Report for this number is already being processed. Please wait.'
    },
    selectDateRange: {
      uz: '📅 Hisobot uchun sana oralig\'ini tanlang:',
      ru: '📅 Выберите диапазон дат для отчета:',
      en: '📅 Select date range for report:'
    },
    today: {
      uz: '📅 Bugun',
      ru: '📅 Сегодня',
      en: '📅 Today'
    },
    customRange: {
      uz: '📅 Boshqa sana',
      ru: '📅 Другие даты',
      en: '📅 Custom Range'
    },
    enterFromDate: {
      uz: '📅 Boshlanish sanasini kiriting (YYYY-MM-DD formatida):\n\nMasalan: 2024-01-15',
      ru: '📅 Введите дату начала (в формате YYYY-MM-DD):\n\nНапример: 2024-01-15',
      en: '📅 Enter start date (YYYY-MM-DD format):\n\nExample: 2024-01-15'
    },
    enterToDate: {
      uz: '📅 Tugash sanasini kiriting (YYYY-MM-DD formatida):\n\nMasalan: 2024-01-31',
      ru: '📅 Введите дату окончания (в формате YYYY-MM-DD):\n\nНапример: 2024-01-31',
      en: '📅 Enter end date (YYYY-MM-DD format):\n\nExample: 2024-01-31'
    },
    invalidDate: {
      uz: '❌ Noto\'g\'ri sana formati. Iltimos YYYY-MM-DD formatida kiriting.\n\nMasalan: 2024-01-15',
      ru: '❌ Неверный формат даты. Пожалуйста, введите в формате YYYY-MM-DD.\n\nНапример: 2024-01-15',
      en: '❌ Invalid date format. Please enter in YYYY-MM-DD format.\n\nExample: 2024-01-15'
    },
    invalidDateRange: {
      uz: '❌ Tugash sanasi boshlanish sanasidan kichik bo\'lishi mumkin emas.',
      ru: '❌ Дата окончания не может быть раньше даты начала.',
      en: '❌ End date cannot be earlier than start date.'
    },
    generatingReport: {
      uz: '📊 Hisobot yaratilmoqda... Iltimos kutib turing.',
      ru: '📊 Генерируется отчет... Пожалуйста, подождите.',
      en: '📊 Generating report... Please wait.'
    },
    noDataFound: {
      uz: '❌ Sizning telefon raqamingiz uchun ma\'lumot topilmadi.',
      ru: '❌ Данные для вашего номера телефона не найдены.',
      en: '❌ No data found for your phone number.'
    },
    reportGenerated: {
      uz: '✅ Hisobotingiz tayyor! PDF faylni yuklab oling.',
      ru: '✅ Ваш отчет готов! Скачайте PDF файл.',
      en: '✅ Your report is ready! Download the PDF file.'
    },
    completed: {
      uz: '✅ Hisobot muvaffaqiyatli yuborildi.',
      ru: '✅ Отчет успешно отправлен.',
      en: '✅ Report sent successfully.'
    },
    errorGenerating: {
      uz: '❌ Hisobot yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
      ru: '❌ Ошибка при создании отчета. Пожалуйста, попробуйте снова.',
      en: '❌ Error generating report. Please try again.'
    }
  },

  // Errors
  errors: {
    general: {
      uz: '❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
      ru: '❌ Произошла ошибка. Пожалуйста, попробуйте снова.',
      en: '❌ An error occurred. Please try again.'
    }
  },

  // Navigation
  back: {
    uz: '⬅️ Orqaga',
    ru: '⬅️ Назад',
    en: '⬅️ Back'
  },

  // Main menu labels  
  mainMenuTitle: {
    uz: '🏠 Asosiy menyu',
    ru: '🏠 Главное меню',
    en: '🏠 Main Menu'
  },

  order: {
    uz: '📝 Buyurtma',
    ru: '📝 Заказ', 
    en: '📝 Order'
  },

  myOrders: {
    uz: '📋 Mening buyurtmalarim',
    ru: '📋 Мои заказы',
    en: '📋 My Orders'
  },

  about: {
    uz: 'ℹ️ Biz haqimizda',
    ru: 'ℹ️ О нас',
    en: 'ℹ️ About Us'
  },

  contact: {
    uz: '📞 Kontakt',
    ru: '📞 Контакт',
    en: '📞 Contact'
  },

  language: {
    uz: '🌐 Til',
    ru: '🌐 Язык',
    en: '🌐 Language'
  },

  // Phone Registration messages
  phoneRegistration: {
    title: {
      uz: '📱 Telefon ro\'yxatdan o\'tish',
      ru: '📱 Регистрация телефона',
      en: '📱 Phone Registration'
    },
    welcome: {
      uz: '📱 Telefon raqamingizni ro\'yxatdan o\'tkazish uchun quyidagi tugmani bosing.\n\nBu sizga kunlik hisobotlar olish imkonini beradi.',
      ru: '📱 Нажмите кнопку ниже, чтобы зарегистрировать номер телефона.\n\nЭто позволит вам получать ежедневные отчеты.',
      en: '📱 Press the button below to register your phone number.\n\nThis will allow you to receive daily reports.'
    },
    sharePhone: {
      uz: '📱 Telefon raqamini ulashish',
      ru: '📱 Поделиться номером телефона',
      en: '📱 Share Phone Number'
    },
    processing: {
      uz: '⏳ Telefon raqamingiz tekshirilmoqda...',
      ru: '⏳ Проверяем ваш номер телефона...',
      en: '⏳ Checking your phone number...'
    },
    success: {
      uz: '✅ Telefon raqamingiz muvaffaqiyatli ro\'yxatdan o\'tkazildi!',
      ru: '✅ Ваш номер телефона успешно зарегистрирован!',
      en: '✅ Your phone number has been successfully registered!'
    },
    alreadyRegistered: {
      uz: '✅ Siz allaqachon ro\'yxatdan o\'tgansiz.',
      ru: '✅ Вы уже зарегистрированы.',
      en: '✅ You are already registered.'
    },
    notInDirectory: {
      uz: '❌ Sizning telefon raqamingiz bizning ma\'lumotlar bazasida topilmadi.\n\nIltimos, admin bilan bog\'laning.',
      ru: '❌ Ваш номер телефона не найден в нашей базе данных.\n\nПожалуйста, свяжитесь с администратором.',
      en: '❌ Your phone number was not found in our database.\n\nPlease contact the administrator.'
    },
    error: {
      uz: '❌ Ro\'yxatdan o\'tishda xatolik yuz berdi.',
      ru: '❌ Ошибка при регистрации.',
      en: '❌ Registration error occurred.'
    },
    ownPhoneOnly: {
      uz: '❌ Faqat o\'z telefon raqamingizni ro\'yxatdan o\'tkazishingiz mumkin.',
      ru: '❌ Вы можете зарегистрировать только свой номер телефона.',
      en: '❌ You can only register your own phone number.'
    },
    useContactButton: {
      uz: '📱 Iltimos, "Telefon raqamini ulashish" tugmasidan foydalaning.',
      ru: '📱 Пожалуйста, используйте кнопку "Поделиться номером телефона".',
      en: '📱 Please use the "Share Phone Number" button.'
    },
    dailyReports: {
      uz: '📊 Endi siz har kuni soat 23:50 da avtomatik hisobotlar olasiz.\n\n💡 Istalgan vaqtda "📊 Hisobot" tugmasini bosib, bugun yoki boshqa sanalar uchun hisobot olishingiz mumkin.',
      ru: '📊 Теперь вы будете получать автоматические отчеты каждый день в 23:50.\n\n💡 Вы также можете нажать кнопку "📊 Отчет" в любое время, чтобы получить отчет за сегодня или другие даты.',
      en: '📊 You will now receive automatic reports every day at 11:50 PM.\n\n💡 You can also press the "📊 Report" button anytime to get reports for today or other dates.'
    }
  },

  // Daily Reports messages  
  dailyReports: {
    noDataToday: {
      uz: '📭 Bugun uchun ma\'lumotlar topilmadi.',
      ru: '📭 Данные на сегодня не найдены.',
      en: '📭 No data found for today.'
    },
    todayReport: {
      uz: '📊 Bugungi kunlik hisobot',
      ru: '📊 Ежедневный отчет на сегодня',
      en: '📊 Today\'s daily report'
    }
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