const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SHEET_ID = '1Qogaq381KUC0iLUXEpfeurgSgCdq-rd04cHlhKn3Ejs';
const SHEET_NAME = 'ТГ бот (не трогать)';

class SheetsService {
    constructor() {
        let auth;
        
        // Check if running in production with standard environment variables
        if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
            console.log('Using Google credentials from environment variables');
            auth = new google.auth.JWT(
                process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                null,
                process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                ['https://www.googleapis.com/auth/spreadsheets']
            );
        } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
            console.log('Using Google credentials from GOOGLE_SERVICE_ACCOUNT environment variable');
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
            auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else {
            // Use local file for development
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

    async updateCells(phoneNumber, fromDate, toDate) {
        try {
            // Update B1 with phone number
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${SHEET_NAME}!B1`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[phoneNumber]]
                }
            });

            // Update C2:D2 with dates
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${SHEET_NAME}!C2:D2`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[fromDate, toDate]]
                }
            });

            console.log(`Updated cells: B1=${phoneNumber}, C2=${fromDate}, D2=${toDate}`);
            return true;
        } catch (error) {
            console.error('Error updating Google Sheets:', error);
            throw error;
        }
    }

    async getReportData() {
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const range = `${SHEET_NAME}!A:Z`;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: range
            });

            const rows = response.data.values || [];
            
            if (rows.length === 0) {
                return null;
            }

            const reportData = {
                phoneNumber: rows[0]?.[1] || '',
                fromDate: rows[1]?.[2] || '',
                toDate: rows[1]?.[3] || '',
                calculatedData: {},
                rawData: rows
            };

            for (let i = 4; i < rows.length && i < 50; i++) {
                const row = rows[i];
                if (row && row.length > 0) {
                    const key = row[0] || `Row ${i + 1}`;
                    const values = row.slice(1).filter(cell => cell !== undefined && cell !== '');
                    if (values.length > 0) {
                        reportData.calculatedData[key] = values;
                    }
                }
            }

            console.log('Retrieved report data:', reportData);
            return reportData;
        } catch (error) {
            console.error('Error getting report data from Google Sheets:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: SHEET_ID
            });
            console.log('Google Sheets connection successful:', response.data.properties.title);
            return true;
        } catch (error) {
            console.error('Error testing Google Sheets connection:', error);
            return false;
        }
    }
}

module.exports = new SheetsService();