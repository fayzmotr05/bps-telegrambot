class TextReportService {
    async generateReport(reportData, phoneNumber, fromDate, toDate, language = 'uz') {
        try {
            console.log('📄 Generating text report...');
            
            const labels = this.getLabels(language);
            
            let report = '';
            report += `═══════════════════════════════════\n`;
            report += `📊 ${labels.title}\n`;
            report += `🏢 BPS (EUROASIA PRINT)\n`;
            report += `═══════════════════════════════════\n\n`;
            
            report += `📱 ${labels.phoneNumber}: ${phoneNumber}\n`;
            report += `📅 ${labels.fromDate}: ${this.formatDate(fromDate)}\n`;
            report += `📅 ${labels.toDate}: ${this.formatDate(toDate)}\n`;
            report += `🕐 ${labels.generatedAt}: ${this.formatDate(new Date().toISOString().split('T')[0])}\n\n`;
            
            report += `═══════════════════════════════════\n`;
            report += `📋 ${labels.reportData}\n`;
            report += `═══════════════════════════════════\n\n`;
            
            if (reportData && reportData.calculatedData && Object.keys(reportData.calculatedData).length > 0) {
                Object.entries(reportData.calculatedData).forEach(([key, values]) => {
                    report += `▪️ ${key}:\n`;
                    const valueText = Array.isArray(values) ? values.join(', ') : String(values);
                    report += `   ${valueText}\n\n`;
                });
            } else {
                report += `❌ ${labels.noDataAvailable}\n\n`;
            }
            
            report += `═══════════════════════════════════\n`;
            report += `📧 euroasiaprint@gmail.com\n`;
            report += `📞 +998 90 123 45 67\n`;
            report += `═══════════════════════════════════`;
            
            return report;
            
        } catch (error) {
            console.error('❌ Error generating text report:', error);
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
                noDataAvailable: "Ma'lumot topilmadi"
            },
            ru: {
                title: "Отчет",
                phoneNumber: "Номер телефона",
                fromDate: "Дата начала",
                toDate: "Дата окончания",
                generatedAt: "Дата создания",
                reportData: "Данные отчета",
                noDataAvailable: "Данные не найдены"
            },
            en: {
                title: "Report",
                phoneNumber: "Phone Number",
                fromDate: "From Date",
                toDate: "To Date", 
                generatedAt: "Generated At",
                reportData: "Report Data",
                noDataAvailable: "No data available"
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
}

module.exports = new TextReportService();