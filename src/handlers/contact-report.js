const { Scenes, Markup } = require('telegraf');
const SheetsService = require('../services/google-sheets');
const PDFService = require('../services/pdf-generator-simple');
const UserRegistryService = require('../services/user-registry');
const PhoneRegistryService = require('../services/phone-registry');
const { getMessage } = require('../config/messages');

const contactReportScene = new Scenes.BaseScene('contact-report');

let reportQueue = new Map();

contactReportScene.enter(async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        // Check if user is already registered
        const isRegistered = await UserRegistryService.isUserRegistered(ctx.from.id);
        
        if (isRegistered) {
            // User is registered, skip phone number collection and go directly to date selection
            const user = await UserRegistryService.getUserByTelegramId(ctx.from.id);
            console.log(`📱 Registered user ${user.phone_number} requesting report`);
            
            await ctx.reply(
                getMessage('contactReport.selectDateRange', lang),
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback(getMessage('contactReport.today', lang), 'date_today'),
                        Markup.button.callback(getMessage('contactReport.customRange', lang), 'date_custom')
                    ]
                ])
            );
            
            ctx.session.registeredUser = user;
            ctx.session.skipPhoneCollection = true;
        } else {
            // User not registered, ask for phone number
            await ctx.reply(
                getMessage('contactReport.requestContact', lang),
                Markup.keyboard([
                    [Markup.button.contactRequest(getMessage('contactReport.shareContact', lang))],
                    [getMessage('back', lang)]
                ]).resize()
            );
        }
    } catch (error) {
        console.error('Error in contact report scene enter:', error);
        await ctx.reply(getMessage('errors.general', lang));
        await ctx.scene.leave();
    }
});

contactReportScene.on('contact', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        const phoneNumber = ctx.message.contact.phone_number;
        const userId = ctx.from.id;
        
        if (reportQueue.has(phoneNumber)) {
            await ctx.reply(getMessage('contactReport.alreadyProcessing', lang));
            return;
        }
        
        reportQueue.set(phoneNumber, { userId, status: 'processing', timestamp: Date.now() });
        
        await ctx.reply(getMessage('contactReport.processing', lang));
        
        await ctx.reply(
            getMessage('contactReport.selectDateRange', lang),
            Markup.inlineKeyboard([
                [
                    Markup.button.callback(getMessage('contactReport.today', lang), 'date_today'),
                    Markup.button.callback(getMessage('contactReport.customRange', lang), 'date_custom')
                ]
            ])
        );
        
        ctx.session.pendingPhoneNumber = phoneNumber;
        
    } catch (error) {
        console.error('Error processing contact:', error);
        reportQueue.delete(ctx.session.pendingPhoneNumber);
        await ctx.reply(getMessage('errors.general', lang));
        await ctx.scene.leave();
    }
});

contactReportScene.action('date_today', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.answerCbQuery();
        
        const today = new Date();
        const fromDate = today.toISOString().split('T')[0];
        const toDate = fromDate;
        
        // Use phone number from registered user or pending phone number
        const phoneNumber = ctx.session.registeredUser ? 
            ctx.session.registeredUser.phone_number : 
            ctx.session.pendingPhoneNumber;
        
        await generateReport(ctx, phoneNumber, fromDate, toDate);
        
    } catch (error) {
        console.error('Error with today date selection:', error);
        await ctx.reply(getMessage('errors.general', lang));
        await ctx.scene.leave();
    }
});

contactReportScene.action('date_custom', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.answerCbQuery();
        await ctx.reply(getMessage('contactReport.enterFromDate', lang));
        ctx.session.awaitingFromDate = true;
        
    } catch (error) {
        console.error('Error with custom date selection:', error);
        await ctx.reply(getMessage('errors.general', lang));
        await ctx.scene.leave();
    }
});

contactReportScene.on('text', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        if (ctx.message.text === getMessage('back', lang)) {
            reportQueue.delete(ctx.session.pendingPhoneNumber);
            await ctx.scene.leave();
            return;
        }
        
        if (ctx.session.awaitingFromDate) {
            const dateText = ctx.message.text.trim();
            if (!isValidDate(dateText)) {
                await ctx.reply(getMessage('contactReport.invalidDate', lang));
                return;
            }
            ctx.session.fromDate = dateText;
            ctx.session.awaitingFromDate = false;
            ctx.session.awaitingToDate = true;
            await ctx.reply(getMessage('contactReport.enterToDate', lang));
            return;
        }
        
        if (ctx.session.awaitingToDate) {
            const dateText = ctx.message.text.trim();
            if (!isValidDate(dateText)) {
                await ctx.reply(getMessage('contactReport.invalidDate', lang));
                return;
            }
            
            const fromDate = ctx.session.fromDate;
            const toDate = dateText;
            
            if (new Date(toDate) < new Date(fromDate)) {
                await ctx.reply(getMessage('contactReport.invalidDateRange', lang));
                return;
            }
            
            // Use phone number from registered user or pending phone number
            const phoneNumber = ctx.session.registeredUser ? 
                ctx.session.registeredUser.phone_number : 
                ctx.session.pendingPhoneNumber;
            
            ctx.session.awaitingToDate = false;
            await generateReport(ctx, phoneNumber, fromDate, toDate);
            return;
        }
        
    } catch (error) {
        console.error('Error processing text in contact report:', error);
        await ctx.reply(getMessage('errors.general', lang));
        await ctx.scene.leave();
    }
});

async function generateReport(ctx, phoneNumber, fromDate, toDate) {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.reply(getMessage('contactReport.generatingReport', lang));
        
        // Use the new PhoneRegistryService for better data handling
        const reportData = await PhoneRegistryService.getTodaysReportData(phoneNumber, fromDate);
        
        if (!reportData || Object.keys(reportData.calculatedData || {}).length === 0) {
            await ctx.reply(getMessage('contactReport.noDataFound', lang));
            reportQueue.delete(phoneNumber);
            await ctx.scene.leave();
            return;
        }
        
        const pdfPath = await PDFService.generateReport(reportData, phoneNumber, fromDate, toDate, lang);
        
        await ctx.replyWithDocument(
            { source: pdfPath },
            { caption: getMessage('contactReport.reportGenerated', lang) }
        );
        
        await PDFService.cleanup(pdfPath);
        
        reportQueue.delete(phoneNumber);
        await ctx.reply(getMessage('contactReport.completed', lang));
        await ctx.scene.leave();
        
    } catch (error) {
        console.error('Error generating report:', error);
        reportQueue.delete(phoneNumber);
        await ctx.reply(getMessage('contactReport.errorGenerating', lang));
        await ctx.scene.leave();
    } finally {
        // Always clean up
        await PhoneRegistryService.cleanupReportData();
    }
}

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString().split('T')[0] === dateString;
}

contactReportScene.leave(async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        if (ctx.session.pendingPhoneNumber) {
            reportQueue.delete(ctx.session.pendingPhoneNumber);
            delete ctx.session.pendingPhoneNumber;
            delete ctx.session.fromDate;
            delete ctx.session.awaitingFromDate;
            delete ctx.session.awaitingToDate;
        }
        
        await ctx.reply(
            getMessage('mainMenuTitle', lang),
            Markup.keyboard([
                [getMessage('order', lang), getMessage('myOrders', lang)],
                [getMessage('contactReport.title', lang), getMessage('about', lang)],
                [getMessage('contact', lang), getMessage('language', lang)]
            ]).resize()
        );
        
    } catch (error) {
        console.error('Error leaving contact report scene:', error);
    }
});

module.exports = contactReportScene;