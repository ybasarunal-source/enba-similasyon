/**
 * Enba Similasyon - Dosya İşlemleri (PDF, Excel)
 */

window.EnbaIO = {
    /**
     * Raporu PDF olarak indirir
     */
    exportToPDF: (elementId, filename = 'Enba_Finansal_Rapor.pdf') => {
        const element = document.getElementById(elementId);
        if (!element) return;
        const opt = {
            margin:       10,
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        // @ts-ignore
        if (window.html2pdf) {
            window.html2pdf().set(opt).from(element).save();
        } else {
            console.error("html2pdf kütüphanesi yüklü değil.");
        }
    },

    /**
     * Tabloyu Excel olarak indirir
     */
    exportToExcel: (tableId, filename = "Enba_Finansal_Rapor.xlsx", sheetName = "Enba_Rapor") => {
        const table = document.getElementById(tableId);
        if (!table) return;
        // @ts-ignore
        const XLSX = window.XLSX;
        const wb = XLSX.utils.table_to_book(table, {sheet: sheetName});
        XLSX.writeFile(wb, filename);
    },

    /**
     * İPK Taslak Şablonu indirir
     */
    sablonIndir: () => {
        const XLSX = window.XLSX;
        const satirlar = [];
        satirlar.push(["KOD", "KALEM ADI", "TUTAR (₺)"]);
        satirlar.push(["--- GELİRLER ---", "", ""]);
        window.SABLON_GELIRLER.forEach(g => {
            satirlar.push([g.kodu, g.adi, ""]);
        });
        window.GIDER_GRUPLARI.forEach(grup => {
            satirlar.push([`--- ${grup.ad.toUpperCase()} ---`, "", ""]);
            window.SABLON_GIDERLER.filter(g => g.grup === grup.id).forEach(g => {
                satirlar.push([g.kodu, g.adi, ""]);
            });
        });
        const ws = XLSX.utils.aoa_to_sheet(satirlar);
        ws['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "İPK Şablonu");
        XLSX.writeFile(wb, "Enba_IPK_Sablonu.xlsx");
    }
};
