const { google } = require('googleapis');
const path = require('path');

const SHEET_ID = '1Qogaq381KUC0iLUXEpfeurgSgCdq-rd04cHlhKn3Ejs';
const DIRECTORY_SHEET_NAME = '📚 Справочники';
const REPORT_SHEET_NAME = 'ТГ бот (не трогать)';

class PhoneRegistryService {
    constructor() {
        let auth;
        
        if (process.env.GOOGLE_SERVICE_ACCOUNT) {
            console.log('Using Google credentials from environment variable');
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
            auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else {
            console.log('Using Google credentials from local file');
            const credentialsPath = path.join(__dirname, '../../bps-user-data-bot-dc3f9a88a80d.json');
            auth = new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        }
        
        this.auth = auth;
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }

    // Get all phone numbers from 📚 Справочники sheet, column V
    async getAllRegisteredPhones() {
        try {
            console.log('📚 Reading phone numbers from directory sheet...');
            
            // Read column V from row 2 onwards
            const range = `${DIRECTORY_SHEET_NAME}!V2:V`;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: range
            });

            const rows = response.data.values || [];
            const phoneNumbers = [];
            let emptyCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const cellValue = rows[i] && rows[i][0] ? rows[i][0].toString().trim() : '';
                
                if (!cellValue) {
                    emptyCount++;
                    // Stop if we find 4 consecutive empty cells
                    if (emptyCount >= 4) {
                        console.log(`📚 Stopped reading at row ${i + 2} after 4 empty cells`);
                        break;
                    }
                } else {
                    emptyCount = 0; // Reset counter if we find a value
                    // Clean and normalize phone number
                    const cleanPhone = this.normalizePhoneNumber(cellValue);
                    if (cleanPhone) {
                        phoneNumbers.push({
                            originalValue: cellValue,
                            normalized: cleanPhone,
                            row: i + 2
                        });
                    }
                }
            }

            console.log(`📚 Found ${phoneNumbers.length} phone numbers in directory`);
            return phoneNumbers;
            
        } catch (error) {
            console.error('❌ Error reading phone directory:', error);
            return [];
        }
    }

    // Normalize phone number format
    normalizePhoneNumber(phoneStr) {
        if (!phoneStr) return null;
        
        // Remove all non-digits
        const digits = phoneStr.toString().replace(/\D/g, '');
        
        // Handle different formats
        if (digits.length >= 9) {
            // If starts with country code, keep as is
            if (digits.startsWith('998')) {
                return digits;
            }
            // If starts with 8, replace with 998
            else if (digits.startsWith('8') && digits.length >= 10) {
                return '998' + digits.substring(1);
            }
            // If it's just the local number, add 998
            else if (digits.length === 9) {
                return '998' + digits;
            }
            // If it's 12 digits starting with +998
            else if (digits.length === 12 && digits.startsWith('998')) {
                return digits;
            }
        }
        
        return digits.length >= 9 ? digits : null;
    }

    // Check if phone number is in registry and get today's report data
    async checkPhoneAndGetTodaysReport(phoneNumber) {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
            if (!normalizedPhone) {
                return { registered: false, reason: 'Invalid phone format' };
            }

            // Get all registered phones
            const registeredPhones = await this.getAllRegisteredPhones();
            
            // Check if this phone is registered
            const phoneEntry = registeredPhones.find(entry => 
                entry.normalized === normalizedPhone ||
                entry.originalValue === phoneNumber ||
                entry.originalValue === normalizedPhone
            );

            if (!phoneEntry) {
                return { 
                    registered: false, 
                    reason: 'Phone number not found in registry',
                    normalizedPhone: normalizedPhone
                };
            }

            // Get today's date in the format used by the sheet
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

            // Get today's report data
            const reportData = await this.getTodaysReportData(normalizedPhone, todayStr);

            return {
                registered: true,
                phoneEntry: phoneEntry,
                reportData: reportData,
                normalizedPhone: normalizedPhone
            };

        } catch (error) {
            console.error('❌ Error checking phone registry:', error);
            return { registered: false, reason: 'System error' };
        }
    }

    // Get today's report data for a specific phone
    async getTodaysReportData(phoneNumber, dateStr) {
        try {
            // Write phone in B1, dates in C2 and D2
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${REPORT_SHEET_NAME}!B1`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        [phoneNumber] // Phone in B1
                    ]
                }
            });

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${REPORT_SHEET_NAME}!C2:D2`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        [dateStr, dateStr] // Dates in C2 and D2
                    ]
                }
            });

            // Wait for formulas to calculate
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Read the calculated results
            const reportResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: `${REPORT_SHEET_NAME}!A1:Z20`
            });

            const rows = reportResponse.data.values || [];
            const reportData = {
                phoneNumber: phoneNumber,
                date: dateStr,
                calculatedData: {},
                rawData: rows
            };

            // Extract calculated data
            for (let i = 4; i < rows.length && i < 20; i++) {
                const row = rows[i];
                if (row && row.length > 0) {
                    const key = row[0] || `Row ${i + 1}`;
                    const values = row.slice(1).filter(cell => cell !== undefined && cell !== '');
                    if (values.length > 0) {
                        reportData.calculatedData[key] = values;
                    }
                }
            }

            return reportData;

        } catch (error) {
            console.error('❌ Error getting today\'s report:', error);
            return null;
        }
    }

    // Clean up after generating report (B1, C2, D2)
    async cleanupReportData() {
        try {
            // Clear B1
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${REPORT_SHEET_NAME}!B1`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        [''] // Clear B1
                    ]
                }
            });

            // Clear C2:D2
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${REPORT_SHEET_NAME}!C2:D2`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        ['', ''] // Clear C2, D2
                    ]
                }
            });
        } catch (error) {
            console.error('❌ Error cleaning up report data:', error);
        }
    }
}

module.exports = new PhoneRegistryService();