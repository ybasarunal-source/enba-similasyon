/**
 * Enba Similasyon - Çok Dilli Destek (TypeScript)
 * Uygulamanın tüm çeviri metinleri ve t() fonksiyonu burada tanımlanır.
 */

interface TranslationSchema {
  [key: string]: string | TranslationSchema;
}

export const translations: Record<string, TranslationSchema> = {
  TR: {
    common: {
      save: "Kaydet",
      delete: "Sil",
      edit: "Düzenle",
      cancel: "İptal",
      actions: "İşlemler",
      description: "Açıklama",
    },
    assets: {
      date: "Tarih",
      name: "Varlık Adı",
      category: "Kategori",
      price: "Maliyet",
      maintenance: {
        type: "Bakım Türü",
        scheduled: "Planlı Bakım",
        breakdown: "Arıza Giderme",
        preventive: "Önleyici Bakım"
      },
      categories: {
        production: "Üretim Makinası",
        conveyor: "Konveyör",
        compressor: "Kompresör",
        forklift: "Forklift",
        crane: "Vinç",
        panel: "Elektrik/Panel",
        office: "Ofis Ekipmanı",
        vehicle: "Araç",
        it: "Bilgisayar/IT",
        security: "Güvenlik Sistemi",
        lighting: "Aydınlatma",
        furniture: "Mobilya",
        other: "Diğer"
      }
    },
    // ... Diğer çeviriler uygulama yüklendikçe buraya taşınacak
  },
  EN: {
    common: {
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      cancel: "Cancel",
      actions: "Actions",
      description: "Description",
    },
    assets: {
      date: "Date",
      name: "Asset Name",
      category: "Category",
      price: "Cost",
      maintenance: {
        type: "Maintenance Type",
        scheduled: "Scheduled",
        breakdown: "Repair",
        preventive: "Preventive"
      },
      categories: {
        production: "Production Machine",
        conveyor: "Conveyor",
        compressor: "Compressor",
        forklift: "Forklift",
        crane: "Crane",
        panel: "Electrical Panel",
        office: "Office Equipment",
        vehicle: "Vehicle",
        it: "IT/Computer",
        security: "Security System",
        lighting: "Lighting",
        furniture: "Furniture",
        other: "Other"
      }
    }
  }
};

/**
 * t() fonksiyonu - Çeviri anahtarına göre metni döndürür
 */
export const t = (path: string): string => {
  const lang = localStorage.getItem('enba_lang') || 'TR';
  const keys = path.split('.');
  let result: any = translations[lang];

  for (const key of keys) {
    if (result && result[key]) {
      result = result[key];
    } else {
      return path; // Anahtar bulunamazsa anahtarın adını dön
    }
  }

  return typeof result === 'string' ? result : path;
};

// Global erişim gerekirse (Legacy desteği için)
if (typeof window !== 'undefined') {
  (window as any).t = t;
}
