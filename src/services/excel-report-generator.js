const path = require('path');
const fs = require('fs').promises;
const { google } = require('googleapis');
const https = require('https');
const http = require('http');

class ExcelReportService {
    constructor() {
        this.auth = null;
    }

    setupAuth() {
        if (this.auth) return; // Already set up
        
        try {
            if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
                console.log('📊 Setting up Google credentials for Excel export');
                this.auth = new google.auth.JWT(
                    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    null,
                    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
                );
            } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
                console.log('📊 Setting up Google credentials from GOOGLE_SERVICE_ACCOUNT');
                const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
                this.auth = new google.auth.GoogleAuth({
                    credentials: credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly']
                });
            } else {
                console.log('⚠️ No Google credentials found for Excel export - will fallback to text report');
                this.auth = null;
            }
        } catch (error) {
            console.error('❌ Error setting up Google auth for Excel export:', error);
            this.auth = null;
        }
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz', clientName = null) {
        try {
            // Setup auth only when needed
            this.setupAuth();
            
            if (!this.auth) {
                console.log('⚠️ Google Sheets export not available, falling back to text report');
                return this.generateTextFallback(reportData, phoneNumber, fromDate, toDate, clientName);
            }
            
            console.log('📊 Downloading actual Google Sheets file with formatting...');
            
            const clientFileName = clientName ? `_${clientName.replace(/[^a-zA-Z0-9а-яё]/gi, '_')}` : '';
            const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}${clientFileName}_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            // Ensure temp directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // Google Sheets ID from phone-registry.js
            const SHEET_ID = '1Qogaq381KUC0iLUXEpfeurgSgCdq-rd04cHlhKn3Ejs';
            const REPORT_SHEET_NAME = 'ТГ бот (не трогать)';
            
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
            
        } catch (downloadError) {
            console.error('❌ Error downloading Google Sheets file:', downloadError);
            console.log('🔄 Falling back to text report...');
            return this.generateTextFallback(reportData, phoneNumber, fromDate, toDate, clientName);
        }
        
        } catch (error) {
            console.error('❌ Error in Excel report generation:', error);
            return this.generateTextFallback(reportData, phoneNumber, fromDate, toDate, clientName);
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

    async generateTextFallback(reportData, phoneNumber, fromDate, toDate, clientName) {
        console.log('📝 Generating text fallback report...');
        
        const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}_text_${Date.now()}.txt`;
        const filePath = path.join(__dirname, '../temp', fileName);
        
        // Ensure temp directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        let report = '';
        report += `═══════════════════════════════════\n`;
        report += `📊 BPS Hisobot\n`;
        if (clientName) {
            report += `👤 ${clientName}\n`;
        }
        report += `📱 ${phoneNumber}\n`;
        report += `📅 ${this.formatDate(fromDate)} - ${this.formatDate(toDate)}\n`;
        report += `═══════════════════════════════════\n\n`;
        
        if (reportData && reportData.rawData && reportData.rawData.length > 0) {
            reportData.rawData.forEach((row, index) => {
                if (row && row.length > 0) {
                    report += `${index + 1}. ${row.join(' | ')}\n`;
                }
            });
        } else {
            report += `❌ Ma'lumot topilmadi\n`;
        }
        
        report += `\n═══════════════════════════════════\n`;
        report += `📧 euroasiaprint@gmail.com\n`;
        report += `📞 +998 90 123 45 67\n`;
        
        await fs.writeFile(filePath, report, 'utf8');
        console.log(`✅ Text fallback report generated: ${filePath}`);
        
        return filePath;
    }

    async cleanup(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`🧹 Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            console.error('❌ Error cleaning up file:', error);
        }
    }
}

module.exports = new ExcelReportService();