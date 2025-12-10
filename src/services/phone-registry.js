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

    // Get all phone numbers from 📚 Справочники sheet, column R with names from Q
    async getAllRegisteredPhones() {
        try {
            console.log('📚 Starting to read phone numbers from directory sheet...');
            console.log(`📚 Sheet ID: ${SHEET_ID}`);
            console.log(`📚 Sheet Name: "${DIRECTORY_SHEET_NAME}"`);
            console.log(`📚 Range: "${DIRECTORY_SHEET_NAME}!Q2:R"`);
            
            // Read columns Q (names) and R (phones) from row 2 onwards
            const range = `${DIRECTORY_SHEET_NAME}!Q2:R`;
            
            console.log('📚 Making Google Sheets API call...');
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: range
            });

            console.log('📚 Google Sheets API response received');
            console.log(`📚 Response status: ${response.status}`);
            console.log(`📚 Response data:`, JSON.stringify(response.data, null, 2));

            const rows = response.data.values || [];
            console.log(`📚 Raw rows from sheet: ${rows.length} rows`);
            
            if (rows.length === 0) {
                console.log('❌ No rows returned from Google Sheets!');
                console.log('📚 This could mean:');
                console.log('  1. The sheet name "📚 Справочники" doesn\'t exist');
                console.log('  2. Columns Q and R are empty');
                console.log('  3. There\'s a permissions issue');
                console.log('  4. The range Q2:R doesn\'t contain data');
                return [];
            }
            const phoneNumbers = [];
            let emptyCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i] || [];
                const clientName = row[0] ? row[0].toString().trim() : ''; // Column Q
                const phoneValue = row[1] ? row[1].toString().trim() : ''; // Column R
                
                if (!phoneValue) {
                    emptyCount++;
                    // Stop if we find 4 consecutive empty phone cells
                    if (emptyCount >= 4) {
                        console.log(`📚 Stopped reading at row ${i + 2} after 4 empty phone cells`);
                        break;
                    }
                } else {
                    emptyCount = 0; // Reset counter if we find a phone value
                    // Clean and normalize phone number
                    const cleanPhone = this.normalizePhoneNumber(phoneValue);
                    if (cleanPhone) {
                        phoneNumbers.push({
                            clientName: clientName || 'Unknown',
                            originalValue: phoneValue,
                            normalized: cleanPhone,
                            row: i + 2
                        });
                        console.log(`📚 Row ${i + 2}: "${clientName}" -> ${phoneValue} -> ${cleanPhone}`);
                    }
                }
            }

            console.log(`📚 Found ${phoneNumbers.length} phone numbers in directory`);
            console.log('📚 All phone numbers in registry:');
            phoneNumbers.forEach((entry, index) => {
                console.log(`  ${index + 1}. "${entry.clientName}" -> ${entry.originalValue} -> ${entry.normalized}`);
            });
            return phoneNumbers;
            
        } catch (error) {
            console.error('❌ Error reading phone directory:', error);
            console.error('❌ Error details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                stack: error.stack
            });
            
            if (error.message?.includes('Unable to parse range')) {
                console.error('❌ Range parsing error - check sheet name and column references');
            }
            if (error.message?.includes('not found')) {
                console.error('❌ Sheet or range not found - check if "📚 Справочники" sheet exists');
            }
            if (error.message?.includes('permission')) {
                console.error('❌ Permission error - check Google Sheets API access');
            }
            
            return [];
        }
    }

    // Normalize phone number format - very aggressive normalization
    normalizePhoneNumber(phoneStr) {
        if (!phoneStr) return null;
        
        // Convert to string and remove ALL non-digits (including +, -, spaces, etc.)
        const digits = phoneStr.toString().replace(/\D/g, '');
        
        console.log(`📞 Normalizing phone: "${phoneStr}" -> digits: "${digits}"`);
        
        // Handle different formats
        if (digits.length >= 9) {
            let normalized;
            
            // If starts with country code 998, keep as is (but limit to 12 digits)
            if (digits.startsWith('998')) {
                normalized = digits.substring(0, 12); // Keep only 998 + 9 digits
                console.log(`📞 Country code format: ${normalized}`);
                return normalized;
            }
            // If starts with 8, replace with 998
            else if (digits.startsWith('8') && digits.length >= 10) {
                normalized = '998' + digits.substring(1, 10); // 998 + next 9 digits
                console.log(`📞 8-prefix format: ${normalized}`);
                return normalized;
            }
            // If it's just the local number (9 digits), add 998
            else if (digits.length === 9) {
                normalized = '998' + digits;
                console.log(`📞 Local format: ${normalized}`);
                return normalized;
            }
            // For any other format with 10+ digits, try to extract 9-digit local part
            else if (digits.length >= 10) {
                // Try to find a 9-digit sequence that looks like a valid UZ number
                const lastNineDigits = digits.substring(digits.length - 9);
                normalized = '998' + lastNineDigits;
                console.log(`📞 Extracted local: ${normalized}`);
                return normalized;
            }
        }
        
        console.log(`📞 Invalid phone format: "${phoneStr}" (${digits.length} digits)`);
        return digits.length >= 9 ? digits : null;
    }

    // Check if phone number is in registry and get today's report data
    async checkPhoneAndGetTodaysReport(phoneNumber) {
        try {
            console.log(`🔍 Checking phone registration for: "${phoneNumber}"`);
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
            if (!normalizedPhone) {
                console.log(`❌ Invalid phone format: "${phoneNumber}"`);
                return { registered: false, reason: 'Invalid phone format' };
            }

            console.log(`🔍 Normalized phone: "${normalizedPhone}"`);
            
            // Get all registered phones
            console.log(`📚 Loading phone registry...`);
            const registeredPhones = await this.getAllRegisteredPhones();
            console.log(`📚 Registry loaded with ${registeredPhones.length} entries`);
            
            if (registeredPhones.length === 0) {
                console.log(`❌ No phones found in registry!`);
                return { registered: false, reason: 'Registry is empty' };
            }
            
            // Check if this phone is registered - very thorough comparison
            const phoneEntry = registeredPhones.find(entry => {
                // Normalize the registry entry for comparison
                const entryNormalized = this.normalizePhoneNumber(entry.originalValue);
                
                console.log(`📞 Comparing: incoming="${normalizedPhone}" vs registry="${entryNormalized}" (original: "${entry.originalValue}", client: "${entry.clientName}")`);
                
                return (
                    entry.normalized === normalizedPhone ||
                    entryNormalized === normalizedPhone ||
                    entry.originalValue === phoneNumber ||
                    entry.originalValue === normalizedPhone ||
                    // Also check if the digits-only versions match
                    entry.originalValue.replace(/\D/g, '') === normalizedPhone ||
                    entry.normalized.replace(/\D/g, '') === normalizedPhone.replace(/\D/g, '')
                );
            });

            if (!phoneEntry) {
                console.log(`❌ Phone not found in registry: "${normalizedPhone}"`);
                console.log(`🔍 Comparison summary: Checked against ${registeredPhones.length} registry entries`);
                return { 
                    registered: false, 
                    reason: 'Phone number not found in registry',
                    normalizedPhone: normalizedPhone
                };
            }

            console.log(`✅ Phone found in registry! Client: "${phoneEntry.clientName}", Original: "${phoneEntry.originalValue}"`);
            
            if (phoneEntry.clientName) {
                console.log(`👤 Matched client: ${phoneEntry.clientName}`);
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