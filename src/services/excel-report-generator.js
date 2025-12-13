const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

class ExcelReportService {

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz', clientName = null) {
        try {
            console.log('📊 Generating Excel report from Google Sheets data...');
            
            const clientFileName = clientName ? `_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
            const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}${clientFileName}_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            // Ensure temp directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            
            // Use the raw data from Google Sheets directly
            let worksheetData = [];
            
            if (reportData && reportData.rawData && reportData.rawData.length > 0) {
                // Add header with client info if available
                const headerText = clientName ? 
                    `BPS Hisobot - ${clientName} (${phoneNumber})` : 
                    `BPS Hisobot - ${phoneNumber}`;
                    
                worksheetData.push([headerText]);
                worksheetData.push([`${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`]);
                worksheetData.push(['']); // Empty row for spacing
                
                // Add the raw data exactly as it comes from Google Sheets (entire sheet with formatting intact)
                reportData.rawData.forEach(row => {
                    // Keep the row exactly as-is from Google Sheets, don't filter anything
                    worksheetData.push(row || []);
                });
            } else {
                // No data available
                const headerText = clientName ? 
                    `BPS Hisobot - ${clientName} (${phoneNumber})` : 
                    `BPS Hisobot - ${phoneNumber}`;
                    
                worksheetData.push([headerText]);
                worksheetData.push([`${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`]);
                worksheetData.push(['']);
                worksheetData.push(['Ma\'lumot topilmadi']);
            }
            
            // Create worksheet from the data
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Set reasonable column widths to match Google Sheets
            const maxCols = Math.max(...worksheetData.map(row => row.length));
            const columnWidths = [];
            for (let i = 0; i < maxCols; i++) {
                columnWidths.push({ wch: 12 }); // Consistent width for all columns
            }
            worksheet['!cols'] = columnWidths;
            
            // Add worksheet to workbook with client name if available
            const sheetName = clientName ? `${clientName} - Hisobot` : 'Hisobot';
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Excel sheet name limit
            
            // Write file
            XLSX.writeFile(workbook, filePath);
            
            console.log(`✅ Excel report generated: ${filePath}`);
            console.log(`👤 Client: ${clientName || 'Unknown'}`);
            return filePath;
            
        } catch (error) {
            console.error('❌ Error generating Excel report:', error);
            throw error;
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