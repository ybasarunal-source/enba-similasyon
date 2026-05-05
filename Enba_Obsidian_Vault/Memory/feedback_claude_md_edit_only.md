---
name: CLAUDE.md sadece Edit ile güncellenir
description: CLAUDE.md dosyasını Write ile yeniden yazma — her zaman Edit kullan
type: feedback
---

CLAUDE.md dosyasını hiçbir zaman `Write` tool ile yeniden yazma. Her zaman `Edit` kullanarak ilgili bölümü güncelle veya yeni bölüm ekle.

**Why:** Dosya oturum protokolü, aktif görevler ve wiki kuralları gibi birikimli bilgi içeriyor. Write ile üstüne yazmak bu geçmişi siliyor. `/init` skill çalıştırıldığında bile aynı kural geçerli — skill "varsa geliştir" diyor, yeniden yaz değil.

**How to apply:** CLAUDE.md ile ilgili bir görev geldiğinde — ister `/init`, ister "CLAUDE.md güncelle" — önce `Read` ile oku, sonra `Edit` ile sadece değişen bölümü güncelle veya yeni bölüm ekle.
