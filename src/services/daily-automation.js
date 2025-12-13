const cron = require('node-cron');
const UserRegistryService = require('./user-registry');
const PhoneRegistryService = require('./phone-registry');
const ExcelReportService = require('./excel-report-generator');
const { getMessage } = require('../config/messages');

class DailyAutomationService {
    constructor(bot) {
        this.bot = bot;
        this.isRunning = false;
    }

    // Initialize daily automation
    init() {
        console.log('📅 Initializing daily automation service...');
        
        // Schedule daily reports at 11:50 PM every day (end of day)
        cron.schedule('50 23 * * *', () => {
            this.sendDailyReports();
        }, {
            scheduled: true,
            timezone: "Asia/Tashkent"
        });

        // For testing: schedule every hour
        // cron.schedule('0 * * * *', () => {
        //     this.sendDailyReports();
        // });

        console.log('✅ Daily automation scheduled for 11:50 PM (Tashkent time)');
    }

    // Send daily reports to all registered users
    async sendDailyReports() {
        if (this.isRunning) {
            console.log('⏳ Daily reports already running, skipping...');
            return;
        }

        this.isRunning = true;
        console.log('📊 Starting daily reports automation...');

        try {
            // Get all registered users
            const registeredUsers = await UserRegistryService.getAllRegisteredUsers();
            console.log(`📱 Found ${registeredUsers.length} registered users`);

            if (registeredUsers.length === 0) {
                console.log('📭 No registered users found');
                this.isRunning = false;
                return;
            }

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            let successCount = 0;
            let errorCount = 0;

            // Process each user
            for (const user of registeredUsers) {
                try {
                    await this.sendDailyReportToUser(user, todayStr);
                    successCount++;
                    
                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`❌ Failed to send daily report to ${user.phone_number}:`, error.message);
                    errorCount++;
                    
                    // Continue with next user even if one fails
                    continue;
                }
            }

            console.log(`📊 Daily reports completed: ${successCount} success, ${errorCount} errors`);

        } catch (error) {
            console.error('❌ Daily reports automation error:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Send daily report to a specific user
    async sendDailyReportToUser(user, dateStr) {
        try {
            console.log(`📤 Sending daily report to ${user.phone_number} (${user.telegram_id})`);

            // Get today's report data
            const reportData = await PhoneRegistryService.getTodaysReportData(user.phone_number, dateStr);

            if (!reportData || Object.keys(reportData.calculatedData || {}).length === 0) {
                console.log(`📭 No data found for ${user.phone_number} on ${dateStr}`);
                
                // Send "no data" message
                const lang = user.language_code || 'uz';
                const noDataMessage = getMessage('dailyReports.noDataToday', lang) || 
                    `📭 Bugun ${dateStr} sana uchun ma'lumotlar topilmadi.`;
                
                await this.bot.telegram.sendMessage(user.telegram_id, noDataMessage);
                return;
            }

            // Generate Excel report
            const language = user.language_code || 'uz';
            const excelPath = await ExcelReportService.generateReport(
                reportData,
                user.phone_number,
                dateStr,
                dateStr,
                language
            );

            // Send Excel report to user
            const caption = getMessage('dailyReports.todayReport', language) || 
                `📊 Bugungi hisobot - ${this.formatDate(dateStr)}`;

            await this.bot.telegram.sendDocument(
                user.telegram_id,
                { source: excelPath },
                { caption: caption }
            );

            // Clean up Excel file
            await ExcelReportService.cleanup(excelPath);

            console.log(`✅ Daily report sent successfully to ${user.phone_number}`);

        } catch (error) {
            console.error(`❌ Error sending daily report to user ${user.phone_number}:`, error);
            throw error;
        } finally {
            // Always clean up the report data
            await PhoneRegistryService.cleanupReportData();
        }
    }

    // Manual trigger for testing
    async triggerDailyReports() {
        console.log('🧪 Manually triggering daily reports...');
        await this.sendDailyReports();
    }

    // Send test report to specific user
    async sendTestReport(telegramId) {
        try {
            const user = await UserRegistryService.getUserByTelegramId(telegramId);
            if (!user) {
                throw new Error('User not registered');
            }

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            await this.sendDailyReportToUser(user, todayStr);
            return true;
        } catch (error) {
            console.error('❌ Test report error:', error);
            throw error;
        }
    }

    // Format date for display
    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateStr;
        }
    }

    // Get automation status
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextRun: 'Daily at 11:50 PM (Tashkent time)',
            timezone: 'Asia/Tashkent'
        };
    }
}

module.exports = DailyAutomationService;