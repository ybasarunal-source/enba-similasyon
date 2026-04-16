/**
 * Enba Similasyon - Ayarlar Modülü
 * Sistem geneli varsayılan para birimi, ölçüm birimi ve diğer ayarlar
 */

// Global yardımcı: plan veya global ayardan para birimi sembolü döner
window.getCurrencySymbol = function(kod) {
    const MAP = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
    return MAP[kod] || '₺';
};

// Global yardımcı: ton/kg dönüşümü
window.birimiCevir = function(deger, olcumBirimi) {
    if (olcumBirimi === 'kg') return Number(deger) * 1000;
    return Number(deger);
};

window.AyarlarModulu = function AyarlarModulu({ globalAyarlar, setGlobalAyarlar }) {
    const [yerel, setYerel] = React.useState({ ...globalAyarlar });
    const [kaydedildi, setKaydedildi] = React.useState(false);
    const [yukleniyor, setYukleniyor] = React.useState(false);

    const kaydet = async () => {
        setYukleniyor(true);
        try {
            await window.DataService.updateSetting('globalAyarlar', yerel);
            setGlobalAyarlar(yerel);
            setKaydedildi(true);
            setTimeout(() => setKaydedildi(false), 3000);
        } catch (e) {
            alert('Ayarlar kaydedilemedi: ' + e.message);
        }
        setYukleniyor(false);
    };

    const guncelle = (alan, deger) => {
        setYerel(p => ({ ...p, [alan]: deger }));
        setKaydedildi(false);
    };

    const sectionStyle = {
        background: 'var(--surface-container-lowest)',
        borderRadius: '1.5rem',
        padding: '28px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px',
    };
    const sectionTitle = {
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 700,
        fontSize: '16px',
        color: 'var(--enba-dark)',
        margin: '0 0 20px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--surface-container-high)',
    };
    const labelStyle = {
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--on-surface-variant)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        display: 'block',
        marginBottom: '10px',
    };
    const optionCard = (aktif) => ({
        flex: 1,
        minWidth: '140px',
        padding: '16px',
        borderRadius: '1rem',
        border: `2px solid ${aktif ? 'var(--enba-orange)' : 'var(--surface-container-highest)'}`,
        background: aktif ? 'rgba(227,82,5,0.06)' : 'var(--surface)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
    });

    const PARA_BIRIMLERI = [
        { kod: 'TRY', sembol: '₺', ad: 'Türk Lirası' },
        { kod: 'USD', sembol: '$', ad: 'Amerikan Doları' },
        { kod: 'EUR', sembol: '€', ad: 'Euro' },
        { kod: 'GBP', sembol: '£', ad: 'İngiliz Sterlini' },
    ];

    const OLCUM_BIRIMLERI = [
        { kod: 'ton', ad: 'Ton', aciklama: 'Metrik ton (1.000 kg)', icon: '🏗️' },
        { kod: 'kg',  ad: 'Kilogram', aciklama: 'Kilogram (kg)', icon: '⚖️' },
    ];

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px' }}>

            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '26px', color: 'var(--enba-dark)', margin: 0 }}>
                    ⚙️ Sistem Ayarları
                </h1>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', margin: '8px 0 0' }}>
                    Buradaki değerler tüm yeni iş planları için varsayılan olarak kullanılır. Her plan kendi başında değiştirilebilir.
                </p>
            </div>

            {/* Para Birimi */}
            <div style={sectionStyle}>
                <h2 style={sectionTitle}>💱 Temel Para Birimi</h2>
                <label style={labelStyle}>Sistemin varsayılan para birimi</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {PARA_BIRIMLERI.map(pb => (
                        <div key={pb.kod} style={optionCard(yerel.paraBirimi === pb.kod)} onClick={() => guncelle('paraBirimi', pb.kod)}>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: yerel.paraBirimi === pb.kod ? 'var(--enba-orange)' : 'var(--enba-dark)' }}>{pb.sembol}</div>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '6px', color: 'var(--enba-dark)' }}>{pb.kod}</div>
                            <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{pb.ad}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ölçüm Birimi */}
            <div style={sectionStyle}>
                <h2 style={sectionTitle}>📏 Ağırlık / Ölçüm Birimi</h2>
                <label style={labelStyle}>Tonaj ve ağırlık hesaplamalarında kullanılacak birim</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {OLCUM_BIRIMLERI.map(ob => (
                        <div key={ob.kod} style={{ ...optionCard(yerel.olcumBirimi === ob.kod), minWidth: '200px', textAlign: 'left' }} onClick={() => guncelle('olcumBirimi', ob.kod)}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{ob.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: yerel.olcumBirimi === ob.kod ? 'var(--enba-orange)' : 'var(--enba-dark)' }}>{ob.ad}</div>
                            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>{ob.aciklama}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gelecekte buraya yeni ayar bölümleri eklenecek */}

            {/* Kaydet */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                {kaydedildi && (
                    <span style={{ color: '#27ae60', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✓ Ayarlar kaydedildi
                    </span>
                )}
                <button
                    onClick={kaydet}
                    disabled={yukleniyor}
                    style={{
                        background: 'var(--enba-orange)',
                        color: '#fff',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: '2rem',
                        fontWeight: 800,
                        fontSize: '15px',
                        cursor: yukleniyor ? 'not-allowed' : 'pointer',
                        opacity: yukleniyor ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(227,82,5,0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    {yukleniyor ? 'Kaydediliyor...' : '💾 Ayarları Kaydet'}
                </button>
            </div>
        </div>
    );
};
