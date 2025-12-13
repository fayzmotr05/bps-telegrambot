const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

class ExcelReportService {
    constructor() {
        this.styles = {
            header: {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "2E86AB" } },
                alignment: { horizontal: "center", vertical: "center" }
            },
            companyHeader: {
                font: { bold: true, size: 16, color: { rgb: "2E86AB" } },
                alignment: { horizontal: "center", vertical: "center" }
            },
            infoLabel: {
                font: { bold: true, color: { rgb: "2C3E50" } },
                alignment: { horizontal: "right", vertical: "center" }
            },
            infoValue: {
                font: { color: { rgb: "34495E" } },
                alignment: { horizontal: "left", vertical: "center" }
            },
            dataHeader: {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "A23B72" } },
                alignment: { horizontal: "center", vertical: "center" }
            },
            dataRow: {
                font: { color: { rgb: "2C3E50" } },
                alignment: { horizontal: "left", vertical: "center" }
            },
            noData: {
                font: { italic: true, color: { rgb: "7F8C8D" } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        };
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz') {
        try {
            console.log('📊 Generating professional Excel report...');
            
            const labels = this.getLabels(language);
            const fileName = `hisobot_${phoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}.xlsx`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            // Ensure temp directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheetData = [];
            
            // Company header
            worksheetData.push(['']);
            worksheetData.push([`📊 ${labels.title} - BPS (EUROASIA PRINT)`]);
            worksheetData.push(['']);
            
            // Report information section
            worksheetData.push([labels.reportInfo || 'Hisobot Ma\'lumotlari', '']);
            worksheetData.push(['']);
            worksheetData.push([labels.phoneNumber + ':', phoneNumber]);
            worksheetData.push([labels.fromDate + ':', this.formatDate(fromDate)]);
            worksheetData.push([labels.toDate + ':', this.formatDate(toDate)]);
            worksheetData.push([labels.generatedAt + ':', this.formatDate(new Date().toISOString().split('T')[0])]);
            worksheetData.push(['']);
            
            // Data section header
            worksheetData.push([labels.reportData || 'Hisobot Ma\'lumotlari', '']);
            worksheetData.push(['']);
            
            if (reportData && reportData.calculatedData && Object.keys(reportData.calculatedData).length > 0) {
                // Table headers
                worksheetData.push([
                    labels.parameter || 'Parametr', 
                    labels.values || 'Qiymatlar'
                ]);
                
                // Data rows
                Object.entries(reportData.calculatedData).forEach(([key, values]) => {
                    const valueText = Array.isArray(values) ? values.join(', ') : String(values);
                    worksheetData.push([key, valueText]);
                });
            } else {
                worksheetData.push([labels.noDataAvailable || 'Ma\'lumot topilmadi', '']);
            }
            
            // Footer
            worksheetData.push(['']);
            worksheetData.push(['']);
            worksheetData.push([labels.footerText || 'Ushbu hisobot BPS (EUROASIA PRINT) tomonidan yaratilgan']);
            worksheetData.push(['📧 euroasiaprint@gmail.com | 📞 +998 90 123 45 67']);
            
            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Set column widths
            const columnWidths = [
                { wch: 25 }, // Column A - Parameters/Labels
                { wch: 40 }  // Column B - Values
            ];
            worksheet['!cols'] = columnWidths;
            
            // Apply styles and formatting
            this.applyWorksheetStyling(worksheet, worksheetData.length, labels, reportData);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, labels.title || 'Hisobot');
            
            // Write file
            XLSX.writeFile(workbook, filePath);
            
            console.log(`✅ Professional Excel report generated: ${filePath}`);
            return filePath;
            
        } catch (error) {
            console.error('❌ Error generating Excel report:', error);
            throw error;
        }
    }

    applyWorksheetStyling(worksheet, totalRows, labels, reportData) {
        // Company header styling (row 2)
        if (worksheet['A2']) {
            worksheet['A2'].s = this.styles.companyHeader;
        }
        
        // Info section styling (rows 6-9)
        for (let row = 6; row <= 9; row++) {
            if (worksheet[`A${row}`]) {
                worksheet[`A${row}`].s = this.styles.infoLabel;
            }
            if (worksheet[`B${row}`]) {
                worksheet[`B${row}`].s = this.styles.infoValue;
            }
        }
        
        // Data section header styling
        const dataHeaderRow = reportData && Object.keys(reportData.calculatedData || {}).length > 0 ? 13 : 12;
        if (worksheet[`A${dataHeaderRow}`] && worksheet[`B${dataHeaderRow}`]) {
            worksheet[`A${dataHeaderRow}`].s = this.styles.dataHeader;
            worksheet[`B${dataHeaderRow}`].s = this.styles.dataHeader;
        }
        
        // Data rows styling
        if (reportData && Object.keys(reportData.calculatedData || {}).length > 0) {
            const dataStartRow = dataHeaderRow + 1;
            const dataEndRow = dataStartRow + Object.keys(reportData.calculatedData).length - 1;
            
            for (let row = dataStartRow; row <= dataEndRow; row++) {
                if (worksheet[`A${row}`]) {
                    worksheet[`A${row}`].s = this.styles.dataRow;
                }
                if (worksheet[`B${row}`]) {
                    worksheet[`B${row}`].s = this.styles.dataRow;
                }
            }
        }
        
        // Merge cells for headers
        if (!worksheet['!merges']) worksheet['!merges'] = [];
        
        // Merge company header across columns
        worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } });
        
        // Merge report info header
        worksheet['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 1 } });
        
        // Merge data section header
        worksheet['!merges'].push({ s: { r: 10, c: 0 }, e: { r: 10, c: 1 } });
        
        // Merge footer rows
        const footerStart = totalRows - 2;
        worksheet['!merges'].push({ s: { r: footerStart, c: 0 }, e: { r: footerStart, c: 1 } });
        worksheet['!merges'].push({ s: { r: footerStart + 1, c: 0 }, e: { r: footerStart + 1, c: 1 } });
    }

    getLabels(language) {
        const labels = {
            uz: {
                title: "Biznes Hisoboti",
                reportInfo: "Hisobot Ma'lumotlari",
                phoneNumber: "Telefon raqami",
                fromDate: "Boshlanish sanasi",
                toDate: "Tugash sanasi", 
                generatedAt: "Yaratilgan sana",
                reportData: "Hisobot Ma'lumotlari",
                parameter: "Parametr",
                values: "Qiymatlar",
                noDataAvailable: "Ma'lumot topilmadi",
                footerText: "Ushbu hisobot BPS (EUROASIA PRINT) tomonidan yaratilgan"
            },
            ru: {
                title: "Бизнес Отчет",
                reportInfo: "Информация об отчете",
                phoneNumber: "Номер телефона",
                fromDate: "Дата начала",
                toDate: "Дата окончания",
                generatedAt: "Дата создания",
                reportData: "Данные отчета",
                parameter: "Параметр",
                values: "Значения",
                noDataAvailable: "Данные не найдены",
                footerText: "Этот отчет создан BPS (EUROASIA PRINT)"
            },
            en: {
                title: "Business Report",
                reportInfo: "Report Information",
                phoneNumber: "Phone Number",
                fromDate: "From Date",
                toDate: "To Date", 
                generatedAt: "Generated At",
                reportData: "Report Data",
                parameter: "Parameter",
                values: "Values",
                noDataAvailable: "No data available",
                footerText: "This report is generated by BPS (EUROASIA PRINT)"
            }
        };

        return labels[language] || labels.uz;
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