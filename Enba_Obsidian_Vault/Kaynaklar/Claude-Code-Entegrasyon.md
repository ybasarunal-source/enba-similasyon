# 🤖 Claude Code + Obsidian Entegrasyon Kılavuzu

## Workflow Özeti

```
Obsidian Notları
      ↓
CLAUDE.md güncellenir (manuel veya yapıştırarak)
      ↓
Claude Code oturumu açılır → CLAUDE.md otomatik yüklenir
      ↓
Geliştirme yapılır
      ↓
Öğrenilenler Obsidian Günlük'e kaydedilir
      ↓
Önemli kararlar Kararlar/ klasörüne eklenir
```

---

## Her Oturum Başında (2 dakika)

1. **Obsidian'ı aç** → `Gunluk/` → bugünün notunu oluştur (`_Sablon-Gunluk.md`'yi kopyala)
2. **CLAUDE.md "Aktif Görevler"** bölümünü güncelle
3. **Antigravity'de** proje klasörünü aç → terminal'de `claude` yaz

---

## Her Oturum Sonunda (5 dakika)

1. Bugünkü günlük notuna öğrenilenleri yaz
2. Varsa yeni mimari karar → `Kararlar/` klasörüne ekle
3. Yeni snippet bulunduysa → `Snippets/` klasörüne ekle
4. `CLAUDE.md` "Aktif Görevler" bölümünü bir sonraki oturum için hazırla

---

## NotebookLM Döngüsü (haftada 1 kez önerilir)

1. Bu vault'taki tüm notları seç → export → NotebookLM'e yükle
2. NotebookLM'de "Proje Özet Notu" üret
3. Özeti `Kaynaklar/Proje-Ozet.md` olarak kaydet
4. `CLAUDE.md`'nin üst bölümüne yapıştır (mevcut içeriği silmeden)

---

## Token Tasarrufu İpuçları

| Senaryo | Ne Yapmalı |
|---------|-----------|
| Yeni Claude Code oturumu | CLAUDE.md otomatik yüklenir, özet verme |
| Uzun geçmişi özetleme | NotebookLM'e at, özet al, CLAUDE.md'ye ekle |
| Tekrar eden soru | Obsidian'da ara, cevabı Claude Code'a yapıştır |
| Yeni özellik geliştirme | Snippet'i Claude Code'a ver, sıfırdan sordurma |

---

## Obsidian Ayarları (Önerilen Eklentiler)

- **Templater** → Günlük not şablonu otomasyonu
- **Calendar** → Günlük notlara hızlı erişim
- **Dataview** → Görev listelerini otomatik topla
- **Git** → Vault'u otomatik yedekle (GitHub)
