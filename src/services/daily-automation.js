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
        
        // Schedule daily reports at 11:55 AM every day
        cron.schedule('55 11 * * *', () => {
            this.sendDailyReports();
        }, {
            scheduled: true,
            timezone: "Asia/Tashkent"
        });

        // For testing: schedule every hour
        // cron.schedule('0 * * * *', () => {
        //     this.sendDailyReports();
        // });

        console.log('✅ Daily automation scheduled for 11:55 AM (Tashkent time)');
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

            // Use Uzbekistan timezone (UTC+5) for correct date
            const today = new Date();
            const uzbekistanTime = new Date(today.getTime() + (5 * 60 * 60 * 1000)); // UTC+5
            const todayStr = uzbekistanTime.toISOString().split('T')[0];
            
            console.log('📅 Automation date calculation:', {
                serverTime: today.toISOString(),
                uzbekistanTime: uzbekistanTime.toISOString(),
                selectedDate: todayStr
            });
            
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;

            // Calculate delay based on user count (aim to complete within 30 minutes)
            const totalUsers = registeredUsers.length;
            const maxTimeMinutes = 30;
            const estimatedTimePerUser = 10; // seconds (data check + Excel generation + sending)
            const baseDelay = Math.max(1000, Math.min(10000, (maxTimeMinutes * 60 * 1000) / totalUsers - estimatedTimePerUser * 1000));
            
            console.log(`⏱️ Calculated delay: ${baseDelay}ms for ${totalUsers} users (max ${maxTimeMinutes} min)`);

            // Process each user
            for (let i = 0; i < registeredUsers.length; i++) {
                const user = registeredUsers[i];
                try {
                    const result = await this.sendDailyReportToUser(user, todayStr);
                    
                    if (result === 'skipped') {
                        skippedCount++;
                        console.log(`⏭️ Skipped ${user.phone_number} (no orders)`);
                    } else {
                        successCount++;
                        console.log(`✅ Sent to ${user.phone_number} (${i + 1}/${totalUsers})`);
                    }
                    
                    // Add calculated delay between users
                    if (i < registeredUsers.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, baseDelay));
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to send daily report to ${user.phone_number}:`, error.message);
                    errorCount++;
                    
                    // Continue with next user even if one fails
                    continue;
                }
            }

            console.log(`📊 Daily reports completed: ${successCount} sent, ${skippedCount} skipped (no orders), ${errorCount} errors`);

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

            // Get phone registry check to extract client name
            const phoneCheckResult = await PhoneRegistryService.checkPhoneAndGetTodaysReport(user.phone_number);
            const clientName = phoneCheckResult.phoneEntry?.clientName || null;
            
            // Get today's report data
            const reportData = await PhoneRegistryService.getTodaysReportData(user.phone_number, dateStr);

            if (!reportData || Object.keys(reportData.calculatedData || {}).length === 0) {
                console.log(`📭 No data found for ${user.phone_number} on ${dateStr}`);
                return 'skipped'; // Skip user - no data means no orders
            }

            // Check if user has orders by looking at the actual sheet data 
            const hasOrders = await this.checkUserHasOrdersFromSheet(user.phone_number, dateStr);
            
            if (!hasOrders) {
                console.log(`📭 No orders found for ${user.phone_number} on ${dateStr} (sheet check)`);
                return 'skipped'; // Skip user - no orders today
            }
            
            console.log(`📦 Orders found for ${user.phone_number}, sending report...`);

            // Generate Excel report with client name
            const language = user.language_code || 'uz';
            const excelPath = await ExcelReportService.generateReport(
                reportData,
                user.phone_number,
                dateStr,
                dateStr,
                language,
                clientName
            );

            // Send Excel report to user with personalized message
            const baseCaption = getMessage('dailyReports.todayReport', language) || 
                `📊 Bugungi hisobot - ${this.formatDate(dateStr)}`;
            const caption = clientName ? 
                `${clientName}, ${baseCaption.toLowerCase()}` : 
                baseCaption;

            await this.bot.telegram.sendDocument(
                user.telegram_id,
                { source: excelPath },
                { caption: caption }
            );

            // Clean up Excel file
            await ExcelReportService.cleanup(excelPath);

            console.log(`✅ Daily report sent successfully to ${user.phone_number}`);
            return 'sent';

        } catch (error) {
            console.error(`❌ Error sending daily report to user ${user.phone_number}:`, error);
            throw error;
        } finally {
            // Always clean up the report data
            await PhoneRegistryService.cleanupReportData();
        }
    }

    // Check if user has orders by directly checking the sheet
    async checkUserHasOrdersFromSheet(phoneNumber, dateStr) {
        try {
            console.log(`🔍 Checking orders for ${phoneNumber} on ${dateStr} directly from sheet...`);
            
            // Get fresh report data by actually inputting the phone number AND today's date
            const reportData = await PhoneRegistryService.getTodaysReportData(phoneNumber, dateStr);
            
            if (!reportData || !reportData.rawData) {
                console.log('❌ No sheet data returned');
                return false;
            }
            
            // Check A8 cell content (row 8, column A = index [7][0])
            const row8 = reportData.rawData[7];
            const a8Content = row8 && row8[0] ? row8[0].toString() : '';
            
            console.log(`🔍 A8 cell content: "${a8Content}"`);
            
            // Check if A8 contains "zero" or "no orders" message
            const hasNoOrders = a8Content.includes('Покупок за указанный период не найдено') || 
                               a8Content.toLowerCase().includes('zero') || 
                               a8Content.trim() === '0';
            
            if (hasNoOrders) {
                console.log('❌ No orders found (A8 indicates zero/no orders)');
                return false;
            }
            
            console.log('✅ Orders found (A8 does not indicate zero/no orders)');
            return true;
            
        } catch (error) {
            console.error('❌ Error checking orders from sheet:', error.message);
            // If there's an error, be conservative and skip the user
            return false;
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
            nextRun: 'Daily at 11:55 AM (Tashkent time)',
            timezone: 'Asia/Tashkent'
        };
    }
}

module.exports = DailyAutomationService;