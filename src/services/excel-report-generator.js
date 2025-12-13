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
        
        // Create Excel file directly from the correct sheet data
        try {
            await this.setupAuth();
            const sheetsClient = await GoogleAuthService.getSheetsClient();
            await this.createExcelFromSheetsData(sheetsClient, SHEET_ID, filePath);
            
            console.log(`✅ Successfully created Excel file`);
            console.log(`📁 File: ${filePath}`);
            console.log(`👤 Client: ${clientName || 'Unknown'}`);
            console.log(`📱 Phone: ${phoneNumber}`);
            
            return filePath;
            
        } catch (error) {
            console.error('❌ Failed to create Excel file:', error.message);
            throw new Error(`Failed to create Excel file: ${error.message}`);
        }
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

    async createExcelFromSheetsData(sheetsClient, sheetId, filePath) {
        try {
            console.log('📊 Reading sheet data directly using working API...');
            
            // Get sheet metadata to find all worksheets
            const sheetMetadata = await sheetsClient.spreadsheets.get({
                spreadsheetId: sheetId
            });
            
            console.log('📄 Sheet name:', sheetMetadata.data.properties.title);
            console.log('📄 Found', sheetMetadata.data.sheets.length, 'worksheets');
            
            // Find the correct worksheet "ТГ бот (не трогать)"
            let targetSheet = null;
            for (const sheet of sheetMetadata.data.sheets) {
                const sheetName = sheet.properties.title;
                console.log('📄 Found worksheet:', sheetName);
                if (sheetName === 'ТГ бот (не трогать)') {
                    targetSheet = sheet;
                    break;
                }
            }
            
            if (!targetSheet) {
                throw new Error('Could not find worksheet "ТГ бот (не трогать)"');
            }
            
            const sheetName = targetSheet.properties.title;
            console.log('📊 Reading data from correct worksheet:', sheetName);
            
            // Read all data from the correct sheet
            const response = await sheetsClient.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: sheetName // This gets all data from the correct sheet
            });
            
            const rows = response.data.values;
            console.log('📊 Retrieved', rows?.length || 0, 'rows of data');
            
            if (!rows || rows.length === 0) {
                throw new Error('No data found in sheet');
            }
            
            // Create Excel file using the XLSX library
            const XLSX = require('xlsx');
            
            // Convert the data to a worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            
            // Create a new workbook and add the worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            
            // Write the Excel file
            XLSX.writeFile(workbook, filePath);
            
            console.log('✅ Successfully created Excel file from correct worksheet data');
            return;
            
        } catch (error) {
            console.error('❌ Failed to create Excel from Sheets API:', error.message);
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