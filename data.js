window.fmt = (val) => Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

window.GIDER_GRUPLARI = [
    { id: "G1", ad: "Üretim ve Hammadde Giderleri" },
    { id: "G2", ad: "Enerji ve Fayda Giderleri" },
    { id: "G3", ad: "Personel Giderleri" },
    { id: "G4", ad: "Lojistik ve Dış Hizmetler" },
    { id: "G5", ad: "Genel Yönetim ve Diğer Giderler" }
];

window.SABLON_GIDERLER = [
    { kodu: "305", adi: "Mal Ödemesi", grup: "G1" },
    { kodu: "301", adi: "Alış Nakliye", grup: "G1" }, 
    { kodu: "315", adi: "Çuval / Balya Teli", grup: "G1" },
    { kodu: "405", adi: "Elektrik Giderleri", grup: "G2" },
    { kodu: "410", adi: "Üretim Yakıt", grup: "G2" },
    { kodu: "415", adi: "Su / Atık Su", grup: "G2" },
    { kodu: "450", adi: "Personel Maaşları", grup: "G3" },
    { kodu: "455", adi: "SGK Ödemeleri", grup: "G3" },
    { kodu: "480", adi: "Personel Yemek", grup: "G3" },
    { kodu: "302", adi: "Satış Nakliye", grup: "G4" },
    { kodu: "609", adi: "Dış Hizmetler (Muhasebe, Bertaraf vb.)", grup: "G5" },
    { kodu: "509", adi: "Bakım Onarım", grup: "G5" },
    { kodu: "610", adi: "Kiralama Ücretleri", grup: "G5" },
    { kodu: "615", adi: "Seyahat Giderleri", grup: "G5" },
    { kodu: "620", adi: "İletişim Giderleri", grup: "G5" },
    { kodu: "625", adi: "Yasal Ücretler", grup: "G5" },
    { kodu: "630", adi: "Reklam Giderleri", grup: "G5" },
    { kodu: "635", adi: "Sigortalar", grup: "G5" },
    { kodu: "640", adi: "Bilişim Harcamaları", grup: "G5" },
    { kodu: "650", adi: "Bankacılık Giderleri", grup: "G5" },
    { kodu: "665", adi: "Harçlar ve Vergiler", grup: "G5" },
    { kodu: "002", adi: "Merkez Yönetim Giderleri", grup: "G5" },
    { kodu: "670", adi: "Diğer Çeşitli Giderler", grup: "G5" }
];

window.SABLON_GELIRLER = [
    { kodu: "109", adi: "Mal Satış Geliri (Konsolide)" }
];

window.getVarsayilanPlanlar = () => [];

window.USER_ROLES = {
    ADMIN: 'admin',
    GENEL_MUDUR: 'genel_mudur',
    FINANCE: 'finance',
    PRODUCTION: 'production',
    LOGISTICS: 'logistics',
    OPERATOR: 'operator'
};

window.ROLE_TEMPLATES = {
    [window.USER_ROLES.ADMIN]: ['isPlanlama', 'detayliPlan', 'nakitAkis', 'pnlRapor', 'uretimPlan', 'uretimTakip', 'lojistikTakip', 'stok', 'lisansTakip', 'gorevler', 'katalog', 'makina', 'arsiv', 'mesajlar', 'yetkiYonetimi', 'orgChart', 'insanKaynaklari', 'odemeTakip'],
    [window.USER_ROLES.GENEL_MUDUR]: ['isPlanlama', 'detayliPlan', 'nakitAkis', 'pnlRapor', 'uretimPlan', 'uretimTakip', 'lojistikTakip', 'stok', 'lisansTakip', 'gorevler', 'katalog', 'makina', 'arsiv', 'mesajlar', 'orgChart', 'insanKaynaklari', 'odemeTakip'],
    [window.USER_ROLES.FINANCE]: ['isPlanlama', 'detayliPlan', 'nakitAkis', 'pnlRapor', 'arsiv', 'mesajlar', 'odemeTakip'],
    [window.USER_ROLES.PRODUCTION]: ['uretimPlan', 'uretimTakip', 'stok', 'gorevler', 'makina', 'arsiv', 'mesajlar'],
    [window.USER_ROLES.LOGISTICS]: ['lojistikTakip', 'stok', 'katalog', 'arsiv', 'mesajlar'],
    [window.USER_ROLES.OPERATOR]: ['uretimTakip', 'gorevler', 'arsiv', 'mesajlar']
};

window.ORG_STRUCTURE = [
    {
        id: 'root',
        role: window.USER_ROLES.GENEL_MUDUR,
        children: [
            {
                id: 'dept_finance',
                role: window.USER_ROLES.FINANCE,
                children: []
            },
            {
                id: 'dept_production',
                role: window.USER_ROLES.PRODUCTION,
                children: [
                    { id: 'dept_op', role: window.USER_ROLES.OPERATOR, children: [] }
                ]
            },
            {
                id: 'dept_logistics',
                role: window.USER_ROLES.LOGISTICS,
                children: []
            }
        ]
    }
];

window.MOCK_USERS = [
    { 
        id: 'u1', username: 'admin', password: '123', name: 'Sistem Yöneticisi', 
        role: window.USER_ROLES.ADMIN 
    },
    { 
        id: 'u2', username: 'finance', password: '123', name: 'Mali İşler Sorumlusu', 
        role: window.USER_ROLES.FINANCE,
        allowedModules: [] // Role based will be inherited
    },
    { 
        id: 'u3', username: 'üretim', password: '123', name: 'Üretim Müdürü', 
        role: window.USER_ROLES.PRODUCTION,
        allowedModules: []
    },
    { 
        id: 'u4', username: 'lojistik', password: '123', name: 'Lojistik Sorumlusu', 
        role: window.USER_ROLES.LOGISTICS,
        allowedModules: []
    },
    { 
        id: 'u5', username: 'saha', password: '123', name: 'Saha Operatörü', 
        role: window.USER_ROLES.OPERATOR,
        allowedModules: []
    },
    { 
        id: 'u6', username: 'gm', password: '123', name: 'Genel Müdür', 
        role: window.USER_ROLES.GENEL_MUDUR,
        allowedModules: []
    }
];