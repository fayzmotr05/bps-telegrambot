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
        console.log('📊 Starting Google Sheets download process...');
        
        const clientFileName = clientName ? `_${clientName.replace(/[^a-zA-Z0-9а-яё]/gi, '_')}` : '';
        const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}${clientFileName}_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../temp', fileName);
        
        // Ensure temp directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        const SHEET_ID = '1Qogaq381KUC0iLUXEpfeurgSgCdq-rd04cHlhKn3Ejs';
        
        // Try to ensure service account has access
        try {
            await this.ensureSheetAccess(SHEET_ID);
        } catch (error) {
            console.log('⚠️ Could not verify sheet access, proceeding anyway');
        }
        
        // Try multiple approaches professionally
        const approaches = [
            () => this.downloadWithAuth(SHEET_ID, filePath),
            () => this.downloadWithPublicAccess(SHEET_ID, filePath),
            () => this.downloadWithDirectAPI(SHEET_ID, filePath)
        ];
        
        let lastError = null;
        
        for (let i = 0; i < approaches.length; i++) {
            try {
                console.log(`📥 Attempt ${i + 1}: Trying download method ${i + 1}...`);
                await approaches[i]();
                
                console.log(`✅ Successfully downloaded using method ${i + 1}`);
                console.log(`📁 File: ${filePath}`);
                console.log(`👤 Client: ${clientName || 'Unknown'}`);
                console.log(`📱 Phone: ${phoneNumber}`);
                
                return filePath;
                
            } catch (error) {
                console.error(`❌ Method ${i + 1} failed:`, error.message);
                lastError = error;
                
                if (i < approaches.length - 1) {
                    console.log(`🔄 Trying next method...`);
                }
            }
        }
        
        // All methods failed
        console.error('❌ All download methods failed');
        throw new Error(`Failed to download Google Sheets file. Last error: ${lastError?.message}`);
    }

    // Method 1: Download with authentication (original approach)
    async downloadWithAuth(sheetId, filePath) {
        console.log('🔐 Method 1: Downloading with authentication');
        
        await this.setupAuth();
        if (!this.auth) {
            throw new Error('Authentication setup failed');
        }
        
        const accessToken = await GoogleAuthService.getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }
        
        // Try multiple export URLs
        const exportUrls = [
            `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=0`,
            `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`,
            `https://www.googleapis.com/drive/v3/files/${sheetId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        ];
        
        let lastError = null;
        for (const url of exportUrls) {
            try {
                console.log('📥 Trying export URL:', url.split('/').slice(-2).join('/'));
                await this.downloadFile(url, filePath, accessToken);
                return; // Success
            } catch (error) {
                console.log(`⚠️ URL failed: ${error.message}`);
                lastError = error;
            }
        }
        
        throw lastError || new Error('All export URLs failed');
    }
    
    // Method 2: Download with public access (if sheet is public)
    async downloadWithPublicAccess(sheetId, filePath) {
        console.log('🌐 Method 2: Attempting public access download');
        
        const publicExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=0`;
        await this.downloadFileWithoutAuth(publicExportUrl, filePath);
    }
    
    // Method 3: Download via Google Drive API
    async downloadWithDirectAPI(sheetId, filePath) {
        console.log('💾 Method 3: Using Direct Drive API');
        
        await this.setupAuth();
        if (!this.auth) {
            throw new Error('Authentication required for Drive API');
        }
        
        const driveUrl = `https://www.googleapis.com/drive/v3/files/${sheetId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
        const accessToken = await GoogleAuthService.getAccessToken();
        
        if (!accessToken) {
            throw new Error('Drive API requires access token');
        }
        
        await this.downloadFile(driveUrl, filePath, accessToken);
    }

    async getAccessToken() {
        console.log('🔑 Getting access token...');
        const token = await GoogleAuthService.getAccessToken();
        console.log('✅ Token retrieved, length:', token?.length || 0);
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

    // Download without authentication (for public sheets)
    async downloadFileWithoutAuth(url, filePath) {
        return new Promise((resolve, reject) => {
            console.log('🌐 Downloading without authentication...');
            
            const protocol = url.startsWith('https:') ? https : http;
            
            const request = protocol.get(url, (response) => {
                console.log(`📊 Response: ${response.statusCode}`);
                
                if (response.statusCode === 302 || response.statusCode === 301) {
                    console.log('🔄 Following redirect');
                    return this.downloadFileWithoutAuth(response.headers.location, filePath)
                        .then(resolve)
                        .catch(reject);
                }
                
                if (response.statusCode !== 200) {
                    reject(new Error(`Public access failed: ${response.statusCode}`));
                    return;
                }

                console.log('✅ Public download starting...');
                const fileStream = require('fs').createWriteStream(filePath);
                
                response.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log('✅ Public download completed');
                    resolve();
                });
                
                fileStream.on('error', (err) => {
                    require('fs').unlink(filePath, () => {});
                    reject(err);
                });
            });

            request.on('error', reject);
            request.setTimeout(30000, () => {
                request.destroy();
                reject(new Error('Public download timeout'));
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

    async ensureSheetAccess(sheetId) {
        try {
            await this.setupAuth();
            if (!this.auth) return;

            const driveClient = await GoogleAuthService.getDriveClient();
            
            // Try to get file info to check if we have access
            const fileInfo = await driveClient.files.get({
                fileId: sheetId,
                fields: 'id,name,permissions'
            });
            
            console.log('📄 Sheet access verified:', fileInfo.data.name);
            return true;
            
        } catch (error) {
            console.log('⚠️ Sheet access check failed:', error.message);
            
            // Try to add service account as viewer
            if (error.code === 403 || error.message?.includes('permission')) {
                console.log('🔑 Attempting to grant access to service account...');
                // This would require owner permissions to work
            }
            
            throw error;
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