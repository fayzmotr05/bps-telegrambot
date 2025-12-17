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
            
            // Get fresh report data by actually inputting the phone number 
            const reportData = await PhoneRegistryService.getTodaysReportData(phoneNumber, dateStr);
            
            if (!reportData || !reportData.rawData) {
                console.log('❌ No sheet data returned');
                return false;
            }
            
            console.log(`🔍 Checking ${reportData.rawData.length} rows from fresh sheet data`);
            
            // Print first few rows to debug
            console.log('🔍 First 10 rows of sheet data:');
            for (let i = 0; i < Math.min(10, reportData.rawData.length); i++) {
                const row = reportData.rawData[i];
                console.log(`🔍 Row ${i + 1}:`, row ? row.slice(0, 5) : 'empty');
            }
            
            // Check if there's actual client data in row 1-2
            let hasClientData = false;
            if (reportData.rawData.length > 0) {
                const row1 = reportData.rawData[0];
                const row2 = reportData.rawData[1];
                
                // Row 1 should have phone number
                if (row1 && row1[1] && row1[1].toString().includes(phoneNumber.slice(-8))) {
                    console.log('✅ Found phone number in row 1');
                    hasClientData = true;
                }
                
                // Row 2 should have client name and dates
                if (row2 && row2.length >= 3 && row2[1] && row2[2] === dateStr) {
                    console.log('✅ Found client data and correct date in row 2');
                    hasClientData = true;
                }
            }
            
            if (!hasClientData) {
                console.log('❌ No client data found in first rows');
                return false;
            }
            
            // Check for actual purchase data (look for data beyond row 7)
            let hasOrderData = false;
            
            // Look for order data in rows after the headers
            for (let i = 8; i < reportData.rawData.length; i++) {
                const row = reportData.rawData[i];
                if (row && row.length > 2) {
                    // Check if this row has actual order data (date, product, amount, etc.)
                    let hasData = false;
                    for (let j = 0; j < row.length; j++) {
                        if (row[j] && row[j].toString().trim() !== '' && 
                            !row[j].toString().includes('Покупок за указанный период не найдено')) {
                            hasData = true;
                            break;
                        }
                    }
                    if (hasData) {
                        console.log(`✅ Found order data in row ${i + 1}:`, row.slice(0, 5));
                        hasOrderData = true;
                        break;
                    }
                }
            }
            
            // IMPORTANT FIX: If we have valid client data (phone number and dates match),
            // consider this as having orders even if A8 says "no orders found"
            // because the data was successfully retrieved after inputting phone + date
            if (hasClientData) {
                console.log('✅ Orders found (has valid client data with matching phone and date)');
                return true;
            }
            
            console.log('❌ No valid client data or orders found');
            return false;
            
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