const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
const GoogleAuthService = require('./google-auth');

class ExcelReportService {
    constructor() {
        this.auth = null;
    }

    async setupAuth() {
        if (this.auth) return; // Already set up
        
        try {
            console.log('🔐 Setting up unified Google authentication for Excel export');
            this.auth = await GoogleAuthService.initialize();
            console.log('✅ Excel export authentication ready');
        } catch (error) {
            console.error('❌ Error setting up Google auth for Excel export:', error);
            this.auth = null;
        }
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz', clientName = null) {
        // Setup auth
        await this.setupAuth();
        
        if (!this.auth) {
            throw new Error('Google Sheets authentication failed - cannot download original file');
        }
        
        console.log('📊 Downloading original Google Sheets file with all formatting...');
        
        const clientFileName = clientName ? `_${clientName.replace(/[^a-zA-Z0-9а-яё]/gi, '_')}` : '';
        const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}${clientFileName}_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../temp', fileName);
        
        // Ensure temp directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Google Sheets ID from phone-registry.js
        const SHEET_ID = '1Qogaq381KUC0iLUXEpfeurgSgCdq-rd04cHlhKn3Ejs';
        
        // Get access token
        const accessToken = await this.getAccessToken();
        
        // Download the actual Excel file from Google Sheets with formatting
        const exportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx&gid=0`;
        
        console.log('📥 Downloading original Google Sheets file...');
        console.log('🔗 Export URL:', exportUrl);
        
        await this.downloadFile(exportUrl, filePath, accessToken);
        
        console.log(`✅ Original Google Sheets file downloaded: ${filePath}`);
        console.log(`👤 Client: ${clientName || 'Unknown'}`);
        console.log(`📱 Phone: ${phoneNumber}`);
        console.log(`📅 Date range: ${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`);
        
        return filePath;
    }

    async getAccessToken() {
        console.log('🔑 Getting access token for Google Sheets download...');
        const token = await GoogleAuthService.getAccessToken();
        console.log('✅ Access token retrieved successfully');
        return token;
    }

    async downloadFile(url, filePath, accessToken) {
        return new Promise((resolve, reject) => {
            console.log('⬇️ Starting file download...');
            
            const protocol = url.startsWith('https:') ? https : http;
            
            const options = {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'BPS-TelegramBot/1.0'
                }
            };

            console.log('📡 Making HTTP request to Google Sheets...');
            
            const request = protocol.get(url, options, (response) => {
                console.log(`📊 Response status: ${response.statusCode}`);
                
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Handle redirects
                    console.log('🔄 Following redirect');
                    return this.downloadFile(response.headers.location, filePath, accessToken)
                        .then(resolve)
                        .catch(reject);
                }
                
                if (response.statusCode !== 200) {
                    console.error(`❌ Download failed: ${response.statusCode}`);
                    reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
                    return;
                }

                console.log('✅ Starting download...');
                const fileStream = require('fs').createWriteStream(filePath);
                
                let downloadedBytes = 0;
                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                });
                
                response.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✅ Downloaded ${downloadedBytes} bytes`);
                    resolve();
                });
                
                fileStream.on('error', (err) => {
                    console.error('❌ File error:', err.message);
                    require('fs').unlink(filePath, () => {}); // Clean up on error
                    reject(err);
                });
            });

            request.on('error', (err) => {
                console.error('❌ Request error:', err);
                reject(err);
            });
            
            request.setTimeout(30000, () => {
                console.error('❌ Request timeout after 30 seconds');
                request.destroy();
                reject(new Error('Download request timeout'));
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
            console.log(`🧹 Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            console.error('❌ Error cleaning up file:', error);
        }
    }
}

module.exports = new ExcelReportService();