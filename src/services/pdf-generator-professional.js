const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const pipelineAsync = promisify(pipeline);

class ProfessionalPDFService {
    constructor() {
        this.margins = { top: 50, left: 50, bottom: 50, right: 50 };
        this.colors = {
            primary: '#2E86AB',
            secondary: '#A23B72', 
            text: '#2C3E50',
            lightGray: '#ECF0F1',
            darkGray: '#34495E'
        };
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz') {
        try {
            console.log('📄 Generating professional PDF report...');
            
            const labels = this.getLabels(language);
            const fileName = `report_${phoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            // Ensure temp directory exists
            await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
            
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: this.margins,
                info: {
                    Title: `${labels.title} - ${phoneNumber}`,
                    Author: 'BPS (EUROASIA PRINT)',
                    Subject: 'Business Report',
                    Keywords: 'report, business, bps'
                }
            });

            // Create write stream
            const writeStream = fs.createWriteStream(filePath);
            
            // Pipe document to file
            doc.pipe(writeStream);

            // Add content
            await this.addHeader(doc, labels);
            await this.addReportInfo(doc, labels, phoneNumber, fromDate, toDate);
            await this.addReportData(doc, labels, reportData);
            await this.addFooter(doc, labels);

            // Finalize the document
            doc.end();
            
            // Wait for the write stream to finish
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            console.log(`✅ Professional PDF generated: ${filePath}`);
            return filePath;
            
        } catch (error) {
            console.error('❌ Error generating professional PDF:', error);
            throw error;
        }
    }

    async addHeader(doc, labels) {
        // Header background
        doc.rect(0, 0, doc.page.width, 120)
           .fill(this.colors.primary);

        // Company logo placeholder (you can add actual logo later)
        doc.circle(80, 60, 25)
           .fill('white');

        // Title
        doc.fillColor('white')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text(labels.title, 120, 35);

        // Company name
        doc.fontSize(16)
           .font('Helvetica')
           .text('BPS (EUROASIA PRINT)', 120, 70);

        // Reset position for content
        doc.y = 150;
    }

    async addReportInfo(doc, labels, phoneNumber, fromDate, toDate) {
        const startY = doc.y;

        // Section header
        doc.fillColor(this.colors.text)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(labels.reportInfo || 'Report Information', this.margins.left, startY);

        doc.y += 20;

        // Info box background
        const boxY = doc.y;
        doc.rect(this.margins.left, boxY, doc.page.width - this.margins.left - this.margins.right, 100)
           .fill(this.colors.lightGray)
           .stroke();

        // Info content
        doc.fillColor(this.colors.text)
           .fontSize(12)
           .font('Helvetica');

        const infoY = boxY + 15;
        const leftCol = this.margins.left + 15;
        const rightCol = doc.page.width / 2 + 20;

        // Left column
        doc.font('Helvetica-Bold').text(labels.phoneNumber + ':', leftCol, infoY);
        doc.font('Helvetica').text(phoneNumber, leftCol, infoY + 15);

        doc.font('Helvetica-Bold').text(labels.fromDate + ':', leftCol, infoY + 40);
        doc.font('Helvetica').text(this.formatDate(fromDate), leftCol, infoY + 55);

        // Right column
        doc.font('Helvetica-Bold').text(labels.toDate + ':', rightCol, infoY);
        doc.font('Helvetica').text(this.formatDate(toDate), rightCol, infoY + 15);

        doc.font('Helvetica-Bold').text(labels.generatedAt + ':', rightCol, infoY + 40);
        doc.font('Helvetica').text(this.formatDate(new Date().toISOString().split('T')[0]), rightCol, infoY + 55);

        doc.y = boxY + 120;
    }

    async addReportData(doc, labels, reportData) {
        // Section header
        doc.fillColor(this.colors.primary)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(labels.reportData, this.margins.left, doc.y + 20);

        doc.y += 50;

        if (reportData && reportData.calculatedData && Object.keys(reportData.calculatedData).length > 0) {
            // Table header background
            const tableY = doc.y;
            doc.rect(this.margins.left, tableY, doc.page.width - this.margins.left - this.margins.right, 30)
               .fill(this.colors.primary);

            // Table headers
            doc.fillColor('white')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(labels.parameter, this.margins.left + 10, tableY + 10)
               .text(labels.values, doc.page.width / 2, tableY + 10);

            let currentY = tableY + 35;
            let rowIndex = 0;

            // Data rows
            Object.entries(reportData.calculatedData).forEach(([key, values]) => {
                // Check if we need a new page
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = this.margins.top;
                }

                // Alternate row colors
                const rowColor = rowIndex % 2 === 0 ? 'white' : this.colors.lightGray;
                
                doc.rect(this.margins.left, currentY, doc.page.width - this.margins.left - this.margins.right, 25)
                   .fill(rowColor);

                // Row content
                doc.fillColor(this.colors.text)
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text(key, this.margins.left + 10, currentY + 8);

                const valueText = Array.isArray(values) ? values.join(', ') : String(values);
                const maxWidth = (doc.page.width / 2) - 20;
                
                doc.font('Helvetica')
                   .text(valueText, doc.page.width / 2, currentY + 8, { 
                       width: maxWidth,
                       ellipsis: true
                   });

                currentY += 25;
                rowIndex++;
            });

            doc.y = currentY + 20;
        } else {
            // No data message
            doc.fillColor(this.colors.darkGray)
               .fontSize(14)
               .font('Helvetica')
               .text(labels.noDataAvailable, this.margins.left, doc.y, {
                   align: 'center',
                   width: doc.page.width - this.margins.left - this.margins.right
               });
            
            doc.y += 50;
        }
    }

    async addFooter(doc, labels) {
        // Footer position
        const footerY = doc.page.height - 80;
        
        // Footer line
        doc.moveTo(this.margins.left, footerY)
           .lineTo(doc.page.width - this.margins.right, footerY)
           .stroke(this.colors.primary);

        // Footer content
        doc.fillColor(this.colors.darkGray)
           .fontSize(10)
           .font('Helvetica')
           .text(labels.footerText, this.margins.left, footerY + 15, {
               align: 'center',
               width: doc.page.width - this.margins.left - this.margins.right
           });

        doc.fontSize(9)
           .text('📧 euroasiaprint@gmail.com | 📞 +998 90 123 45 67', this.margins.left, footerY + 35, {
               align: 'center',
               width: doc.page.width - this.margins.left - this.margins.right
           });

        doc.text(`Generated on ${new Date().toLocaleString()}`, this.margins.left, footerY + 50, {
            align: 'center',
            width: doc.page.width - this.margins.left - this.margins.right
        });
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
            await fsPromises.unlink(filePath);
            console.log(`🧹 Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            console.error('❌ Error cleaning up file:', error);
        }
    }
}

module.exports = new ProfessionalPDFService();