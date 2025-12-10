const { Scenes, Markup } = require('telegraf');
const UserRegistryService = require('../services/user-registry');
const messages = require('../config/messages');

const phoneRegistrationScene = new Scenes.BaseScene('phone-registration');

phoneRegistrationScene.enter(async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        // Check if user is already registered
        const isRegistered = await UserRegistryService.isUserRegistered(ctx.from.id);
        
        if (isRegistered) {
            const user = await UserRegistryService.getUserByTelegramId(ctx.from.id);
            await ctx.reply(messages[lang].phoneRegistration.alreadyRegistered + `\n📱 ${user.phone_number}`);
            await ctx.scene.leave();
            return;
        }

        await ctx.reply(
            messages[lang].phoneRegistration.welcome,
            Markup.keyboard([
                [Markup.button.contactRequest(messages[lang].phoneRegistration.sharePhone)],
                [messages[lang].back]
            ]).resize()
        );
    } catch (error) {
        console.error('Error in phone registration scene enter:', error);
        await ctx.reply(messages[lang].errors.general);
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
            await ctx.reply(messages[lang].phoneRegistration.ownPhoneOnly);
            return;
        }

        await ctx.reply(messages[lang].phoneRegistration.processing);

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
                messages[lang].phoneRegistration.success + 
                `\n📱 ${result.normalizedPhone}\n\n` +
                messages[lang].phoneRegistration.dailyReports,
                Markup.removeKeyboard()
            );
        } else {
            if (result.reason === 'Phone number not found in registry') {
                await ctx.reply(messages[lang].phoneRegistration.notInDirectory);
            } else {
                await ctx.reply(messages[lang].phoneRegistration.error + `\n${result.reason}`);
            }
        }

        await ctx.scene.leave();

    } catch (error) {
        console.error('Error processing phone registration:', error);
        await ctx.reply(messages[lang].errors.general);
        await ctx.scene.leave();
    }
});

phoneRegistrationScene.on('text', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    if (ctx.message.text === messages[lang].back) {
        await ctx.scene.leave();
        return;
    }
    
    // If user types text instead of sharing contact
    await ctx.reply(messages[lang].phoneRegistration.useContactButton);
});

phoneRegistrationScene.leave(async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.reply(
            messages[lang].mainMenuTitle,
            Markup.keyboard([
                [messages[lang].mainMenu.products, messages[lang].order],
                [messages[lang].contactReport.title, messages[lang].mainMenu.feedback],
                [messages[lang].phoneRegistration.title, messages[lang].contact],
                [messages[lang].about, messages[lang].language]
            ]).resize()
        );
    } catch (error) {
        console.error('Error leaving phone registration scene:', error);
    }
});

module.exports = phoneRegistrationScene;