const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;

class PDFService {
    constructor() {
        this.templatePath = path.join(__dirname, '../templates');
    }

    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz') {
        try {
            const template = await this.getTemplate(language);
            const compiledTemplate = handlebars.compile(template);
            
            const templateData = {
                phoneNumber: phoneNumber,
                fromDate: this.formatDate(fromDate),
                toDate: this.formatDate(toDate),
                generatedAt: this.formatDate(new Date().toISOString().split('T')[0]),
                reportData: reportData.calculatedData,
                language: language,
                labels: this.getLabels(language)
            };

            const html = compiledTemplate(templateData);
            
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-extensions'
                ]
            });
            
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const fileName = `report_${phoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../temp', fileName);
            
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            await page.pdf({
                path: filePath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            
            await browser.close();
            
            console.log(`PDF generated: ${filePath}`);
            return filePath;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    async getTemplate(language) {
        const templateFile = path.join(this.templatePath, 'report-template.hbs');
        
        try {
            return await fs.readFile(templateFile, 'utf8');
        } catch (error) {
            console.log('Template file not found, creating default template');
            await this.createDefaultTemplate();
            return await fs.readFile(templateFile, 'utf8');
        }
    }

    async createDefaultTemplate() {
        const templateContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{labels.title}}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 5px 0 0 0;
        }
        .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 25px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .label {
            font-weight: bold;
            color: #495057;
        }
        .value {
            color: #212529;
        }
        .data-section {
            margin-top: 30px;
        }
        .data-section h3 {
            color: #007bff;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .data-table th {
            background: #007bff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #dee2e6;
        }
        .data-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .data-table tr:hover {
            background: #e3f2fd;
        }
        .no-data {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 40px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{labels.title}}</h1>
            <p>BPS (EUROASIA PRINT)</p>
        </div>
        
        <div class="info-section">
            <div class="info-row">
                <span class="label">{{labels.phoneNumber}}:</span>
                <span class="value">{{phoneNumber}}</span>
            </div>
            <div class="info-row">
                <span class="label">{{labels.fromDate}}:</span>
                <span class="value">{{fromDate}}</span>
            </div>
            <div class="info-row">
                <span class="label">{{labels.toDate}}:</span>
                <span class="value">{{toDate}}</span>
            </div>
            <div class="info-row">
                <span class="label">{{labels.generatedAt}}:</span>
                <span class="value">{{generatedAt}}</span>
            </div>
        </div>

        <div class="data-section">
            <h3>{{labels.reportData}}</h3>
            
            {{#if reportData}}
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>{{labels.parameter}}</th>
                            <th>{{labels.values}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each reportData}}
                        <tr>
                            <td><strong>{{@key}}</strong></td>
                            <td>{{#each this}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            {{else}}
                <div class="no-data">
                    {{labels.noDataAvailable}}
                </div>
            {{/if}}
        </div>

        <div class="footer">
            <p>{{labels.footerText}}</p>
            <p>📧 euroasiaprint@gmail.com | 📞 +998 90 123 45 67</p>
        </div>
    </div>
</body>
</html>`;

        const templateDir = path.dirname(path.join(this.templatePath, 'report-template.hbs'));
        await fs.mkdir(templateDir, { recursive: true });
        await fs.writeFile(path.join(this.templatePath, 'report-template.hbs'), templateContent);
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
            console.log(`Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            console.error('Error cleaning up file:', error);
        }
    }
}

module.exports = new PDFService();