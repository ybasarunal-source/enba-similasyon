INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M105', NULL, 'Yurt İçi Satışlar', 'Sales (gross) - Core Business ext.', false, 0, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M106', NULL, 'Yurt Dışı Satışlar (Grup)', 'Sales (gross) - Core Business affil.', false, 1, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M109', NULL, 'Brüt Satışlar Toplamı', 'Total Sales (gross) - Core Business', false, 2, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M139', NULL, 'Satıştan İadeler ve İndirimler', 'Reduction in Sales - Core Business', false, 3, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M149', NULL, 'Ticari Mal Satışları', 'Sales from trade goods (net)', false, 4, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M299', NULL, 'Net Satış Gelirleri (Ana Hesap Grubu)', 'NET REVENUE', false, 5, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M369', NULL, 'İlk Madde ve Malzeme / Direkt İlk Mad. Mal. Gid.', 'Material expenditure - TOTAL', false, 6, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M399', NULL, 'Brüt Katkı Payı / Brüt Kar', 'CONTRIBUTION', false, 7, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M405', NULL, 'Elektrik Enerjisi Giderleri', 'Power', false, 8, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M410', NULL, 'Isınma, Yakıt ve Buhar Giderleri', 'Fuels / Steam', false, 9, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M415', NULL, 'Su Tüketim Giderleri', 'Water', false, 10, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M419', NULL, 'Toplam Enerji ve Tüketim Giderleri', 'Energy consumption', false, 11, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M489', NULL, 'Brüt Personel Maaş ve Ücret Giderleri', 'Personnel expenses', false, 12, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M489.01', 'M489', 'SGK İşveren Payı Giderleri', 'Personnel SGK Employer Share', false, 13, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M489.02', 'M489', 'İşsizlik Sigortası İşveren Payı', 'Personnel Unemployment Ins.', false, 14, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M489.03', 'M489', 'Personel Yemek ve Mutfak Giderleri', 'Personnel Food & Catering', false, 15, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M489.04', 'M489', 'Personel Ulaşım ve Servis Giderleri', 'Personnel Shuttle & Transport', false, 16, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M509', NULL, 'Bakım ve Onarım Giderleri', 'Maintenance costs', false, 17, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M529', NULL, 'Çevre, Atık Yönetimi ve İSG Giderleri', 'Environmental costs', false, 18, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M604', NULL, 'Dışarıdan Sağlanan Üretim Hizmetleri', 'Third party services/leased pers. production', false, 19, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M605', NULL, 'Dışarıdan Sağlanan Personel Hizmetleri (Yönetim)', 'Third party services/leased pers. excl. prod.', false, 20, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M610', NULL, 'Kira Giderleri', 'Rental charges', false, 21, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M615', NULL, 'Seyahat ve Konaklama Giderleri', 'Travel expenses', false, 22, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M620', NULL, 'İletişim Giderleri', 'Communication exp.', false, 23, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M625', NULL, 'Danışmanlık, Hukuk ve Denetim Giderleri', 'Legal/audit/consultation costs', false, 24, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M630', NULL, 'Pazarlama ve Reklam Giderleri', 'Advertising/publicity costs', false, 25, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M635', NULL, 'Sigorta Giderleri', 'Insurances (excl. transport insurance)', false, 26, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M640', NULL, 'BT ve Yazılım Giderleri (Dış Kaynak)', 'IT-costs ext.', false, 27, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M641', NULL, 'Grup Şirketlerinden IT Giderleri', 'IT-costs affil.', false, 28, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M645', NULL, 'Holding Yönetim Gider Payı', 'Holding/Division/Admin. costs', false, 29, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M650', NULL, 'Banka ve Komisyon Giderleri', 'Bank charges', false, 30, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M655', NULL, 'Ticari Kambiyo Zararları', 'Loss from fx-differences excl. financing', false, 31, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M660', NULL, 'Diğer Genel Yönetim Giderleri', 'Other overhead costs', false, 32, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M665', NULL, 'Vergi, Resim, Harç Giderleri', 'Taxes and duties', false, 33, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M689', NULL, 'Diğer Olağandışı Gider ve Zararlar', 'Other expenditures', false, 34, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M739', NULL, 'Diğer Faaliyetlerden Gelirler', 'Other operating income - TOTAL', false, 35, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M759', NULL, 'Finansal Kiralama Giderleri', 'Leasing', false, 36, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M769', NULL, 'FAVÖK', 'EBITDA', false, 37, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M775', NULL, 'Maddi/Maddi Olmayan Duran Varlık Amortismanı', 'Ordinary depr. and amort. excl. goodwill', false, 38, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M780', NULL, 'Şerefiye Amortismanı', 'Ordinary amort. of goodwill', false, 39, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M785', NULL, 'Olağanüstü Amortisman ve Değer Düşüklüğü', 'Extraordinary depr. and amortization', false, 40, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M787', NULL, 'Kanunen Kabul Edilmeyen Giderler (Amortisman)', 'Depr. CurrA (exceeding convent. depr.)', false, 41, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M789', NULL, 'Toplam Amortisman Giderleri', 'Depreciation', false, 42, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M799', NULL, 'Faiz ve Vergi Öncesi Kar (EBIT)', 'EBIT', false, 43, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M800', NULL, 'İştiraklerden Temettü Gelirleri', 'Income investments (dividends)', false, 44, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M801', NULL, 'Bağlı Ortaklıklardan Temettü Gelirleri', 'Income investments (dividends) affil.', false, 45, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M805', NULL, 'Menkul Kıymet Gelirleri', 'Income other securities/investm.', false, 46, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M810', NULL, 'Verilen Uzun Vadeli Kredi Faiz Gelirleri', 'Income from long term loans', false, 47, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M815', NULL, 'Banka Faiz Gelirleri', 'Other interest income', false, 48, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M820', NULL, 'Diğer Finansal Gelirler', 'Other financial income', false, 49, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M827', NULL, 'Finansal Kambiyo Karları', 'FX-profits finance', false, 50, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M829', NULL, 'Toplam Finansal Gelirler', 'Financial Income', false, 51, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M835', NULL, 'Menkul Kıymet Satış Zararları', 'Expenses of FinA & securities CurrA', false, 52, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M845', NULL, 'Kısa Vadeli Kredi Faiz Giderleri', 'Interest expenses', false, 53, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M846', NULL, 'Grup İçi Faiz Giderleri', 'Interest expenses affil.', false, 54, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M850', NULL, 'Diğer Finansal Giderler', 'Other financial expenses', false, 55, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M857', NULL, 'Finansal Kambiyo Zararları', 'FX-losses finance', false, 56, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M859', NULL, 'Toplam Finansman Giderleri', 'Financial expenses', false, 57, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M869', NULL, 'Net Finansman Sonucu', 'FINANCIAL RESULT', false, 58, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M879', NULL, 'Olağan Faaliyet Karı/Zararı', 'RESULT OF ORDINARY ACTIVITIES', false, 59, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M885', NULL, 'Olağandışı Gelir ve Karlar', 'Extraordinary income', false, 60, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M887', NULL, 'Olağandışı Gider ve Zararlar', 'Extraordinary expenses', false, 61, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M889', NULL, 'Net Olağandışı Dönem Sonucu', 'Extraordinary result', false, 62, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M899', NULL, 'Vergi Öncesi Dönem Karı/Zararı', 'EBT', false, 63, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M909', NULL, 'Kurumlar Vergisi Karşılığı', 'Taxes on income', false, 64, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M910', NULL, 'Vergi Sonrası Net Dönem Karı/Zararı', 'RESULT AFTER TAXES', false, 65, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M915', NULL, 'Diğer Kanunen Kabul Edilmeyen Vergiler', 'Other taxes', false, 66, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M919', NULL, 'Dönem Net Karı veya Zararı', 'NET INCOME FOR THE PERIOD', false, 67, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M930', NULL, 'Özel Yedek Akçe Çözümü', 'Release of untaxed reserves', false, 68, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M955', NULL, 'Olağanüstü Yedek Akçe', 'Allocation to revenue reserves', false, 69, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M999', NULL, 'Nihai Net Kar', 'NET INCOME', false, 70, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;
