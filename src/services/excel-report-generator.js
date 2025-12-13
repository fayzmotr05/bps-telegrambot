const path = require('path');
const fs = require('fs').promises;
const { google } = require('googleapis');
const https = require('https');
const http = require('http');

class ExcelReportService {
    constructor() {
        // Initialize Google Sheets API auth (same as phone-registry.js)
        this.setupAuth();
    }

    setupAuth() {
        if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
            console.log('📊 Using Google credentials from environment variables for Excel export');
            this.auth = new google.auth.JWT(
                process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                null,
                process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
            );
        } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
            console.log('📊 Using Google credentials from GOOGLE_SERVICE_ACCOUNT environment variable for Excel export');
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
            });
        } else {
            console.log('❌ No Google credentials found for Excel export');
            this.auth = null;
        }
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz', clientName = null) {
        try {
            console.log('📊 Downloading actual Google Sheets file with formatting...');
            
            const clientFileName = clientName ? `_${clientName.replace(/[^a-zA-Z0-9а-яё]/gi, '_')}` : '';
            const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}${clientFileName}_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            // Ensure temp directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // Google Sheets ID from phone-registry.js
            const SHEET_ID = '1Qogaq381KUC0iLUXEpfeurgSgCdq-rd04cHlhKn3Ejs';
            const REPORT_SHEET_NAME = 'ТГ бот (не трогать)';
            
            if (!this.auth) {
                throw new Error('Google Sheets authentication not configured');
            }

            // Get access token
            const accessToken = await this.getAccessToken();
            
            // Download the actual Excel file from Google Sheets with formatting
            // Use the export URL to get the sheet with all formatting intact
            const exportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx&gid=0`;
            
            console.log('📥 Downloading formatted Excel file from Google Sheets...');
            await this.downloadFile(exportUrl, filePath, accessToken);
            
            console.log(`✅ Google Sheets Excel file downloaded: ${filePath}`);
            console.log(`👤 Client: ${clientName || 'Unknown'}`);
            console.log(`📱 Phone: ${phoneNumber}`);
            console.log(`📅 Date range: ${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`);
            
            return filePath;
            
        } catch (error) {
            console.error('❌ Error downloading Google Sheets file:', error);
            throw error;
        }
    }

    async getAccessToken() {
        try {
            if (this.auth.getAccessToken) {
                const tokenResponse = await this.auth.getAccessToken();
                return tokenResponse.token;
            } else if (this.auth.request) {
                // JWT auth
                const headers = await this.auth.getRequestHeaders();
                return headers.authorization.replace('Bearer ', '');
            }
            throw new Error('Unable to get access token');
        } catch (error) {
            console.error('❌ Error getting access token:', error);
            throw error;
        }
    }

    async downloadFile(url, filePath, accessToken) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;
            
            const options = {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'BPS-TelegramBot/1.0'
                }
            };

            const request = protocol.get(url, options, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
                    return;
                }

                const fileStream = require('fs').createWriteStream(filePath);
                
                response.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
                
                fileStream.on('error', (err) => {
                    require('fs').unlink(filePath, () => {}); // Clean up on error
                    reject(err);
                });
            });

            request.on('error', (err) => {
                reject(err);
            });
        });
    }



    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    async cleanup(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`🧹 Cleaned up temporary Excel file: ${filePath}`);
        } catch (error) {
            console.error('❌ Error cleaning up Excel file:', error);
        }
    }
}

module.exports = new ExcelReportService();