# Paraşüt Entegrasyonu Araştırma Notları

## Paraşüt API v4 Genel Bakış
- **Base URL**: `https://api.parasut.com/v4/<company_id>`
- **Kimlik Doğrulama**: OAuth2 (Client ID, Client Secret, Username, Password veya Auth Code).
- **Format**: JSON:API (spec uyumlu).

## Entegre Edilecek Veri Modelleri
1. **Kişiler (Contacts)**:
   - Tedarikçiler ve Müşteriler Paraşüt tarafında "Contact" olarak tutulur.
   - Enba tarafındaki `tedarikciler` ve `musteriler` listeleri buraya senkronize edilmelidir.
2. **Satış Faturaları (Sales Invoices)**:
   - Müşteri bazlı gelir kalemleri (Kod: 109) satış faturası olarak gönderilebilir.
3. **Alış Faturaları (Purchase Invoices)**:
   - Tedarikçi bazlı gider kalemleri (Kod: 305 vb.) alış faturası olarak gönderilebilir.
4. **Ödemeler (Payments)**:
   - `payments-module.jsx` içindeki tahsilat ve ödeme kayıtları ilgili faturalara bağlanmalıdır.

## Teknik Gereksinimler
- **CORS**: Tarayıcı tabanlı uygulamalarda Paraşüt API'sine doğrudan erişim CORS politikaları nedeniyle kısıtlanmış olabilir. Bir ara sunucu (proxy) gerekebilir.
- **Güvenlik**: Client Secret tarayıcı tarafında saklanmamalıdır. Ancak kullanıcı bu uygulamayı sadece yerel/kendi kullanımı için çalıştırıyorsa `localStorage` üzerinde şifreli saklama bir seçenek olabilir.

## Uygulama Planı Taslağı
1. **Ayarlar Sayfası**: API anahtarları ve Firma ID girişi.
2. **Servis Katmanı**: `parasut-service.js` ile API çağrılarının soyutlanması.
3. **Senkronizasyon Butonları**: Listelere "Paraşüt'e Gönder" butonu eklenmesi.
4. **Durum Takibi**: Gönderilen kayıtların ID'lerinin Enba verisi içine kaydedilmesi (çift kayıt önleme).
