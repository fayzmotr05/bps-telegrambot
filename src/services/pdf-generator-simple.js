const { jsPDF } = require('jspdf');
const path = require('path');
const fs = require('fs').promises;

class SimplePDFService {
    constructor() {
        // PDF fonts and settings
        this.fonts = {
            normal: 'helvetica',
            bold: 'helvetica-bold'
        };
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz') {
        try {
            console.log('📄 Generating simple PDF report...');
            
            // Create new PDF document
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const labels = this.getLabels(language);
            let yPosition = 20;
            
            // Title
            doc.setFontSize(24);
            doc.setFont(this.fonts.bold);
            doc.text(labels.title, 105, yPosition, { align: 'center' });
            yPosition += 15;
            
            // Company name
            doc.setFontSize(14);
            doc.setFont(this.fonts.normal);
            doc.text('BPS (EUROASIA PRINT)', 105, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Report information
            doc.setFontSize(12);
            doc.setFont(this.fonts.bold);
            
            const infoData = [
                [labels.phoneNumber, phoneNumber],
                [labels.fromDate, this.formatDate(fromDate)],
                [labels.toDate, this.formatDate(toDate)],
                [labels.generatedAt, this.formatDate(new Date().toISOString().split('T')[0])]
            ];
            
            infoData.forEach(([label, value]) => {
                doc.setFont(this.fonts.bold);
                doc.text(label + ':', 20, yPosition);
                doc.setFont(this.fonts.normal);
                doc.text(value, 70, yPosition);
                yPosition += 8;
            });
            
            yPosition += 10;
            
            // Report data section
            doc.setFontSize(16);
            doc.setFont(this.fonts.bold);
            doc.text(labels.reportData, 20, yPosition);
            yPosition += 15;
            
            if (reportData && reportData.calculatedData && Object.keys(reportData.calculatedData).length > 0) {
                doc.setFontSize(11);
                
                // Table headers
                const tableStartY = yPosition;
                const col1X = 20;
                const col2X = 110;
                
                doc.setFont(this.fonts.bold);
                doc.text(labels.parameter, col1X, tableStartY);
                doc.text(labels.values, col2X, tableStartY);
                yPosition += 8;
                
                // Draw line under headers
                doc.line(col1X, yPosition - 2, 190, yPosition - 2);
                yPosition += 5;
                
                // Data rows
                doc.setFont(this.fonts.normal);
                Object.entries(reportData.calculatedData).forEach(([key, values]) => {
                    if (yPosition > 260) { // Check if we need a new page
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.text(key, col1X, yPosition);
                    
                    const valueText = Array.isArray(values) ? values.join(', ') : String(values);
                    const wrappedText = doc.splitTextToSize(valueText, 80);
                    doc.text(wrappedText, col2X, yPosition);
                    
                    yPosition += Math.max(8, wrappedText.length * 5);
                });
            } else {
                doc.setFontSize(12);
                doc.setFont(this.fonts.normal);
                doc.text(labels.noDataAvailable, 105, yPosition, { align: 'center' });
                yPosition += 20;
            }
            
            // Footer
            if (yPosition > 240) {
                doc.addPage();
                yPosition = 20;
            } else {
                yPosition = 260;
            }
            
            doc.setFontSize(10);
            doc.setFont(this.fonts.normal);
            doc.text(labels.footerText, 105, yPosition, { align: 'center' });
            doc.text('📧 euroasiaprint@gmail.com | 📞 +998 90 123 45 67', 105, yPosition + 8, { align: 'center' });
            
            // Save the PDF
            const fileName = `report_${phoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            await fs.writeFile(filePath, pdfBuffer);
            
            console.log(`✅ Simple PDF generated: ${filePath}`);
            return filePath;
            
        } catch (error) {
            console.error('❌ Error generating simple PDF:', error);
            throw error;
        }
    }

    getLabels(language) {
        const labels = {
            uz: {
                title: "Hisobot",
                phoneNumber: "Telefon raqami",
                fromDate: "Boshlanish sanasi",
                toDate: "Tugash sanasi", 
                generatedAt: "Yaratilgan sana",
                reportData: "Hisobot ma'lumotlari",
                parameter: "Parametr",
                values: "Qiymatlar",
                noDataAvailable: "Ma'lumot topilmadi",
                footerText: "Ushbu hisobot BPS (EUROASIA PRINT) tomonidan yaratilgan"
            },
            ru: {
                title: "Отчет",
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
                title: "Report",
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
            console.log(`🧹 Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            console.error('❌ Error cleaning up file:', error);
        }
    }
}

module.exports = new SimplePDFService();