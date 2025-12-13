const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
const XLSX = require('xlsx');
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
            console.log('📝 Will fallback to beautiful Excel generation instead');
            this.auth = null;
        }
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz', clientName = null) {
        try {
            // Setup auth only when needed
            await this.setupAuth();
            
            if (!this.auth) {
                console.log('⚠️ Google Sheets export not available, generating beautiful Excel report');
                return this.generateBeautifulExcel(reportData, phoneNumber, fromDate, toDate, clientName);
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
            console.log('🔗 Export URL:', exportUrl);
            console.log('🔑 Using access token length:', accessToken.length);
            
            await this.downloadFile(exportUrl, filePath, accessToken);
            
            console.log(`✅ Google Sheets Excel file downloaded: ${filePath}`);
            console.log(`👤 Client: ${clientName || 'Unknown'}`);
            console.log(`📱 Phone: ${phoneNumber}`);
            console.log(`📅 Date range: ${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`);
            
            return filePath;
            
        } catch (downloadError) {
            console.error('❌ Error downloading Google Sheets file:', downloadError);
            console.log('🔄 Falling back to beautiful Excel report...');
            return this.generateBeautifulExcel(reportData, phoneNumber, fromDate, toDate, clientName);
        }
        
    } catch (error) {
        console.error('❌ Error in Excel report generation:', error);
        return this.generateTextFallback(reportData, phoneNumber, fromDate, toDate, clientName);
    }

    async getAccessToken() {
        try {
            console.log('🔑 Getting access token for Google Sheets download...');
            const token = await GoogleAuthService.getAccessToken();
            console.log('✅ Access token retrieved successfully');
            return token;
        } catch (error) {
            console.error('❌ Error getting access token:', error);
            throw error;
        }
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
                console.log(`📊 Response status: ${response.statusCode} ${response.statusMessage}`);
                console.log('📋 Response headers:', JSON.stringify(response.headers, null, 2));
                
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Handle redirects
                    console.log('🔄 Following redirect to:', response.headers.location);
                    return this.downloadFile(response.headers.location, filePath, accessToken)
                        .then(resolve)
                        .catch(reject);
                }
                
                if (response.statusCode !== 200) {
                    console.error(`❌ Download failed with status ${response.statusCode}`);
                    console.error('📋 Response headers:', response.headers);
                    
                    // Try to read error response body
                    let errorBody = '';
                    response.on('data', chunk => errorBody += chunk);
                    response.on('end', () => {
                        console.error('❌ Error response body:', errorBody);
                        reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}\nResponse: ${errorBody}`));
                    });
                    return;
                }

                console.log('✅ Starting file write stream...');
                const fileStream = require('fs').createWriteStream(filePath);
                
                let downloadedBytes = 0;
                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (downloadedBytes % 10240 === 0) { // Log every 10KB
                        console.log(`⬇️ Downloaded ${downloadedBytes} bytes...`);
                    }
                });
                
                response.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✅ Download completed! Total bytes: ${downloadedBytes}`);
                    resolve();
                });
                
                fileStream.on('error', (err) => {
                    console.error('❌ File stream error:', err);
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

    async generateTextFallback(reportData, phoneNumber, fromDate, toDate, clientName) {
        console.log('📝 Generating beautiful text report...');
        
        const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}_text_${Date.now()}.txt`;
        const filePath = path.join(__dirname, '../temp', fileName);
        
        // Ensure temp directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        const currentDate = new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let report = '';
        
        // Beautiful header with company branding
        report += `\n`;
        report += `██████████████████████████████████████████████████████████████\n`;
        report += `██                                                          ██\n`;
        report += `██                    🏢 BPS PRINT SERVICE                  ██\n`;
        report += `██                     📊 HISOBOT TIZIMI                    ██\n`;
        report += `██                                                          ██\n`;
        report += `██████████████████████████████████████████████████████████████\n`;
        report += `\n`;
        
        // Client and report information section
        report += `┌─────────────────────────────────────────────────────────────┐\n`;
        report += `│                    📋 HISOBOT MA'LUMOTLARI                  │\n`;
        report += `├─────────────────────────────────────────────────────────────┤\n`;
        if (clientName) {
            report += `│ 👤 Mijoz nomi      : ${this.padString(clientName, 35)} │\n`;
        }
        report += `│ 📱 Telefon raqami  : ${this.padString(phoneNumber, 35)} │\n`;
        report += `│ 📅 Hisobot davri   : ${this.padString(`${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`, 35)} │\n`;
        report += `│ 🕒 Yaratilgan vaqt : ${this.padString(currentDate, 35)} │\n`;
        report += `└─────────────────────────────────────────────────────────────┘\n`;
        report += `\n`;
        
        // Data section with beautiful formatting
        if (reportData && reportData.rawData && reportData.rawData.length > 0) {
            report += `┌─────────────────────────────────────────────────────────────┐\n`;
            report += `│                      📊 MA'LUMOTLAR                         │\n`;
            report += `├─────────────────────────────────────────────────────────────┤\n`;
            
            // Process and format the data rows
            reportData.rawData.forEach((row, index) => {
                if (row && row.length > 0) {
                    const rowData = row.filter(cell => cell && cell.toString().trim() !== '').join(' | ');
                    if (rowData.trim()) {
                        const lineNumber = (index + 1).toString().padStart(2, '0');
                        
                        // Split long lines if needed
                        if (rowData.length <= 53) {
                            report += `│ ${lineNumber}. ${this.padString(rowData, 53)} │\n`;
                        } else {
                            // Split long content across multiple lines
                            const chunks = this.splitStringIntoChunks(rowData, 50);
                            chunks.forEach((chunk, i) => {
                                if (i === 0) {
                                    report += `│ ${lineNumber}. ${this.padString(chunk, 53)} │\n`;
                                } else {
                                    report += `│     ${this.padString(chunk, 53)} │\n`;
                                }
                            });
                        }
                        
                        // Add separator between rows for readability
                        if (index < reportData.rawData.length - 1) {
                            report += `│     ${this.padString('─'.repeat(20), 53)} │\n`;
                        }
                    }
                }
            });
            
            report += `└─────────────────────────────────────────────────────────────┘\n`;
            
            // Summary section
            const totalRecords = reportData.rawData.filter(row => row && row.length > 0 && row.join('').trim()).length;
            report += `\n`;
            report += `┌─────────────────────────────────────────────────────────────┐\n`;
            report += `│                      📈 XULOSA                              │\n`;
            report += `├─────────────────────────────────────────────────────────────┤\n`;
            report += `│ 📊 Jami yozuvlar soni : ${this.padString(totalRecords.toString(), 31)} │\n`;
            report += `│ 📅 Hisobot davri      : ${this.padString(`${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`, 31)} │\n`;
            report += `│ ⏰ Yaratilgan         : ${this.padString(currentDate, 31)} │\n`;
            report += `└─────────────────────────────────────────────────────────────┘\n`;
            
        } else {
            report += `┌─────────────────────────────────────────────────────────────┐\n`;
            report += `│                      ⚠️  OGOHLANTIRISH                     │\n`;
            report += `├─────────────────────────────────────────────────────────────┤\n`;
            report += `│                                                             │\n`;
            report += `│           ❌ Belgilangan muddat uchun ma'lumot              │\n`;
            report += `│                      topilmadi                              │\n`;
            report += `│                                                             │\n`;
            report += `│  💡 Iltimos, boshqa sana oralig'ini tanlang yoki            │\n`;
            report += `│     administrator bilan bog'laning                          │\n`;
            report += `│                                                             │\n`;
            report += `└─────────────────────────────────────────────────────────────┘\n`;
        }
        
        // Footer with contact information
        report += `\n`;
        report += `██████████████████████████████████████████████████████████████\n`;
        report += `██                                                          ██\n`;
        report += `██                   📞 BOG'LANISH UCHUN                    ██\n`;
        report += `██                                                          ██\n`;
        report += `██     📧 Email: euroasiaprint@gmail.com                   ██\n`;
        report += `██     📱 Telefon: +998 90 123 45 67                       ██\n`;
        report += `██     🌐 Web: www.bps-print.uz                            ██\n`;
        report += `██                                                          ██\n`;
        report += `██          🤖 Telegram Bot orqali tayyorlandi              ██\n`;
        report += `██                                                          ██\n`;
        report += `██████████████████████████████████████████████████████████████\n`;
        report += `\n`;
        report += `═══════════════════════════════════════════════════════════════\n`;
        report += `    Ushbu hisobot ${currentDate} sanasida avtomatik yaratildi\n`;
        report += `═══════════════════════════════════════════════════════════════\n`;
        
        await fs.writeFile(filePath, report, 'utf8');
        console.log(`✅ Beautiful text report generated: ${filePath}`);
        
        return filePath;
    }

    async generateBeautifulExcel(reportData, phoneNumber, fromDate, toDate, clientName) {
        console.log('✨ Generating beautiful Excel report...');
        
        const clientFileName = clientName ? `_${clientName.replace(/[^a-zA-Z0-9а-яё]/gi, '_')}` : '';
        const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}${clientFileName}_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../temp', fileName);
        
        // Ensure temp directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        const currentDate = new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        
        // Prepare data arrays for Excel
        const reportSheet = [];
        
        // Header section with company branding
        reportSheet.push([]);
        reportSheet.push(['', '', '', '🏢 BPS PRINT SERVICE', '', '']);
        reportSheet.push(['', '', '', '📊 HISOBOT TIZIMI', '', '']);
        reportSheet.push([]);
        
        // Report information section
        reportSheet.push(['', '📋 HISOBOT MA\'LUMOTLARI', '', '', '', '']);
        reportSheet.push([]);
        
        if (clientName) {
            reportSheet.push(['', '👤 Mijoz nomi:', clientName, '', '', '']);
        }
        reportSheet.push(['', '📱 Telefon raqami:', phoneNumber, '', '', '']);
        reportSheet.push(['', '📅 Hisobot davri:', `${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`, '', '', '']);
        reportSheet.push(['', '🕒 Yaratilgan vaqt:', currentDate, '', '', '']);
        reportSheet.push([]);
        
        // Data section
        if (reportData && reportData.rawData && reportData.rawData.length > 0) {
            reportSheet.push(['', '📊 MA\'LUMOTLAR', '', '', '', '']);
            reportSheet.push([]);
            
            // Add table headers
            const maxColumns = Math.max(...reportData.rawData.map(row => row ? row.length : 0));
            const headers = ['№'];
            for (let i = 0; i < maxColumns; i++) {
                headers.push(`Ma'lumot ${i + 1}`);
            }
            reportSheet.push(['', ...headers]);
            
            // Add data rows
            reportData.rawData.forEach((row, index) => {
                if (row && row.length > 0 && row.join('').trim()) {
                    const rowData = [`${index + 1}`];
                    for (let i = 0; i < maxColumns; i++) {
                        rowData.push(row[i] || '');
                    }
                    reportSheet.push(['', ...rowData]);
                }
            });
            
            reportSheet.push([]);
            
            // Summary section
            const totalRecords = reportData.rawData.filter(row => row && row.length > 0 && row.join('').trim()).length;
            reportSheet.push(['', '📈 XULOSA', '', '', '', '']);
            reportSheet.push([]);
            reportSheet.push(['', '📊 Jami yozuvlar soni:', totalRecords, '', '', '']);
            reportSheet.push(['', '📅 Hisobot davri:', `${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`, '', '', '']);
            reportSheet.push(['', '⏰ Yaratilgan:', currentDate, '', '', '']);
            
        } else {
            reportSheet.push(['', '⚠️ OGOHLANTIRISH', '', '', '', '']);
            reportSheet.push([]);
            reportSheet.push(['', '❌ Belgilangan muddat uchun ma\'lumot topilmadi', '', '', '', '']);
            reportSheet.push(['', '💡 Iltimos, boshqa sana oralig\'ini tanlang', '', '', '', '']);
            reportSheet.push(['', 'yoki administrator bilan bog\'laning', '', '', '', '']);
        }
        
        reportSheet.push([]);
        
        // Footer section
        reportSheet.push(['', '📞 BOG\'LANISH UCHUN', '', '', '', '']);
        reportSheet.push([]);
        reportSheet.push(['', '📧 Email:', 'euroasiaprint@gmail.com', '', '', '']);
        reportSheet.push(['', '📱 Telefon:', '+998 90 123 45 67', '', '', '']);
        reportSheet.push(['', '🌐 Web:', 'www.bps-print.uz', '', '', '']);
        reportSheet.push([]);
        reportSheet.push(['', '🤖 Telegram Bot orqali tayyorlandi', '', '', '', '']);
        
        // Create worksheet from data
        const worksheet = XLSX.utils.aoa_to_sheet(reportSheet);
        
        // Set column widths for better formatting
        const columnWidths = [
            { wch: 2 },   // Empty column for spacing
            { wch: 25 },  // Labels
            { wch: 30 },  // Values
            { wch: 20 },  // Extra data
            { wch: 20 },  // Extra data
            { wch: 15 }   // Extra data
        ];
        worksheet['!cols'] = columnWidths;
        
        // Apply basic styling by setting cell formats
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Style header rows
        for (let R = 1; R <= 3; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cellAddress]) continue;
                
                // Make header text bold and centered (basic Excel formatting)
                if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
                worksheet[cellAddress].s.font = { bold: true };
                worksheet[cellAddress].s.alignment = { horizontal: 'center' };
            }
        }
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Hisobot');
        
        // Write the Excel file
        XLSX.writeFile(workbook, filePath);
        
        console.log(`✅ Beautiful Excel report generated: ${filePath}`);
        console.log(`👤 Client: ${clientName || 'Unknown'}`);
        console.log(`📱 Phone: ${phoneNumber}`);
        console.log(`📅 Date range: ${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`);
        
        return filePath;
    }
    
    // Helper function to pad strings for alignment
    padString(str, length) {
        if (!str) str = '';
        str = str.toString();
        if (str.length >= length) {
            return str.substring(0, length);
        }
        return str + ' '.repeat(length - str.length);
    }
    
    // Helper function to split long strings into chunks
    splitStringIntoChunks(str, maxLength) {
        const chunks = [];
        let currentChunk = '';
        const words = str.split(' ');
        
        for (const word of words) {
            if ((currentChunk + word).length <= maxLength) {
                currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = word;
                } else {
                    // Word is longer than maxLength, split it
                    chunks.push(word.substring(0, maxLength));
                    currentChunk = word.substring(maxLength);
                }
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
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