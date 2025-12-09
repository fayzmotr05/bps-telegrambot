const { Scenes, Markup } = require('telegraf');
const SheetsService = require('../services/google-sheets');
const PDFService = require('../services/pdf-generator');
const messages = require('../config/messages');

const contactReportScene = new Scenes.BaseScene('contact-report');

let reportQueue = new Map();

contactReportScene.enter(async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.reply(
            messages[lang].contactReport.requestContact,
            Markup.keyboard([
                [Markup.button.contactRequest(messages[lang].contactReport.shareContact)],
                [messages[lang].back]
            ]).resize()
        );
    } catch (error) {
        console.error('Error in contact report scene enter:', error);
        await ctx.reply(messages[lang].errors.general);
        await ctx.scene.leave();
    }
});

contactReportScene.on('contact', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        const phoneNumber = ctx.message.contact.phone_number;
        const userId = ctx.from.id;
        
        if (reportQueue.has(phoneNumber)) {
            await ctx.reply(messages[lang].contactReport.alreadyProcessing);
            return;
        }
        
        reportQueue.set(phoneNumber, { userId, status: 'processing', timestamp: Date.now() });
        
        await ctx.reply(messages[lang].contactReport.processing);
        
        await ctx.reply(
            messages[lang].contactReport.selectDateRange,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback(messages[lang].contactReport.today, 'date_today'),
                    Markup.button.callback(messages[lang].contactReport.customRange, 'date_custom')
                ]
            ])
        );
        
        ctx.session.pendingPhoneNumber = phoneNumber;
        
    } catch (error) {
        console.error('Error processing contact:', error);
        reportQueue.delete(ctx.session.pendingPhoneNumber);
        await ctx.reply(messages[lang].errors.general);
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
        
        await generateReport(ctx, ctx.session.pendingPhoneNumber, fromDate, toDate);
        
    } catch (error) {
        console.error('Error with today date selection:', error);
        await ctx.reply(messages[lang].errors.general);
        await ctx.scene.leave();
    }
});

contactReportScene.action('date_custom', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.answerCbQuery();
        await ctx.reply(messages[lang].contactReport.enterFromDate);
        ctx.session.awaitingFromDate = true;
        
    } catch (error) {
        console.error('Error with custom date selection:', error);
        await ctx.reply(messages[lang].errors.general);
        await ctx.scene.leave();
    }
});

contactReportScene.on('text', async (ctx) => {
    const lang = ctx.session.language || 'uz';
    
    try {
        if (ctx.message.text === messages[lang].back) {
            reportQueue.delete(ctx.session.pendingPhoneNumber);
            await ctx.scene.leave();
            return;
        }
        
        if (ctx.session.awaitingFromDate) {
            const dateText = ctx.message.text.trim();
            if (!isValidDate(dateText)) {
                await ctx.reply(messages[lang].contactReport.invalidDate);
                return;
            }
            ctx.session.fromDate = dateText;
            ctx.session.awaitingFromDate = false;
            ctx.session.awaitingToDate = true;
            await ctx.reply(messages[lang].contactReport.enterToDate);
            return;
        }
        
        if (ctx.session.awaitingToDate) {
            const dateText = ctx.message.text.trim();
            if (!isValidDate(dateText)) {
                await ctx.reply(messages[lang].contactReport.invalidDate);
                return;
            }
            
            const fromDate = ctx.session.fromDate;
            const toDate = dateText;
            
            if (new Date(toDate) < new Date(fromDate)) {
                await ctx.reply(messages[lang].contactReport.invalidDateRange);
                return;
            }
            
            ctx.session.awaitingToDate = false;
            await generateReport(ctx, ctx.session.pendingPhoneNumber, fromDate, toDate);
            return;
        }
        
    } catch (error) {
        console.error('Error processing text in contact report:', error);
        await ctx.reply(messages[lang].errors.general);
        await ctx.scene.leave();
    }
});

async function generateReport(ctx, phoneNumber, fromDate, toDate) {
    const lang = ctx.session.language || 'uz';
    
    try {
        await ctx.reply(messages[lang].contactReport.generatingReport);
        
        await SheetsService.updateCells(phoneNumber, fromDate, toDate);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const reportData = await SheetsService.getReportData();
        
        if (!reportData || Object.keys(reportData).length === 0) {
            await ctx.reply(messages[lang].contactReport.noDataFound);
            reportQueue.delete(phoneNumber);
            await ctx.scene.leave();
            return;
        }
        
        const pdfPath = await PDFService.generateReport(reportData, phoneNumber, fromDate, toDate, lang);
        
        await ctx.replyWithDocument(
            { source: pdfPath },
            { caption: messages[lang].contactReport.reportGenerated }
        );
        
        await PDFService.cleanup(pdfPath);
        
        reportQueue.delete(phoneNumber);
        await ctx.reply(messages[lang].contactReport.completed);
        await ctx.scene.leave();
        
    } catch (error) {
        console.error('Error generating report:', error);
        reportQueue.delete(phoneNumber);
        await ctx.reply(messages[lang].contactReport.errorGenerating);
        await ctx.scene.leave();
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
            messages[lang].mainMenu,
            Markup.keyboard([
                [messages[lang].order, messages[lang].myOrders],
                [messages[lang].contactReport.title, messages[lang].about],
                [messages[lang].contact, messages[lang].language]
            ]).resize()
        );
        
    } catch (error) {
        console.error('Error leaving contact report scene:', error);
    }
});

module.exports = contactReportScene;