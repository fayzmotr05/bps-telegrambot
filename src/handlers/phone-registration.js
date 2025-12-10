const { Scenes, Markup } = require('telegraf');
const UserRegistryService = require('../services/user-registry');
const { getMessage } = require('../config/messages');

const phoneRegistrationScene = new Scenes.BaseScene('phone-registration');

phoneRegistrationScene.enter(async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        console.log('📱 Phone registration scene: enter called for user', ctx.from.id);
        
        // Check if user is already registered
        const isRegistered = await UserRegistryService.isUserRegistered(ctx.from.id);
        
        if (isRegistered) {
            const user = await UserRegistryService.getUserByTelegramId(ctx.from.id);
            await ctx.reply(getMessage('phoneRegistration.alreadyRegistered', lang) + `\n📱 ${user.phone_number}`);
            await ctx.scene.leave();
            return;
        }

        await ctx.reply(
            getMessage('phoneRegistration.welcome', lang) || '📱 Telefon raqamingizni ro\'yxatdan o\'tkazish uchun quyidagi tugmani bosing.\n\nBu sizga kunlik hisobotlar olish imkonini beradi.',
            Markup.keyboard([
                [Markup.button.contactRequest(getMessage('phoneRegistration.sharePhone', lang) || '📱 Telefon raqamini ulashish')],
                [getMessage('back', lang) || '🔙 Orqaga']
            ]).resize()
        );
        
        console.log('📱 Phone registration scene: welcome message sent successfully');
    } catch (error) {
        console.error('❌ Error in phone registration scene enter:', error);
        await ctx.reply(getMessage('errors.general', lang) || '❌ Xatolik yuz berdi');
        await ctx.scene.leave();
    }
});

phoneRegistrationScene.on('contact', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        const contact = ctx.message.contact;
        const phoneNumber = contact.phone_number;
        
        // Only allow users to register their own phone number
        if (contact.user_id && contact.user_id !== ctx.from.id) {
            await ctx.reply(getMessage('phoneRegistration.ownPhoneOnly', lang) || '❌ Faqat o\'z telefon raqamingizni ro\'yxatdan o\'tkazishingiz mumkin.');
            return;
        }

        await ctx.reply(getMessage('phoneRegistration.processing', lang) || '⏳ Telefon raqamingiz tekshirilmoqda...');

        // Register the phone number
        const result = await UserRegistryService.registerUserPhone(
            ctx.from.id,
            phoneNumber,
            ctx.from.first_name,
            ctx.from.last_name,
            ctx.from.username
        );

        if (result.success) {
            await ctx.reply(
                (getMessage('phoneRegistration.success', lang) || '✅ Telefon raqamingiz muvaffaqiyatli ro\'yxatdan o\'tkazildi!') + 
                `\n📱 ${result.normalizedPhone}\n\n` +
                (getMessage('phoneRegistration.dailyReports', lang) || 'Siz endi har kuni avtomatik hisobotlar olasiz.'),
                Markup.removeKeyboard()
            );
        } else {
            if (result.reason === 'Phone number not found in registry') {
                await ctx.reply(getMessage('phoneRegistration.notInDirectory', lang) || '❌ Sizning telefon raqamingiz bizning ma\'lumotlar bazasida topilmadi.\n\nIltimos, admin bilan bog\'laning.');
            } else {
                await ctx.reply((getMessage('phoneRegistration.error', lang) || '❌ Ro\'yxatdan o\'tishda xatolik yuz berdi.') + `\n${result.reason}`);
            }
        }

        await ctx.scene.leave();

    } catch (error) {
        console.error('Error processing phone registration:', error);
        await ctx.reply(getMessage('errors.general', lang) || '❌ Xatolik yuz berdi');
        await ctx.scene.leave();
    }
});

phoneRegistrationScene.on('text', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    if (ctx.message.text === getMessage('back', lang) || ctx.message.text === '🔙 Orqaga') {
        await ctx.scene.leave();
        return;
    }

    await ctx.reply(getMessage('phoneRegistration.useContactButton', lang) || '📱 Iltimos, "Telefon raqamini ulashish" tugmasidan foydalaning.');
});

phoneRegistrationScene.leave(async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.reply(
            getMessage('mainMenuTitle', lang) || '🏠 Asosiy menyu',
            Markup.keyboard([
                [(getMessage('mainMenu.products', lang) || '📦 Mahsulotlar'), (getMessage('order', lang) || '📝 Buyurtma')],
                [(getMessage('contactReport.title', lang) || '📊 Hisobot'), (getMessage('mainMenu.feedback', lang) || '💬 Fikr bildirish')],
                [(getMessage('phoneRegistration.title', lang) || '📱 Telefon ro\'yxatdan o\'tish'), (getMessage('contact', lang) || '📞 Kontakt')],
                [(getMessage('about', lang) || 'ℹ️ Biz haqimizda'), (getMessage('language', lang) || '🌐 Til')]
            ]).resize()
        );
    } catch (error) {
        console.error('Error leaving phone registration scene:', error);
    }
});

module.exports = phoneRegistrationScene;