/**
 * Supabase Veri Servisi (Data Layer)
 * Uygulamanın localStorage ile olan bağını kesip asenkron veritabanı işlemlerine geçişi sağlar.
 */

window.DataService = {
    /**
     * Oturum kontrolü ve aktif kullanıcı bilgisi
     */
    async getCurrentUser() {
        if (!window.supabaseClient) return null;
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error || !session) return null;
        return session.user;
    },

    /**
     * Kayıt Getirme (Genel)
     */
    async fetchData(table, select = '*') {
        if (!window.supabaseClient) return [];
        const { data, error } = await window.supabaseClient
            .from(table)
            .select(select);
            
        if (error) {
            console.error(`${table} verisi çekilemedi:`, error);
            throw error; // Artık boş array dönmüyor, hata fırlatıyor
        }
        return data || [];
    },

    /**
     * Stoka ait alış kayıtlarını getir (stock_records) + Mapping
     */
    async getAlislar() {
        const data = await this.fetchData('stock_records', '*');
        return data.map(r => ({
            id: r.id, tarih: r.tarih, tedarikciAdi: r.tedarikci_adi, hammaddeTuru: r.hammadde_turu,
            brutMiktar: r.brut_miktar, netMiktar: r.net_miktar, alisFiyati: r.alis_fiyati,
            nakliyeBedeli: r.nakliye_bedeli, ymFire: r.ym_fire, nemFire: r.nem_fire,
            birimMaliyet: r.birim_maliyet, notlar: r.notlar
        }));
    },

    /**
     * Satış kayıtlarını getir (sales_records) + Mapping
     */
    async getSatislar() {
        const data = await this.fetchData('sales_records', '*');
        return data.map(r => ({
            id: r.id, tarih: r.tarih, musteriAdi: r.musteri_adi, stokTuru: r.stok_turu,
            hammadde_turu: r.hammadde_turu, mamul_turu: r.mamul_turu, miktar: r.miktar,
            satisFiyati: r.satis_fiyati, nakliyeBedeli: r.nakliye_bedeli, notlar: r.notlar
        }));
    },

    /**
     * Tedarikçileri ve Müşterileri Getir (contacts)
     */
    async getTedarikciler() {
        if (!window.supabaseClient) return [];
        const { data, error } = await window.supabaseClient.from('contacts').select('*').eq('contact_type', 'supplier');
        if (error) throw error;
        return data || [];
    },

    async getMusteriler() {
        if (!window.supabaseClient) return [];
        const { data, error } = await window.supabaseClient.from('contacts').select('*').eq('contact_type', 'customer');
        if (error) throw error;
        return data || [];
    },

    /**
     * Kayıt Ekleme (Genel + Özel Maplemeler)
     */
    async insertData(table, payload) {
        if (!window.supabaseClient) return null;
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        let p = { 
            ...payload, 
            user_id: session?.user?.id || null,
            created_at: new Date().toISOString()
        };

        // Tablo bazlı özel alan eşleşmeleri (Snake case dönüşümü)
        if (table === 'stock_records') {
            p = {
                ...p,
                tedarikci_adi: payload.tedarikciAdi,
                hammadde_turu: payload.hammaddeTuru,
                brut_miktar: payload.brutMiktar,
                net_miktar: payload.netMiktar,
                alis_fiyati: payload.alisFiyati,
                nakliye_bedeli: payload.nakliyeBedeli,
                ym_fire: payload.ymFire,
                nem_fire: payload.nemFire,
                birim_maliyet: payload.birimMaliyet
            };
        } else if (table === 'sales_records') {
            p = {
                ...p,
                musteri_adi: payload.musteriAdi,
                stok_turu: payload.stokTuru,
                hammadde_turu: payload.hammaddeTuru,
                mamul_turu: payload.mamulTuru,
                miktar: payload.miktar,
                satis_fiyati: payload.satisFiyati,
                nakliye_bedeli: payload.nakliyeBedeli
            };
        }

        const { data, error } = await window.supabaseClient
            .from(table)
            .insert([p])
            .select();

        if (error) throw error;
        return data?.[0];
    },

    /**
     * Güncelleme (Genel + Özel Maplemeler)
     */
    async updateData(table, id, payload) {
        if (!window.supabaseClient) return null;
        
        let p = { ...payload, updated_at: new Date().toISOString() };

        if (table === 'stock_records') {
            p = {
                ...p,
                tedarikci_adi: payload.tedarikciAdi,
                hammadde_turu: payload.hammaddeTuru,
                brut_miktar: payload.brutMiktar,
                net_miktar: payload.netMiktar,
                alis_fiyati: payload.alisFiyati,
                nakliye_bedeli: payload.nakliyeBedeli,
                ym_fire: payload.ymFire,
                nem_fire: payload.nemFire,
                birim_maliyet: payload.birimMaliyet
            };
        } else if (table === 'sales_records') {
            p = {
                ...p,
                musteri_adi: payload.musteriAdi,
                stok_turu: payload.stokTuru,
                hammadde_turu: payload.hammaddeTuru,
                mamul_turu: payload.mamulTuru,
                miktar: payload.miktar,
                satis_fiyati: payload.satisFiyati,
                nakliye_bedeli: payload.nakliyeBedeli
            };
        }

        const { data, error } = await window.supabaseClient
            .from(table)
            .update(p)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data?.[0];
    },

    /**
     * İş Planlarını Getir (business_plans)
     */
    async getPlans() {
        if (!window.supabaseClient) return [];
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return [];

        const { data, error } = await window.supabaseClient
            .from('business_plans')
            .select('*')
            .or(`user_id.eq.${session.user.id},shared_with.cs.{${session.user.id}}`); // Kendi planları + ona paylaşılanlar

        if (error) {
            console.error("Planlar çekilemedi:", error);
            throw error;
        }
        return data || [];
    },

    /**
     * Plan Kaydet (Insert or Update)
     */
    async savePlan(planData) {
        if (!window.supabaseClient) return null;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        const payload = {
            user_id: session?.user?.id,
            plan_type: planData.plan_type || (planData.ayVerileri ? 'detailed' : 'fast'),
            status: planData.status || 'pending',
            title: planData.baslik || planData.title || 'Adsız Plan',
            content: planData,
            updated_at: new Date().toISOString()
        };

        // Eğer planın zaten bir UUID'si varsa güncelle, yoksa yeni oluştur
        if (planData.id && planData.id.length > 30) { // UUID check (simple)
            const { data, error } = await window.supabaseClient
                .from('business_plans')
                .update(payload)
                .eq('id', planData.id)
                .select();
            if (error) throw error;
            return data?.[0];
        } else {
            // Yeni kayıt
            delete planData.id; // Eski string ID'yi kaldır
            const { data, error } = await window.supabaseClient
                .from('business_plans')
                .insert([{ ...payload, created_at: new Date().toISOString() }])
                .select();
            if (error) throw error;
            return data?.[0];
        }
    },

    /**
     * Ayar Getir (app_settings)
     */
    async getSetting(key, defaultValue = null) {
        if (!window.supabaseClient) return defaultValue;
        const { data, error } = await window.supabaseClient
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .single();
        
        if (error || !data) return defaultValue;
        return data.value;
    },

    /**
     * Ayar Güncelle
     */
    async updateSetting(key, value) {
        if (!window.supabaseClient) return;
        const { error } = await window.supabaseClient
            .from('app_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) console.error(`Ayar (${key}) güncellenemedi:`, error);
    },

    /**
     * Personel Listesi (personnel)
     */
    async getPersonnel() {
        return this.fetchData('personnel', '*');
    },

    async savePerson(personData) {
        if (!window.supabaseClient) return null;
        const payload = {
            name: personData.name,
            position: personData.position,
            department: personData.department,
            salary: personData.salary,
            sgk_status: personData.sgkStatus,
            start_date: personData.startDate,
            updated_at: new Date().toISOString()
        };

        if (personData.id && personData.id.length > 30) {
            const { data, error } = await window.supabaseClient.from('personnel').update(payload).eq('id', personData.id).select();
            if (error) throw error;
            return data?.[0];
        } else {
            const { data, error } = await window.supabaseClient.from('personnel').insert([payload]).select();
            if (error) throw error;
            return data?.[0];
        }
    },

    /**
     * Puantaj (attendance)
     */
    async getAttendance() {
        return this.fetchData('attendance', '*');
    },

    async saveAttendance(attData) {
        if (!window.supabaseClient) return null;
        const payload = {
            person_id: attData.personId,
            month: Number(attData.month),
            year: Number(attData.year),
            work_hours: Number(attData.workHours),
            overtime_hours: Number(attData.overtimeHours),
            notes: attData.notes
        };
        const { data, error } = await window.supabaseClient.from('attendance').insert([payload]).select();
        if (error) throw error;
        return data?.[0];
    },

    /**
     * Ödemeler ve Borçlar
     */
    async getPayments() { return this.fetchData('personnel_payments', '*'); },
    async savePayment(payData) {
        if (!window.supabaseClient) return null;
        const { data, error } = await window.supabaseClient.from('personnel_payments').insert([
            { person_id: payData.personId, date: payData.date, amount: payData.amount, status: payData.status }
        ]).select();
        if (error) throw error;
        return data?.[0];
    },

    async getDebts() { return this.fetchData('personnel_debts', '*'); },
    async saveDebt(debtData) {
        if (!window.supabaseClient) return null;
        const { data, error } = await window.supabaseClient.from('personnel_debts').insert([
            { person_id: debtData.personId, date: debtData.date, amount: debtData.amount, type: debtData.type, description: debtData.description }
        ]).select();
        if (error) throw error;
        return data?.[0];
    },

    /**
     * Üretim Kayıtları (production_records)
     */
    async getProductionRecords() {
        return this.fetchData('production_records', '*');
    },

    async saveProductionRecord(rec) {
        if (!window.supabaseClient) return null;
        const payload = {
            tarih: rec.tarih,
            vardiya: rec.vardiya,
            baslama_saati: rec.baslamaSaati,
            bitis_saati: rec.bitisSaati,
            calisanlar: rec.calisanlar,
            giren_hammadde: rec.girenHammadde,
            cikan_urun: rec.cikanUrun,
            sayac_basi: rec.sayacBasi,
            sayac_sonu: rec.sayacSonu,
            fire_miktar: rec.fireMiktar,
            fire_oran: rec.fireOran,
            elektrik_sarfiyat: rec.elektrikSarfiyat,
            calisma_sure_saat: rec.calismaSureSaat
        };
        const { data, error } = await window.supabaseClient.from('production_records').insert([payload]).select();
        if (error) throw error;
        return data?.[0];
    },

    /**
     * Üretim Planları (production_plans)
     */
    async getProductionPlans() {
        return this.fetchData('production_plans', '*');
    },

    async saveProductionPlan(plan) {
        if (!window.supabaseClient) return null;
        const payload = {
            title: plan.baslik,
            start_date: plan.baslangicTarihi,
            end_date: plan.bitisTarihi,
            target_output: plan.hedefCikanTon,
            efficiency_rate: plan.verimOrani,
            shift_count: plan.vardiyaSayisi,
            shift_hours: plan.vardiyaSaati,
            working_days: plan.calismaGunleri,
            product_type: plan.urunTuru,
            special_days: plan.ozelGunler,
            notes: plan.notlar,
            updated_at: new Date().toISOString()
        };

        if (plan.id && plan.id.length > 30) {
            const { data, error } = await window.supabaseClient.from('production_plans').update(payload).eq('id', plan.id).select();
            if (error) throw error;
            return data?.[0];
        } else {
            const { data, error } = await window.supabaseClient.from('production_plans').insert([payload]).select();
            if (error) throw error;
            return data?.[0];
        }
    },

    /**
     * Nakit Akışı Parametreleri (cashflow_parameters)
     */
    async getCashFlowParams(planId) {
        if (!window.supabaseClient || !planId) return null;
        const { data, error } = await window.supabaseClient
            .from('cashflow_parameters')
            .select('parameters')
            .eq('plan_id', planId)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
            console.error("Nakit akışı parametreleri çekilemedi:", error);
            return null;
        }
        return data?.parameters || null;
    },

    async saveCashFlowParams(planId, parameters) {
        if (!window.supabaseClient || !planId) return null;
        const { data, error } = await window.supabaseClient
            .from('cashflow_parameters')
            .upsert({ 
                plan_id: planId, 
                parameters, 
                updated_at: new Date().toISOString() 
            }, { onConflict: 'plan_id' })
            .select();
        
        if (error) throw error;
        return data?.[0];
    },

    /**
     * Lojistik (logistics_records)
     */
    async getLogisticsRecords() {
        const data = await this.fetchData('logistics_records', '*');
        return data.map(r => ({
            id: r.id, tarih: r.tarih, aracPlaka: r.arac_plaka, kullanici: r.kullanici,
            baslangicKm: r.baslangic_km, bitisKm: r.bitis_km, farkKm: r.fark_km,
            guzergah: r.guzergah
        }));
    },

    async saveLogisticsRecord(record) {
        if (!window.supabaseClient) return null;
        const p = {
            tarih: record.tarih, arac_plaka: record.aracPlaka, kullanici: record.kullanici,
            baslangic_km: record.baslangicKm, bitis_km: record.bitisKm, fark_km: record.farkKm,
            guzergah: record.guzergah
        };
        const { data, error } = await window.supabaseClient.from('logistics_records').insert([p]).select();
        if (error) throw error;
        return data?.[0];
    },

    /**
     * Arşiv ve Lisans (arsiv_files, permit_records)
     */
    async getArsivFiles() {
        const data = await this.fetchData('arsiv_files', '*');
        return data.map(r => ({ ...r, yuklenmeTarihi: r.yuklenme_tarihi }));
    },

    async getPermits() {
        const data = await this.fetchData('permit_records', '*');
        return data.map(r => ({
            id: r.id, ad: r.ad, kurum: r.kurum, kategori: r.kategori,
            alinisTarihi: r.alinis_tarihi, yenilemeTarihi: r.yenileme_tarihi,
            isSuresiz: r.is_suresiz, maliyet: r.maliyet, fileId: r.file_id, fileName: r.file_name
        }));
    },

    async uploadFile(file, folder = 'general') {
        if (!window.supabaseClient) return null;
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${folder}/${fileName}`;
        
        const { data, error } = await window.supabaseClient.storage
            .from('enba_files')
            .upload(filePath, file);
        
        if (error) throw error;
        return { path: filePath, fullData: data };
    },

    async getFileUrl(path) {
        if (!window.supabaseClient || !path) return null;
        const { data } = window.supabaseClient.storage
            .from('enba_files')
            .getPublicUrl(path);
        return data.publicUrl;
    },

    async saveArsivFile(meta) {
        if (!window.supabaseClient) return null;
        const p = {
            ad: meta.ad, mime: meta.mime, boyut: meta.boyut, kategori: meta.kategori,
            etiketler: meta.etiketler || [], notlar: meta.notlar, storage_path: meta.storagePath,
            yuklenme_tarihi: meta.yuklenmeTarihi || new Date().toISOString()
        };
        const { data, error } = await window.supabaseClient.from('arsiv_files').upsert([p]).select();
        if (error) throw error;
        return data?.[0];
    },

    async savePermit(record) {
        if (!window.supabaseClient) return null;
        const p = {
            ad: record.ad, kurum: record.kurum, kategori: record.kategori,
            alinis_tarihi: record.alinisTarihi, yenileme_tarihi: record.yenilemeTarihi,
            is_suresiz: record.isSuresiz, maliyet: record.maliyet, 
            file_id: record.fileId, file_name: record.fileName
        };
        const { data, error } = await window.supabaseClient.from('permit_records').upsert([p]).select();
        if (error) throw error;
        return data?.[0];
    },

    // Migrasyon Motoru (IndexedDB & LocalStorage -> Supabase)
    async migrateLisansArsiv(onProgress) {
        if (!window.supabaseClient) return;
        
        const arsivMeta = JSON.parse(localStorage.getItem('enba_arsiv_meta') || '[]');
        const lisansMeta = JSON.parse(localStorage.getItem('enba_lisans_kayitlari') || '[]');
        
        if (arsivMeta.length === 0 && lisansMeta.length === 0) return;

        // 1. IndexedDB'den blobları yükle ve Storage'a at
        const idMap = {}; // localId -> dbId
        const openDB = () => new Promise((res, rej) => {
            const req = indexedDB.open('enba_arsiv', 1);
            req.onsuccess = e => res(e.target.result);
            req.onerror = rej;
        });

        try {
            const db = await openDB();
            for (let i = 0; i < arsivMeta.length; i++) {
                const meta = arsivMeta[i];
                if (onProgress) onProgress(`Dosya yükleniyor: ${meta.ad} (${i+1}/${arsivMeta.length})`);
                
                // Blob çek
                const blob = await new Promise(res => {
                    const tx = db.transaction('icerikler', 'readonly');
                    const req = tx.objectStore('icerikler').get(meta.id);
                    req.onsuccess = () => res(req.result?.blob);
                });

                let storagePath = null;
                if (blob) {
                    const { path } = await this.uploadFile(new File([blob], meta.ad, { type: meta.mime }), 'archive');
                    storagePath = path;
                }

                // DB'ye kaydet
                const savedFile = await this.saveArsivFile({
                    ...meta, storagePath, yuklenmeTarihi: meta.yuklenmeTarihi
                });
                idMap[meta.id] = savedFile.id;
            }

            // 2. Lisans kayıtlarını taşı (yeni file_id'ler ile)
            for (let i = 0; i < lisansMeta.length; i++) {
                const permit = lisansMeta[i];
                if (onProgress) onProgress(`Belge taşınıyor: ${permit.ad} (${i+1}/${lisansMeta.length})`);
                await this.savePermit({
                    ...permit,
                    fileId: idMap[permit.fileId] || null
                });
            }

            // 3. Başarılıysa yerel verileri temizle
            localStorage.removeItem('enba_arsiv_meta');
            localStorage.removeItem('enba_lisans_kayitlari');
            // IndexedDB temizliği (opsiyonel, güvenlik için kalsın veya silinsin)
            return true;
        } catch (err) {
            console.error("Migrasyon hatası:", err);
            throw err;
        }
    },

    /**
     * Silme (delete)
     */
    async deleteData(table, id) {
        if (!window.supabaseClient) return false;
        
        const { error } = await window.supabaseClient
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

