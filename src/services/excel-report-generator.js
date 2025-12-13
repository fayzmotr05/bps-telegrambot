const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

class ExcelReportService {

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz') {
        try {
            console.log('📊 Generating simple Excel report from Google Sheets data...');
            
            const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            // Ensure temp directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            
            // Use the raw data from Google Sheets directly
            let worksheetData = [];
            
            if (reportData && reportData.rawData && reportData.rawData.length > 0) {
                // Add a simple header with report info
                worksheetData.push([`BPS Hisobot - ${phoneNumber}`]);
                worksheetData.push([`${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`]);
                worksheetData.push(['']); // Empty row for spacing
                
                // Add the raw data exactly as it comes from Google Sheets
                reportData.rawData.forEach(row => {
                    // Clean up the row data (remove empty cells at the end)
                    const cleanRow = row.filter((cell, index) => {
                        // Keep non-empty cells or if there are more non-empty cells after this position
                        if (cell !== undefined && cell !== null && cell !== '') return true;
                        return row.slice(index + 1).some(laterCell => 
                            laterCell !== undefined && laterCell !== null && laterCell !== ''
                        );
                    });
                    
                    if (cleanRow.length > 0) {
                        worksheetData.push(cleanRow);
                    }
                });
            } else {
                // No data available
                worksheetData.push([`BPS Hisobot - ${phoneNumber}`]);
                worksheetData.push([`${this.formatDate(fromDate)} - ${this.formatDate(toDate)}`]);
                worksheetData.push(['']);
                worksheetData.push(['Ma\'lumot topilmadi']);
            }
            
            // Create worksheet from the data
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Set reasonable column widths
            const maxCols = Math.max(...worksheetData.map(row => row.length));
            const columnWidths = [];
            for (let i = 0; i < maxCols; i++) {
                columnWidths.push({ wch: 15 }); // Standard width for all columns
            }
            worksheet['!cols'] = columnWidths;
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Hisobot');
            
            // Write file
            XLSX.writeFile(workbook, filePath);
            
            console.log(`✅ Simple Excel report generated: ${filePath}`);
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