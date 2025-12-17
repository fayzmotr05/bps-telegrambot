const { db } = require('../config/database');
const PhoneRegistryService = require('./phone-registry');

class UserRegistryService {
    
    // Register user phone number with their Telegram ID
    async registerUserPhone(telegramId, phoneNumber, firstName, lastName, username) {
        try {
            console.log('📱 === USER REGISTRY DEBUG ===');
            console.log(`📱 Registering phone for user ${telegramId}`);
            console.log(`📱 Input phone: "${phoneNumber}"`);
            console.log(`📱 Input phone type: ${typeof phoneNumber}`);
            console.log(`📱 Input phone length: ${phoneNumber ? phoneNumber.length : 0}`);
            console.log(`📱 User: ${firstName} ${lastName} (@${username})`);
            console.log('📱 === CALLING PHONE REGISTRY CHECK ===');
            
            // Check if phone is in the registry first
            const phoneCheck = await PhoneRegistryService.checkPhoneAndGetTodaysReport(phoneNumber);
            
            console.log('📱 === PHONE REGISTRY RESULT ===');
            console.log('📱 Phone check result:', JSON.stringify(phoneCheck, null, 2));
            console.log('📱 === END USER REGISTRY DEBUG ===');
            
            if (!phoneCheck.registered) {
                return {
                    success: false,
                    reason: phoneCheck.reason,
                    registered: false
                };
            }

            // Store the association in database
            const userData = {
                telegram_id: telegramId,
                phone_number: phoneCheck.normalizedPhone,
                normalized_phone: phoneCheck.normalizedPhone,
                original_phone: phoneNumber,
                first_name: firstName,
                last_name: lastName,
                username: username,
                registered_at: new Date().toISOString(),
                is_registered: true,
                registry_row: phoneCheck.phoneEntry.row
            };

            // Check if user already exists
            const existingUser = await db.getUserByPhone(phoneCheck.normalizedPhone);
            
            if (existingUser) {
                // Update existing user
                await db.updateUserPhone(telegramId, userData);
                console.log(`✅ Updated existing user registration for ${phoneCheck.normalizedPhone}`);
            } else {
                // Create new user registration
                await db.createUserPhone(userData);
                console.log(`✅ New user registered: ${phoneCheck.normalizedPhone}`);
            }

            return {
                success: true,
                registered: true,
                normalizedPhone: phoneCheck.normalizedPhone,
                userData: userData
            };

        } catch (error) {
            console.error('❌ Error registering user phone:', error);
            return {
                success: false,
                reason: 'Database error during registration'
            };
        }
    }

    // Get user by Telegram ID
    async getUserByTelegramId(telegramId) {
        try {
            return await db.getUserPhone(telegramId);
        } catch (error) {
            console.error('❌ Error getting user by Telegram ID:', error);
            return null;
        }
    }

    // Get user by phone number
    async getUserByPhone(phoneNumber) {
        try {
            const normalizedPhone = PhoneRegistryService.normalizePhoneNumber(phoneNumber);
            return await db.getUserByPhone(normalizedPhone);
        } catch (error) {
            console.error('❌ Error getting user by phone:', error);
            return null;
        }
    }

    // Get all registered users for daily reports
    async getAllRegisteredUsers() {
        try {
            return await db.getAllUserPhones();
        } catch (error) {
            console.error('❌ Error getting all registered users:', error);
            return [];
        }
    }

    // Check if user is registered
    async isUserRegistered(telegramId) {
        try {
            const user = await this.getUserByTelegramId(telegramId);
            return user && user.is_registered;
        } catch (error) {
            console.error('❌ Error checking user registration:', error);
            return false;
        }
    }

    // Clear all user phone registrations
    async clearAllRegistrations() {
        try {
            console.log('🗑️ Clearing all user phone registrations...');
            
            // Get count before deletion
            const countBefore = await db.query('SELECT COUNT(*) as count FROM user_phones');
            const beforeCount = countBefore[0]?.count || 0;
            
            // Delete all records
            await db.query('DELETE FROM user_phones');
            
            console.log(`🗑️ Cleared ${beforeCount} phone registrations`);
            
            return {
                success: true,
                clearedCount: beforeCount
            };
            
        } catch (error) {
            console.error('❌ Error clearing registrations:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Clear specific user registration
    async clearUserRegistration(telegramId) {
        try {
            console.log(`🗑️ Clearing registration for user ${telegramId}...`);
            
            const result = await db.query('DELETE FROM user_phones WHERE telegram_id = ?', [telegramId]);
            
            console.log(`🗑️ Cleared registration for user ${telegramId}`);
            
            return {
                success: true,
                clearedCount: result.affectedRows || 0
            };
            
        } catch (error) {
            console.error('❌ Error clearing user registration:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new UserRegistryService();