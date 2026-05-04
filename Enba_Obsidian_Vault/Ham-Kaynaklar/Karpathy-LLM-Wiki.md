# Karpathy — LLM Wiki Pattern

**Kaynak:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
**Eklenme:** 2026-05-04
**Tip:** Mimari makale
**Yıldız:** 5000+

---

## Özet

RAG sistemleri her sorguda sıfırdan bilgi çeker — birikim olmaz. LLM-wiki pattern'inde LLM, ham kaynakları okuyarak kalıcı ve büyüyen bir wiki inşa eder ve bakımını yapar. Bilgi bir kez derlenir, güncel tutulur.

---

## Üç Katman

**Ham Kaynaklar** — değişmez kaynak dökümanlar (LLM okur, yazmaz)
**Wiki** — LLM'in üretip güncellediği markdown sayfaları (sen okursun)
**Schema (CLAUDE.md)** — wiki kuralları ve workflow talimatları

---

## Temel Operasyonlar

**Ingest:** Yeni kaynak → LLM okur → özet sayfası yazar → ilgili 10-15 sayfayı günceller → index ve log'a ekler

**Query:** Soru → index okunur → ilgili sayfalar bulunur → sentez üretilir → **cevap wiki'ye yeni sayfa olarak kaydedilebilir**

**Lint:** Çelişkiler, orphan sayfalar, stale bilgiler, eksik kavramlar tespit edilir

---

## index.md ve log.md

**index.md** — içerik kataloğu. LLM her sorguda önce bunu okur, ilgili sayfaları bulur.
**log.md** — append-only kronoloji. `## [tarih] tip | başlık` formatı. `grep "^## \[" log.md | tail -5` ile son 5 giriş.

---

## Enba'ya Uyarlama Notları

- CLAUDE.md → schema görevi görüyor
- Obsidian → wiki IDE
- Claude Code → wiki programcısı
- Her modül geliştirmesi sonrası ilgili Moduller/ sayfası güncellenmeli
- Önemli kararlar Kararlar/ sayfalarına kaydedilmeli
- Haftalık lint önerilen

---

## İlgili Sayfalar

- [[Kaynaklar/Claude-Code-Entegrasyon]]
- [[Kararlar/Mimari-Kararlar]]
- [[index]]
