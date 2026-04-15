// ============================================================
// Enba Üretim Planlama Modülü
// localStorage key: enba_uretim_planlar
// Depends on: enba_uretim_kayitlari (actuals), enba_makinalar_v2
// ============================================================

const UretimPlanlamaModulu = () => {
  // ── State ──────────────────────────────────────────────────
  const [planlar, setPlanlar] = React.useState([]);
  const [aktifPlanId, setAktifPlanId] = React.useState(null);
  const [aktifTab, setAktifTab] = React.useState(0);
  const [formAcik, setFormAcik] = React.useState(false);
  const [duzenlenenId, setDuzenlenenId] = React.useState(null);
  const [kayitlar, setKayitlar] = React.useState([]);
  const [ozelGunForm, setOzelGunForm] = React.useState(null); // { tarih }

  const bosForm = {
    baslik: "",
    baslangicTarihi: "",
    bitisTarihi: "",
    hedefCikanTon: "",
    verimOrani: 85,
    vardiyaSayisi: 2,
    vardiyaSaati: 8,
    calismaGunleri: [1, 2, 3, 4, 5, 6],
    urunTuru: "",
    notlar: "",
    ozelGunler: [],
  };
  const [form, setForm] = React.useState(bosForm);
  const [ozelFormData, setOzelFormData] = React.useState({ tur: "tatil", not: "" });

  const [loading, setLoading] = React.useState(true);

  // ── Load from DataService ────────────────────────────────────
  const loadData = async () => {
    if (!window.DataService) return;
    setLoading(true);
    try {
      const [plans, recs] = await Promise.all([
        window.DataService.getProductionPlans(),
        window.DataService.getProductionRecords()
      ]);

      // Map snake_case to camelCase for plans
      const mappedPlans = plans.map(p => ({
        id: p.id,
        baslik: p.title,
        baslangicTarihi: p.start_date,
        bitisTarihi: p.end_date,
        hedefCikanTon: p.target_output,
        verimOrani: p.efficiency_rate,
        vardiyaSayisi: p.shift_count,
        vardiyaSaati: p.shift_hours,
        calismaGunleri: p.working_days,
        urunTuru: p.product_type,
        ozelGunler: p.special_days || [],
        notlar: p.notlar
      }));

      // Map snake_case to camelCase for actual records
      const mappedRecs = recs.map(r => ({
        tarih: r.tarih,
        girenHammadde: r.giren_hammadde,
        cikanUrun: r.cikan_urun
      }));

      setPlanlar(mappedPlans);
      setKayitlar(mappedRecs);
    } catch (e) {
      console.error("Üretim planlama verileri yüklenemedi:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  // Persist logic removed, now using direct DB calls

  // ── Helpers ──────────────────────────────────────────────────
  const bugun = new Date().toISOString().slice(0, 10);

  const gunAdi = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const gunAdiTam = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  // Returns array of YYYY-MM-DD strings in [start, end]
  const tarihAraligi = (baslangic, bitis) => {
    const gunler = [];
    const cur = new Date(baslangic + "T00:00:00");
    const son = new Date(bitis + "T00:00:00");
    while (cur <= son) {
      gunler.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return gunler;
  };

  // Working days for a plan
  const calismaDaysHesapla = (plan) => {
    if (!plan.baslangicTarihi || !plan.bitisTarihi) return [];
    const tatilTarihler = new Set((plan.ozelGunler || []).map((g) => g.tarih));
    return tarihAraligi(plan.baslangicTarihi, plan.bitisTarihi).filter((t) => {
      const dow = new Date(t + "T00:00:00").getDay();
      return plan.calismaGunleri.includes(dow) && !tatilTarihler.has(t);
    });
  };

  // Group actuals by date
  const aktuellerByTarih = React.useMemo(() => {
    const map = {};
    kayitlar.forEach((k) => {
      if (!map[k.tarih]) map[k.tarih] = { giren: 0, cikan: 0 };
      map[k.tarih].giren += Number(k.girenHammadde || 0) / 1000;
      map[k.tarih].cikan += Number(k.cikanUrun || 0) / 1000;
    });
    return map;
  }, [kayitlar]);

  // Active plan (today falls in range)
  const guncelPlan = React.useMemo(() =>
    planlar.find((p) => p.baslangicTarihi <= bugun && p.bitisTarihi >= bugun),
    [planlar, bugun]
  );

  const seciliPlan = planlar.find((p) => p.id === aktifPlanId) || null;

  // ── Form helpers ──────────────────────────────────────────────
  const formDegistir = (alan, deger) => setForm((prev) => ({ ...prev, [alan]: deger }));

  const gunToggle = (dow) => {
    setForm((prev) => {
      const mevcut = prev.calismaGunleri;
      return {
        ...prev,
        calismaGunleri: mevcut.includes(dow)
          ? mevcut.filter((d) => d !== dow)
          : [...mevcut, dow].sort(),
      };
    });
  };

  // Live preview for the form
  const formCalismaDays = React.useMemo(() => {
    if (!form.baslangicTarihi || !form.bitisTarihi || form.calismaGunleri.length === 0) return 0;
    const tatil = new Set((form.ozelGunler || []).map((g) => g.tarih));
    return tarihAraligi(form.baslangicTarihi, form.bitisTarihi).filter((t) => {
      const dow = new Date(t + "T00:00:00").getDay();
      return form.calismaGunleri.includes(dow) && !tatil.has(t);
    }).length;
  }, [form.baslangicTarihi, form.bitisTarihi, form.calismaGunleri, form.ozelGunler]);

  const gunlukHedefPreview = formCalismaDays > 0 && form.hedefCikanTon
    ? (Number(form.hedefCikanTon) / formCalismaDays).toFixed(2)
    : null;

  // ── CRUD ──────────────────────────────────────────────────────
  const planKaydet = async () => {
    if (!form.baslik || !form.baslangicTarihi || !form.bitisTarihi || !form.hedefCikanTon) return;
    try {
        await window.DataService.saveProductionPlan({ ...form, id: duzenlenenId });
        await loadData();
        setForm(bosForm);
        setFormAcik(false);
        setDuzenlenenId(null);
    } catch (e) { alert("Plan kaydedilemedi."); }
  };

  const planSil = async (id) => {
    try {
        await window.DataService.deleteData('production_plans', id);
        await loadData();
        if (aktifPlanId === id) setAktifPlanId(null);
    } catch (e) { alert("Plan silinemedi."); }
  };

  const ozelGunEkle = async (planId, tarih, tur, not) => {
    const plan = planlar.find(p => p.id === planId);
    if (!plan) return;
    const mevcutOzel = (plan.ozelGunler || []).filter(g => g.tarih !== tarih);
    const yeniPlan = { ...plan, ozelGunler: [...mevcutOzel, { tarih, tur, not }] };
    
    try {
        await window.DataService.saveProductionPlan(yeniPlan);
        await loadData();
        setOzelGunForm(null);
    } catch (e) { alert("Özel gün kaydedilemedi."); }
  };

  const ozelGunSil = async (planId, tarih) => {
    const plan = planlar.find(p => p.id === planId);
    if (!plan) return;
    const yeniPlan = { ...plan, ozelGunler: (plan.ozelGunler || []).filter(g => g.tarih !== tarih) };
    
    try {
        await window.DataService.saveProductionPlan(yeniPlan);
        await loadData();
    } catch (e) { alert("Özel gün silinemedi."); }
  };

  // ── Styles ────────────────────────────────────────────────────
  const S = {
    kart: {
      background: "var(--surface-container-lowest)",
      borderRadius: "1.2rem",
      border: "1px solid var(--surface-container-highest)",
      boxShadow: "var(--shadow-sm)",
      padding: "1.25rem 1.5rem",
    },
    tab: (aktif) => ({
      padding: "0.45rem 1.2rem",
      borderRadius: "2rem",
      border: "none",
      cursor: "pointer",
      fontFamily: "'Manrope', sans-serif",
      fontWeight: 600,
      fontSize: "0.88rem",
      background: aktif ? "var(--enba-dark)" : "transparent",
      color: aktif ? "#fff" : "var(--on-surface-variant)",
      transition: "all 0.2s",
    }),
    btn: (renk = "navy") => ({
      padding: "0.4rem 1rem",
      borderRadius: "0.6rem",
      border: "none",
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      fontSize: "0.82rem",
      background: renk === "navy" ? "var(--enba-dark)" : renk === "green" ? "var(--enba-orange)" : renk === "red" ? "#e53935" : "#e0e0e0",
      color: renk === "gray" ? "var(--on-surface)" : "#fff",
    }),
    input: {
      padding: "0.5rem 0.75rem",
      borderRadius: "0.6rem",
      border: "1px solid var(--surface-container-highest)",
      background: "var(--surface-container-low)",
      color: "var(--on-surface)",
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.88rem",
      width: "100%",
      boxSizing: "border-box",
    },
    label: {
      display: "block",
      fontSize: "0.78rem",
      fontWeight: 600,
      color: "var(--on-surface-variant)",
      marginBottom: "0.3rem",
      fontFamily: "'Inter', sans-serif",
    },
    thStyle: {
      background: "var(--enba-dark)",
      color: "#fff",
      padding: "0.6rem 0.75rem",
      textAlign: "left",
      fontSize: "0.78rem",
      fontFamily: "'Manrope', sans-serif",
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    tdStyle: (i) => ({
      padding: "0.5rem 0.75rem",
      fontSize: "0.8rem",
      fontFamily: "'Inter', sans-serif",
      background: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
      color: "var(--on-surface)",
      borderBottom: "1px solid var(--surface-container-highest)",
    }),
  };

  // ── KPI card component ────────────────────────────────────────
  const KPIKart = ({ baslik, deger, alt, renk }) => (
    <div style={{ ...S.kart, flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", fontFamily: "'Inter', sans-serif", marginBottom: "0.3rem" }}>{baslik}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: renk || "var(--enba-dark)" }}>{deger}</div>
      {alt && <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: "0.2rem" }}>{alt}</div>}
    </div>
  );

  // ── Progress bar ──────────────────────────────────────────────
  const ProgressBar = ({ oran, renk }) => {
    const pct = Math.min(100, Math.max(0, oran || 0));
    const bg = renk || (pct >= 95 ? "#2e7d32" : pct >= 80 ? "#f57c00" : "#c62828");
    return (
      <div style={{ background: "var(--surface-container-highest)", borderRadius: "1rem", height: 8, overflow: "hidden" }}>
        <div style={{ width: pct + "%", background: bg, height: "100%", borderRadius: "1rem", transition: "width 0.4s" }} />
      </div>
    );
  };

  // ── Durum badge ───────────────────────────────────────────────
  const DurumBadge = ({ durum }) => {
    const renkler = {
      "Hedefte":      { bg: "rgba(46,125,50,0.15)",    text: "#1b5e20" },
      "Yakın":        { bg: "rgba(230,81,0,0.14)",     text: "#bf360c" },
      "Hedef Altı":   { bg: "rgba(198,40,40,0.14)",    text: "#b71c1c" },
      "Veri Yok":     { bg: "rgba(97,97,97,0.14)",     text: "#424242" },
      "Tatil":        { bg: "rgba(230,81,0,0.14)",     text: "#bf360c" },
      "Bakım":        { bg: "rgba(57,73,171,0.14)",    text: "#283593" },
      "Planlandı":    { bg: "rgba(21,101,192,0.14)",   text: "#0d47a1" },
      "Çalışma Dışı": { bg: "rgba(97,97,97,0.12)",    text: "#616161" },
      "Bugün":        { bg: "rgba(21,34,46,0.12)",     text: "var(--enba-dark)" },
    };
    const r = renkler[durum] || { bg: "rgba(97,97,97,0.12)", text: "#424242" };
    return (
      <span style={{
        padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.72rem", fontWeight: 700,
        background: r.bg,
        color: r.text,
        fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
      }}>{durum}</span>
    );
  };

  // ── "Plan seç" uyarısı ────────────────────────────────────────
  const PlanSecUyarisi = () => (
    <div style={{ ...S.kart, textAlign: "center", padding: "3rem", color: "var(--on-surface-variant)" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚡ </div>
      <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>Önce bir plan seçin</div>
      <div style={{ fontSize: "0.85rem" }}>Planlar sekmesinden bir planı seçerek bu sekmeyi görüntüleyebilirsiniz.</div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // TAB 1 — PLANLAR
  // ════════════════════════════════════════════════════════════
  const Tab1Planlar = () => {
    const toplamHedef = planlar.reduce((s, p) => s + Number(p.hedefCikanTon || 0), 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* KPI Summary */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <KPIKart baslik="Toplam Plan" deger={planlar.length} alt="kayıtlı plan" />
          <KPIKart baslik="Aktif Plan" deger={guncelPlan ? guncelPlan.baslik : "—"} alt={guncelPlan ? `${guncelPlan.baslangicTarihi} – ${guncelPlan.bitisTarihi}` : "bugün aktif plan yok"} renk={guncelPlan ? "var(--enba-orange)" : undefined} />
          <KPIKart baslik="Toplam Hedef Üretim" deger={(window.fmt ? window.fmt(toplamHedef) : toplamHedef) + " ton"} alt="tüm planlar" />
        </div>

        {/* New plan button */}
        {!formAcik && (
          <button style={{ ...S.btn("green"), alignSelf: "flex-start", padding: "0.55rem 1.4rem", fontSize: "0.9rem" }}
            onClick={() => { setForm(bosForm); setDuzenlenenId(null); setFormAcik(true); }}>
            + Yeni Plan Oluştur
          </button>
        )}

        {/* Inline form */}
        {formAcik && (
          <div style={{ ...S.kart, borderLeft: "4px solid var(--enba-dark)" }}>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "var(--enba-dark)" }}>
              {duzenlenenId ? "Planı Düzenle" : "Yeni Plan"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {/* baslik */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Plan Başlığı *</label>
                <input style={S.input} value={form.baslik} onChange={(e) => formDegistir("baslik", e.target.value)} placeholder="Örn: Nisan 2024 Üretim Planı" />
              </div>
              <div>
                <label style={S.label}>Başlangıç Tarihi *</label>
                <input type="date" style={S.input} value={form.baslangicTarihi} onChange={(e) => formDegistir("baslangicTarihi", e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Bitiş Tarihi *</label>
                <input type="date" style={S.input} value={form.bitisTarihi} onChange={(e) => formDegistir("bitisTarihi", e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Hedef Çıkan (ton) *</label>
                <input type="number" style={S.input} value={form.hedefCikanTon} onChange={(e) => formDegistir("hedefCikanTon", e.target.value)} placeholder="500" />
              </div>
              <div>
                <label style={S.label}>Verim Oranı (%)</label>
                <input type="number" style={S.input} value={form.verimOrani} onChange={(e) => formDegistir("verimOrani", e.target.value)} min={1} max={100} />
              </div>
              <div>
                <label style={S.label}>Vardiya Sayısı</label>
                <input type="number" style={S.input} value={form.vardiyaSayisi} onChange={(e) => formDegistir("vardiyaSayisi", e.target.value)} min={1} max={3} />
              </div>
              <div>
                <label style={S.label}>Vardiya Saati</label>
                <input type="number" style={S.input} value={form.vardiyaSaati} onChange={(e) => formDegistir("vardiyaSaati", e.target.value)} min={1} max={24} />
              </div>
              <div>
                <label style={S.label}>Ürün Türü</label>
                <input style={S.input} value={form.urunTuru} onChange={(e) => formDegistir("urunTuru", e.target.value)} placeholder="Granül PE" />
              </div>
              {/* Çalışma günleri */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Çalışma Günleri</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {gunAdi.map((g, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Inter', sans-serif" }}>
                      <input type="checkbox" checked={form.calismaGunleri.includes(i)} onChange={() => gunToggle(i)} />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
              {/* Notlar */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>Notlar</label>
                <textarea style={{ ...S.input, height: 60, resize: "vertical" }} value={form.notlar} onChange={(e) => formDegistir("notlar", e.target.value)} />
              </div>
            </div>

            {/* Live preview */}
            {formCalismaDays > 0 && (
              <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "var(--surface-container-low)", borderRadius: "0.75rem", fontSize: "0.85rem", color: "var(--enba-dark)", fontWeight: 600 }}>
                {formCalismaDays} çalışma günü
                {gunlukHedefPreview && ` — günlük ${gunlukHedefPreview} ton hedef`}
                {form.verimOrani && gunlukHedefPreview && ` — günlük ${(Number(gunlukHedefPreview) / (form.verimOrani / 100)).toFixed(2)} ton hammadde gerekli`}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button style={S.btn("navy")} onClick={planKaydet}>Kaydet</button>
              <button style={S.btn("gray")} onClick={() => { setFormAcik(false); setDuzenlenenId(null); setForm(bosForm); }}>İptal</button>
            </div>
          </div>
        )}

        {/* Plan cards */}
        {planlar.length === 0 && (
          <div style={{ ...S.kart, textAlign: "center", color: "var(--on-surface-variant)", padding: "2rem" }}>
            Henüz plan oluşturulmamış.
          </div>
        )}
        {planlar.map((plan) => {
          const calismaDays = calismaDaysHesapla(plan);
          const toplamActuel = calismaDays.reduce((s, t) => s + (aktuellerByTarih[t]?.cikan || 0), 0);
          const oran = plan.hedefCikanTon > 0 ? (toplamActuel / plan.hedefCikanTon) * 100 : 0;
          const secili = aktifPlanId === plan.id;
          return (
            <div key={plan.id} style={{ ...S.kart, borderLeft: `4px solid ${secili ? "var(--enba-orange)" : "var(--enba-dark)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--enba-dark)" }}>{plan.baslik}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)", marginTop: "0.2rem" }}>
                    {plan.baslangicTarihi} – {plan.bitisTarihi} &nbsp;|&nbsp; {plan.urunTuru || "—"} &nbsp;|&nbsp; {calismaDays.length} çalışma günü
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button style={S.btn(secili ? "green" : "navy")} onClick={() => { setAktifPlanId(plan.id); setAktifTab(1); }}>
                    {secili ? "✓ Seçili" : "Seç"}
                  </button>
                  <button style={S.btn("gray")} onClick={() => planDuzenle(plan)}>Düzenle</button>
                  <button style={S.btn("red")} onClick={() => { if (window.confirm("Bu planı silmek istiyor musunuz?")) planSil(plan.id); }}>Sil</button>
                </div>
              </div>
              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar oran={oran} />
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {toplamActuel.toFixed(1)} / {plan.hedefCikanTon} ton &nbsp;(%{oran.toFixed(1)})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // TAB 2 — GÜNLÜK HEDEFLER
  // ════════════════════════════════════════════════════════════
  const Tab2GunlukHedefler = () => {
    if (!seciliPlan) return PlanSecUyarisi();

    const p = seciliPlan;
    const tumGunler = tarihAraligi(p.baslangicTarihi, p.bitisTarihi);
    const calismaDays = calismaDaysHesapla(p);
    const ozelMap = {};
    (p.ozelGunler || []).forEach((g) => { ozelMap[g.tarih] = g; });
    const gunlukHedef = calismaDays.length > 0 ? p.hedefCikanTon / calismaDays.length : 0;
    const gunlukGiren = p.verimOrani > 0 ? gunlukHedef / (p.verimOrani / 100) : 0;
    const tatilSayisi = (p.ozelGunler || []).length;

    // Totals
    let totalHedefGiren = 0, totalHedefCikan = 0, totalGercGiren = 0, totalGercCikan = 0;

    const satirlar = tumGunler.map((tarih) => {
      const dow = new Date(tarih + "T00:00:00").getDay();
      const calisan = calismaDays.includes(tarih);
      const ozel = ozelMap[tarih];
      const aktuel = aktuellerByTarih[tarih];
      const gecmis = tarih < bugun;
      const bugunmu = tarih === bugun;

      let turText = ozel ? (ozel.tur === "tatil" ? "Tatil" : "Bakım") : (calisan ? (bugunmu ? "Bugün" : "Çalışma") : "Çalışma Dışı");
      let hedefGiren = calisan ? gunlukGiren : 0;
      let hedefCikan = calisan ? gunlukHedef : 0;
      let gercGiren = aktuel?.giren || 0;
      let gercCikan = aktuel?.cikan || 0;
      let sapma = calisan ? gercCikan - hedefCikan : null;
      let verimPct = gercGiren > 0 ? (gercCikan / gercGiren) * 100 : null;

      if (calisan) { totalHedefGiren += hedefGiren; totalHedefCikan += hedefCikan; }
      totalGercGiren += gercGiren;
      totalGercCikan += gercCikan;

      // Durum
      let durum = "Planlandı";
      if (ozel) durum = ozel.tur === "tatil" ? "Tatil" : "Bakım";
      else if (!calisan) durum = "Çalışma Dışı";
      else if (gecmis || bugunmu) {
        if (!aktuel) durum = gecmis ? "Veri Yok" : "Planlandı";
        else {
          const pct = hedefCikan > 0 ? (gercCikan / hedefCikan) * 100 : 100;
          durum = pct >= 95 ? "Hedefte" : pct >= 80 ? "Yakın" : "Hedef Altı";
        }
      }

      // Row background
      let rowBg = null;
      if (ozel) rowBg = "rgba(255,243,224,0.55)";
      else if (!calisan) rowBg = "var(--surface-container-high)";

      return { tarih, dow, calisan, ozel, aktuel, gecmis, bugunmu, turText, hedefGiren, hedefCikan, gercGiren, gercCikan, sapma, verimPct, durum, rowBg };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Plan info */}
        <div style={{ ...S.kart, borderLeft: "4px solid var(--enba-orange)" }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--enba-dark)" }}>{p.baslik}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--on-surface-variant)", marginTop: "0.2rem" }}>
            {p.baslangicTarihi} – {p.bitisTarihi} &nbsp;|&nbsp; Hedef: <b>{p.hedefCikanTon} ton</b> &nbsp;|&nbsp; Ürün: {p.urunTuru || "—"}
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <KPIKart baslik="Toplam Çalışma Günü" deger={calismaDays.length} alt="planlanmış" />
          <KPIKart baslik="Günlük Hedef Çıkan" deger={gunlukHedef.toFixed(2) + " ton"} alt="çalışma günü başına" />
          <KPIKart baslik="Günlük Hedef Giren" deger={gunlukGiren.toFixed(2) + " ton"} alt={`%${p.verimOrani} verim ile`} />
          <KPIKart baslik="Tatil / Bakım Günü" deger={tatilSayisi} alt="özel gün" renk="#ef6c00" />
        </div>

        {/* Ozel gun inline form */}
        {ozelGunForm && (
          <div style={{ ...S.kart, borderLeft: "4px solid #ef6c00", padding: "1rem 1.25rem" }}>
            <b style={{ fontFamily: "'Manrope', sans-serif", fontSize: "0.9rem" }}>{ozelGunForm} tarihine özel gün ekle</b>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={S.label}>Tür</label>
                <select style={{ ...S.input, width: "auto" }} value={ozelFormData.tur} onChange={(e) => setOzelFormData((prev) => ({ ...prev, tur: e.target.value }))}>
                  <option value="tatil">Tatil</option>
                  <option value="bakim">Bakım</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={S.label}>Not</label>
                <input style={S.input} value={ozelFormData.not} onChange={(e) => setOzelFormData((prev) => ({ ...prev, not: e.target.value }))} placeholder="Açıklama" />
              </div>
              <button style={S.btn("navy")} onClick={() => ozelGunEkle(p.id, ozelGunForm, ozelFormData.tur, ozelFormData.not)}>Kaydet</button>
              <button style={S.btn("gray")} onClick={() => setOzelGunForm(null)}>İptal</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: "auto", borderRadius: "1rem", border: "1px solid var(--surface-container-highest)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                {["Tarih", "Gün", "Tür", "Hdf. Giren (t)", "Hdf. Çıkan (t)", "Ger. Giren (t)", "Ger. Çıkan (t)", "Sapma (t)", "Verim %", "Durum", ""].map((h, i) => (
                  <th key={i} style={{ ...S.thStyle, textAlign: i >= 3 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s, i) => (
                <tr key={s.tarih} style={{ background: s.rowBg || (i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)"), opacity: s.calisan || s.ozel ? 1 : 0.75 }}>
                  <td style={{ ...S.tdStyle(i), fontWeight: s.bugunmu ? 700 : 400 }}>{s.tarih}</td>
                  <td style={S.tdStyle(i)}>{gunAdiTam[s.dow]}</td>
                  <td style={S.tdStyle(i)}>{s.turText}</td>
                  <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{s.calisan ? s.hedefGiren.toFixed(2) : "—"}</td>
                  <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{s.calisan ? s.hedefCikan.toFixed(2) : "—"}</td>
                  <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{s.gercGiren > 0 ? s.gercGiren.toFixed(2) : "—"}</td>
                  <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{s.gercCikan > 0 ? s.gercCikan.toFixed(2) : "—"}</td>
                  <td style={{ ...S.tdStyle(i), textAlign: "right", color: s.sapma === null ? undefined : s.sapma >= 0 ? "#1b5e20" : "#b71c1c", fontWeight: 600 }}>
                    {s.sapma !== null ? (s.sapma >= 0 ? "+" : "") + s.sapma.toFixed(2) : "—"}
                  </td>
                  <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{s.verimPct !== null ? s.verimPct.toFixed(1) + "%" : "—"}</td>
                  <td style={S.tdStyle(i)}><DurumBadge durum={s.durum} /></td>
                  <td style={S.tdStyle(i)}>
                    {s.ozel
                      ? <button style={{ ...S.btn("gray"), padding: "0.2rem 0.5rem", fontSize: "0.72rem" }} onClick={() => ozelGunSil(p.id, s.tarih)}>Kaldır</button>
                      : <button style={{ ...S.btn("gray"), padding: "0.2rem 0.5rem", fontSize: "0.72rem" }} onClick={() => { setOzelGunForm(s.tarih); setOzelForm({ tur: "tatil", not: "" }); }}>⊕</button>
                    }
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ background: "var(--enba-dark)", color: "#fff", fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: "0.6rem 0.75rem", fontFamily: "'Manrope', sans-serif", fontSize: "0.82rem" }}>TOPLAM</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>{totalHedefGiren.toFixed(2)}</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>{totalHedefCikan.toFixed(2)}</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>{totalGercGiren.toFixed(2)}</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>{totalGercCikan.toFixed(2)}</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem", color: totalGercCikan - totalHedefCikan >= 0 ? "#b9f6ca" : "#ffcdd2" }}>
                  {(totalGercCikan - totalHedefCikan >= 0 ? "+" : "") + (totalGercCikan - totalHedefCikan).toFixed(2)}
                </td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>
                  {totalGercGiren > 0 ? ((totalGercCikan / totalGercGiren) * 100).toFixed(1) + "%" : "—"}
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // TAB 3 — GERÇEKLEŞİM ÖZETİ
  // ════════════════════════════════════════════════════════════
  const Tab3Ozet = () => {
    if (!seciliPlan) return PlanSecUyarisi();

    const p = seciliPlan;
    const calismaDays = calismaDaysHesapla(p);
    const gunlukHedef = calismaDays.length > 0 ? p.hedefCikanTon / calismaDays.length : 0;

    // Past working days
    const gecmisCalisma = calismaDays.filter((t) => t <= bugun);
    const veriEksikSayisi = gecmisCalisma.filter((t) => !aktuellerByTarih[t]).length;

    // Totals
    const toplamGercCikan = calismaDays.reduce((s, t) => s + (aktuellerByTarih[t]?.cikan || 0), 0);
    const toplamGercGiren = calismaDays.reduce((s, t) => s + (aktuellerByTarih[t]?.giren || 0), 0);
    const hedefOrani = p.hedefCikanTon > 0 ? (toplamGercCikan / p.hedefCikanTon) * 100 : 0;
    const ortalamaVerim = toplamGercGiren > 0 ? (toplamGercCikan / toplamGercGiren) * 100 : 0;

    // Weekly breakdown
    const haftaMap = {};
    calismaDays.forEach((tarih) => {
      const d = new Date(tarih + "T00:00:00");
      // ISO week: year-WNN
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-H${weekNum}`;
      if (!haftaMap[key]) haftaMap[key] = { hedef: 0, gercCikan: 0, gercGiren: 0, label: key };
      haftaMap[key].hedef += gunlukHedef;
      haftaMap[key].gercCikan += aktuellerByTarih[tarih]?.cikan || 0;
      haftaMap[key].gercGiren += aktuellerByTarih[tarih]?.giren || 0;
    });
    const haftalar = Object.values(haftaMap);

    // SVG bar chart for weekly comparison
    const chartW = 500, chartH = 120, barW = 20, gap = 10;
    const maxVal = Math.max(...haftalar.map((h) => Math.max(h.hedef, h.gercCikan)), 1);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* KPI Cards */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <KPIKart baslik="Toplam Gerçekleşen Çıkan" deger={toplamGercCikan.toFixed(1) + " ton"} renk={toplamGercCikan >= p.hedefCikanTon ? "var(--enba-orange)" : undefined} />
          <KPIKart baslik="Hedef Gerçekleşme" deger={"%" + hedefOrani.toFixed(1)} renk={hedefOrani >= 95 ? "#1b5e20" : hedefOrani >= 80 ? "#bf360c" : "#b71c1c"} />
          <KPIKart baslik="Ortalama Günlük Verim" deger={"%" + ortalamaVerim.toFixed(1)} alt={`hedef: %${p.verimOrani}`} />
          <KPIKart baslik="Veri Eksik Gün" deger={veriEksikSayisi} alt="geçmiş çalışma günü" renk={veriEksikSayisi > 0 ? "#c62828" : "#2e7d32"} />
        </div>

        {/* Missing data alert */}
        {veriEksikSayisi > 0 && (
          <div style={{ background: "#fff3e0", border: "1px solid #ef6c00", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#e65100", fontWeight: 600 }}>
            ⚠ {veriEksikSayisi} geçmiş çalışma günü için üretim verisi girilmemiş. Üretim Takip Modülü'nden veri ekleyebilirsiniz.
          </div>
        )}

        {/* SVG bar chart */}
        {haftalar.length > 0 && (
          <div style={{ ...S.kart }}>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--enba-dark)" }}>Haftalık Üretim Karşılaştırması</div>
            <div style={{ overflowX: "auto" }}>
              <svg width={Math.max(chartW, haftalar.length * (barW * 2 + gap + 10) + 40)} height={chartH + 50} style={{ display: "block" }}>
                {haftalar.map((h, i) => {
                  const x = 30 + i * (barW * 2 + gap + 10);
                  const hedefH = (h.hedef / maxVal) * chartH;
                  const gercH = (h.gercCikan / maxVal) * chartH;
                  return (
                    <g key={h.label}>
                      {/* Hedef bar */}
                      <rect x={x} y={chartH - hedefH} width={barW} height={hedefH} fill="#90a4ae" rx={3} />
                      {/* Gerçekleşen bar */}
                      <rect x={x + barW + 2} y={chartH - gercH} width={barW} height={gercH}
                        fill={h.gercCikan >= h.hedef * 0.95 ? "#43a047" : h.gercCikan >= h.hedef * 0.80 ? "#fb8c00" : "#e53935"} rx={3} />
                      {/* Label */}
                      <text x={x + barW + 1} y={chartH + 15} textAnchor="middle" fontSize={9} fill="var(--on-surface-variant)" fontFamily="Inter, sans-serif">{h.label}</text>
                    </g>
                  );
                })}
                {/* Legend */}
                <rect x={30} y={chartH + 28} width={10} height={10} fill="#90a4ae" rx={2} />
                <text x={44} y={chartH + 37} fontSize={9} fill="var(--on-surface-variant)" fontFamily="Inter, sans-serif">Hedef</text>
                <rect x={90} y={chartH + 28} width={10} height={10} fill="#43a047" rx={2} />
                <text x={104} y={chartH + 37} fontSize={9} fill="var(--on-surface-variant)" fontFamily="Inter, sans-serif">Gerçekleşen</text>
              </svg>
            </div>
          </div>
        )}

        {/* Weekly table */}
        <div style={{ overflowX: "auto", borderRadius: "1rem", border: "1px solid var(--surface-container-highest)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            <thead>
              <tr>
                {["Hafta", "Hedef (ton)", "Gerçekleşen (ton)", "Oran %", "Verim %"].map((h, i) => (
                  <th key={i} style={{ ...S.thStyle, textAlign: i > 0 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {haftalar.map((h, i) => {
                const oran = h.hedef > 0 ? (h.gercCikan / h.hedef) * 100 : 0;
                const verim = h.gercGiren > 0 ? (h.gercCikan / h.gercGiren) * 100 : 0;
                return (
                  <tr key={h.label}>
                    <td style={S.tdStyle(i)}>{h.label}</td>
                    <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{h.hedef.toFixed(2)}</td>
                    <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{h.gercCikan.toFixed(2)}</td>
                    <td style={{ ...S.tdStyle(i), textAlign: "right", color: oran >= 95 ? "#1b5e20" : oran >= 80 ? "#bf360c" : "#b71c1c", fontWeight: 600 }}>
                      {oran.toFixed(1)}%
                    </td>
                    <td style={{ ...S.tdStyle(i), textAlign: "right" }}>{verim > 0 ? verim.toFixed(1) + "%" : "—"}</td>
                  </tr>
                );
              })}
              {/* Totals */}
              <tr style={{ background: "var(--enba-dark)", color: "#fff", fontWeight: 700 }}>
                <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.82rem", fontFamily: "'Manrope', sans-serif" }}>TOPLAM</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>{p.hedefCikanTon}</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>{toplamGercCikan.toFixed(2)}</td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem", color: hedefOrani >= 95 ? "#b9f6ca" : "#ffcdd2" }}>
                  {hedefOrani.toFixed(1)}%
                </td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontSize: "0.82rem" }}>
                  {ortalamaVerim > 0 ? ortalamaVerim.toFixed(1) + "%" : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  const tablar = ["Planlar", "Günlük Hedefler", "Gerçekleşme Özeti"];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "var(--enba-dark)", margin: 0 }}>
          Üretim Planlama
        </h1>
        {seciliPlan && (
          <div style={{ fontSize: "0.82rem", color: "var(--on-surface-variant)", marginTop: "0.3rem" }}>
            Seçili plan: <b>{seciliPlan.baslik}</b>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", background: "var(--surface-container-low)", padding: "0.35rem", borderRadius: "2rem", width: "fit-content" }}>
        {tablar.map((t, i) => (
          <button key={i} style={S.tab(aktifTab === i)} onClick={() => setAktifTab(i)}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {aktifTab === 0 && Tab1Planlar()}
      {aktifTab === 1 && Tab2GunlukHedefler()}
      {aktifTab === 2 && Tab3Ozet()}
    </div>
  );
};

// Export to global scope for the host app
window.UretimPlanlamaModulu = UretimPlanlamaModulu;

