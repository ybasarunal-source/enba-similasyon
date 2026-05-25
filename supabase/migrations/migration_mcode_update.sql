INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M105', NULL, 'M105 - 600.01 - Yurt İçi Satışlar (3. Şahıslar)', 'Sales (gross) - Core Business ext.', false, 0, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M106', NULL, 'M106 - 601.01 - Yurt Dışı Satışlar (Grup Şirketleri)', 'Sales (gross) - Core Business affil.', false, 1, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M109', NULL, 'M109 - 600/601 - Brüt Satışlar Toplamı', 'Total Sales (gross) - Core Business', false, 2, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M115', NULL, 'M115 - 610.02 - Müşteri Primi / Ciro Primi (3. Şahıslar)', 'Customer Bonus', false, 3, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M116', NULL, 'M116 - 610.03 - Müşteri Primi – Grup Şirketleri', 'Customer Bonus affil.', false, 4, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M120', NULL, 'M120 - 121.01 / 128 - Alacak Talebi / Şüpheli Alacak (3. Şahıslar)', 'Claims', false, 5, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M121', NULL, 'M121 - 131.01 / 138 - Grup Şirketlerinden Alacak Talebi', 'Claims affil.', false, 6, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M125', NULL, 'M125 - 611.01 - Satış İskontosu (3. Şahıslar)', 'Discount', false, 7, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M126', NULL, 'M126 - 611.02 - Satış İskontosu – Grup Şirketleri', 'Discount affil.', false, 8, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M130', NULL, 'M130 - 612.01 - Navlun / Nakliye İadesi (3. Şahıslar)', 'Freight refund', false, 9, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M131', NULL, 'M131 - 612.02 - Navlun / Nakliye İadesi – Grup Şirketleri', 'Freight refund affil.', false, 10, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M139', NULL, 'M139 - 610.01 - Satıştan İadeler ve İndirimler (Toplam)', 'Reduction in Sales - Core Business', false, 11, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M145', NULL, 'M145 - 600.02 - Ticari Mal Satışları (3. Şahıslar)', 'Revenues from trade goods ext.', false, 12, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M146', NULL, 'M146 - 601.02 - Ticari Mal Satışları – Grup Şirketleri', 'Revenues from trade goods affil.', false, 13, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M149', NULL, 'M149 - 600.02 / 601.02 - Ticari Mal Satışları (Net)', 'Sales from trade goods (net)', false, 14, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M155', NULL, 'M155 - 649.01 - Diğer Satışlar – 3. Şahıslar (Net)', 'Other Sales (net) ext.', false, 15, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M156', NULL, 'M156 - 649.02 - Diğer Satışlar – Grup Şirketleri (Net)', 'Other Sales (net) affil.', false, 16, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M159', NULL, 'M159 - 649 - Diğer Satışlar Toplamı (Net)', 'Other Sales (net)', false, 17, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M179', NULL, 'M179 - 60/601/649 - Toplam Net Satışlar', 'TOTAL SALES (net)', false, 18, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M189', NULL, 'M189 - 711 / 152 - Yarı Mamul ve Mamul Stok Değişimi', 'Change in inventory', false, 19, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M199', NULL, 'M199 - 60x/649/711 - Faaliyet Gelirleri Toplamı', 'OPERATING INCOME', false, 20, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M209', NULL, 'M209 - 760.01 - Sevkiyat ve Nakliye Giderleri', 'Shipping expenses', false, 21, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M215', NULL, 'M215 - 760.05 - Depolama ve Antrepo Giderleri', 'Storage costs', false, 22, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M220', NULL, 'M220 - 760.10 - Gümrük Vergi ve Harçları', 'Customs duties', false, 23, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M225', NULL, 'M225 - 760.15 - Satış Komisyonları (3. Şahıslar)', 'Commissions', false, 24, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M226', NULL, 'M226 - 760.16 - Satış Komisyonları – Grup Şirketleri', 'Commissions affil.', false, 25, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M230', NULL, 'M230 - 760.20 - Nakliye Sigorta Giderleri', 'Transport insurance', false, 26, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M235', NULL, 'M235 - 760.25 - Satışa İlişkin Çeşitli Giderler', 'Incidental expenses', false, 27, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M240', NULL, 'M240 - 654.01 - Şüpheli Alacak Karşılık Gideri', 'Bad debts', false, 28, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M245', NULL, 'M245 - 760.99 - Diğer Satış Giderleri', 'Other sales expenses', false, 29, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M249', NULL, 'M249 - 760 - Toplam Satış Giderleri', 'Sales expenses', false, 30, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M299', NULL, 'M299 - 60 - Net Satış Gelirleri', 'NET REVENUE', false, 31, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M305', NULL, 'M305 - 150 / 710 - Hammadde ve Satın Alınan Parçalar', 'Raw mat. & bought products (purch. parts)', false, 32, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M310', NULL, 'M310 - 150.02 / 710.02 - Kimyasal Madde Giderleri', 'Chemicals', false, 33, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M315', NULL, 'M315 - 150.03 / 710.03 - Alet, Tel, Keçe ve Sarf Malzeme Giderleri', 'Cost of tools, wire, felt', false, 34, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M320', NULL, 'M320 - 150.04 / 730.10 - Diğer Yardımcı ve İşletme Malzemeleri', 'Other aux. and operation mat.', false, 35, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M325', NULL, 'M325 - 730.05 - Dışarıdan Sağlanan Üretim Hizmetleri / Fason', 'External production services', false, 36, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M339', NULL, 'M339 - 710/730 - Ana İş Kolu Malzeme Giderleri Toplamı', 'Material expenditure - Core Business', false, 37, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M349', NULL, 'M349 - 620 - Satılan Ticari Mallar Maliyeti', 'Material expenditures - Trade goods', false, 38, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M359', NULL, 'M359 - 730.99 - Diğer Malzeme Giderleri', 'Other Material expenditures', false, 39, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M369', NULL, 'M369 - 150/710/730 - Toplam Malzeme Giderleri', 'Material expenditure - TOTAL', false, 40, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M399', NULL, 'M399 - [Ara Toplam] - Brüt Katkı Payı / Brüt Kar', 'CONTRIBUTION', false, 41, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M405', NULL, 'M405 - 770.40 - Elektrik Enerjisi Giderleri', 'Power', false, 42, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M410', NULL, 'M410 - 770.41 - Isınma, Yakıt ve Buhar Giderleri', 'Fuels / Steam', false, 43, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M415', NULL, 'M415 - 770.42 - Su Tüketim Giderleri', 'Water', false, 44, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M419', NULL, 'M419 - 770.49 - Toplam Enerji ve Tüketim Giderleri', 'Energy consumption', false, 45, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M450', NULL, 'M450 - 770.01 - İşçi Ücretleri (Brüt)', 'Wages', false, 46, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M455', NULL, 'M455 - 770.02 - İşçi SGK İşveren Payı', 'Social security expenses wages', false, 47, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M460', NULL, 'M460 - 770.03 - Memur/Personel Maaşları (Brüt)', 'Salaries', false, 48, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M465', NULL, 'M465 - 770.04 - Memur/Personel SGK İşveren Payı', 'Social security expenses salaries', false, 49, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M470', NULL, 'M470 - 472 / 770.06 - Kıdem Tazminatı Gideri / Karşılığı', 'Severance expenses', false, 50, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M475', NULL, 'M475 - 770.07 - Emeklilik ve Bireysel Emeklilik Giderleri', 'Pension expenses', false, 51, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M480', NULL, 'M480 - 770.08 - Diğer Personel Sosyal Giderleri', 'Other benefit costs', false, 52, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M489', NULL, 'M489 - 770.01-08 - Toplam Personel Giderleri', 'Personnel expenses', false, 53, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M509', NULL, 'M509 - 770.20 - Bakım ve Onarım Giderleri', 'Maintenance costs', false, 54, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M529', NULL, 'M529 - 770.25 - Çevre, Atık Yönetimi ve İSG Giderleri', 'Environmental costs', false, 55, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M604', NULL, 'M604 - 730.05 - Dışarıdan Sağlanan Üretim Hizmetleri', 'Third party services/leased pers. production', false, 56, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M605', NULL, 'M605 - 770.06 - Dışarıdan Sağlanan Personel Hizmetleri (Yönetim)', 'Third party services/leased pers. excl. prod.', false, 57, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M610', NULL, 'M610 - 770.10 - Kira Giderleri', 'Rental charges', false, 58, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M615', NULL, 'M615 - 770.30 - Seyahat ve Konaklama Giderleri', 'Travel expenses', false, 59, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M620', NULL, 'M620 - 770.50 - İletişim Giderleri', 'Communication exp.', false, 60, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M625', NULL, 'M625 - 770.60 - Danışmanlık, Hukuk ve Denetim Giderleri', 'Legal/audit/consultation costs', false, 61, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M630', NULL, 'M630 - 760.20 - Pazarlama ve Reklam Giderleri', 'Advertising/publicity costs', false, 62, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M635', NULL, 'M635 - 770.70 - Sigorta Giderleri (Nakliye Hariç)', 'Insurances (excl. transport insurance)', false, 63, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M640', NULL, 'M640 - 770.80 - BT ve Yazılım Giderleri (Dış Kaynak)', 'IT-costs ext.', false, 64, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M641', NULL, 'M641 - 770.81 - Grup Şirketlerinden IT Giderleri', 'IT-costs affil.', false, 65, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M645', NULL, 'M645 - 770.90 - Holding Yönetim Gider Payı', 'Holding/Division/Admin. costs', false, 66, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M650', NULL, 'M650 - 653.01 - Banka ve Komisyon Giderleri', 'Bank charges', false, 67, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M655', NULL, 'M655 - 656.01 - Ticari Kambiyo Zararları', 'Loss from fx-differences excl. financing', false, 68, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M660', NULL, 'M660 - 770.99 - Diğer Genel Yönetim Giderleri', 'Other overhead costs', false, 69, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M665', NULL, 'M665 - 770.15 - Vergi, Resim, Harç Giderleri', 'Taxes and duties', false, 70, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M689', NULL, 'M689 - 770.98 - Diğer Olağandışı Gider ve Zararlar', 'Other expenditures', false, 71, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M705', NULL, 'M705 - 258 / 770 (-) - Öz Yapım Duran Varlık Aktivasyonu', 'Capitalization of own work', false, 72, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M710', NULL, 'M710 - 679.01 - Duran Varlık Satış Karı / Değer Artışı', 'Income disp.& write-up FA, excl. FinA', false, 73, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M711', NULL, 'M711 - 679.02 - Duran Varlık Satış Karı – Grup Şirketleri', 'Income disp.& write-up FA, excl. FinA aff.', false, 74, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M715', NULL, 'M715 - 644 - Karşılık İptalleri / Konusu Kalmayan Karşılıklar', 'Reversal of provisions', false, 75, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M720', NULL, 'M720 - 646.01 - Ticari Kambiyo Karları', 'Profits from fx-differences excl. finance', false, 76, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M725', NULL, 'M725 - 649.03 - Diğer Faaliyetlerden Gelirler (3. Şahıslar)', 'Other operating income', false, 77, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M726', NULL, 'M726 - 649.04 - Diğer Faaliyetlerden Gelirler – Grup Şirketleri', 'Other operating income affil.', false, 78, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M739', NULL, 'M739 - 649 - Diğer Faaliyet Gelirleri Toplamı', 'Other operating income - TOTAL', false, 79, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M759', NULL, 'M759 - 770.11 - Finansal Kiralama Giderleri', 'Leasing', false, 80, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M769', NULL, 'M769 - [Ara Toplam] - FAVÖK – Faiz/Amortisman/Vergi Öncesi Kar', 'EBITDA', false, 81, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M775', NULL, 'M775 - 770.75 - Maddi/Maddi Olmayan Varlık Amortismanı', 'Ordinary depr. and amort. excl. goodwill', false, 82, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M780', NULL, 'M780 - 770.76 - Şerefiye Amortismanı', 'Ordinary amort. of goodwill', false, 83, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M785', NULL, 'M785 - 658 - Olağanüstü Amortisman ve Değer Düşüklüğü', 'Extraordinary depr. and amortization', false, 84, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M787', NULL, 'M787 - 689 - Kanunen Kabul Edilmeyen Amortisman', 'Depr. CurrA (exceeding convent. depr.)', false, 85, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M789', NULL, 'M789 - 770/658 - Toplam Amortisman Giderleri', 'Depreciation', false, 86, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M799', NULL, 'M799 - [Ara Toplam] - Faiz ve Vergi Öncesi Kar (EBIT)', 'EBIT', false, 87, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M800', NULL, 'M800 - 640 - İştiraklerden Temettü Gelirleri', 'Income investments (dividends)', false, 88, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M801', NULL, 'M801 - 641 - Bağlı Ortaklıklardan Temettü Gelirleri', 'Income investments (dividends) affil.', false, 89, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M805', NULL, 'M805 - 642 - Menkul Kıymet Gelirleri (3. Şahıslar)', 'Income other securities/investm.', false, 90, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M806', NULL, 'M806 - 642.02 - Menkul Kıymet Gelirleri – Grup Şirketleri', 'Income other securities/investm. affil.', false, 91, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M810', NULL, 'M810 - 642.03 - Verilen Uzun Vadeli Kredi Faiz Gelirleri', 'Income from long term loans', false, 92, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M811', NULL, 'M811 - 642.04 - Grup Şirketlerine Verilen Kredi Faiz Gelirleri', 'Income from long term loans affil.', false, 93, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M815', NULL, 'M815 - 642.01 - Banka Faiz Gelirleri', 'Other interest income', false, 94, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M816', NULL, 'M816 - 642.05 - Grup Şirketlerinden Faiz Gelirleri', 'Other interest income affil.', false, 95, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M820', NULL, 'M820 - 649.05 - Diğer Finansal Gelirler (3. Şahıslar)', 'Other financial income', false, 96, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M821', NULL, 'M821 - 649.06 - Diğer Finansal Gelirler – Grup Şirketleri', 'Other financial income affil.', false, 97, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M825', NULL, 'M825 - 645 - Finansal Varlık Satış Karı / Değer Artışı', 'Income disp.& write-up FinA & secur. CurrA', false, 98, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M827', NULL, 'M827 - 646.02 - Finansal Kambiyo Karları', 'FX-profits finance', false, 99, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M829', NULL, 'M829 - 64 - Toplam Finansal Gelirler', 'Financial Income', false, 100, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M835', NULL, 'M835 - 655 - Menkul Kıymet Satış Zararları (3. Şahıslar)', 'Expenses of FinA & securites CurrA', false, 101, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M836', NULL, 'M836 - 655.02 - Menkul Kıymet Satış Zararları – Grup Şirketleri', 'Expenses of FinA & securites CurrA affil.', false, 102, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M840', NULL, 'M840 - 657 - Finansal Varlık Değer Düşüklüğü (3. Şahıslar)', 'Amort. FinA & securities CurrA', false, 103, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M841', NULL, 'M841 - 657.02 - Finansal Varlık Değer Düşüklüğü – Grup Şirketleri', 'Amort. FinA & securities CurrA affil.', false, 104, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M845', NULL, 'M845 - 780.01 - Kısa Vadeli Kredi Faiz Giderleri', 'Interest expenses', false, 105, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M846', NULL, 'M846 - 780.02 - Grup İçi Faiz Giderleri', 'Interest expenses affil.', false, 106, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M850', NULL, 'M850 - 659 - Diğer Finansal Giderler (3. Şahıslar)', 'Other financial expenses', false, 107, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M851', NULL, 'M851 - 659.02 - Diğer Finansal Giderler – Grup Şirketleri', 'Other financial expenses affil.', false, 108, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M857', NULL, 'M857 - 656.02 - Finansal Kambiyo Zararları', 'fx-losses finance', false, 109, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M859', NULL, 'M859 - 780/65 - Toplam Finansman Giderleri', 'Financial expenses', false, 110, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M869', NULL, 'M869 - [Ara Toplam] - Net Finansman Sonucu', 'FINANCIAL RESULT', false, 111, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M879', NULL, 'M879 - [Ara Toplam] - Olağan Faaliyet Karı/Zararı', 'RESULT OF ORDINARY ACTIVITIES', false, 112, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M885', NULL, 'M885 - 679 - Olağandışı Gelir ve Karlar', 'Extraordinary income', false, 113, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M887', NULL, 'M887 - 689 - Olağandışı Gider ve Zararlar', 'Extraordinary expenses', false, 114, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M889', NULL, 'M889 - [Ara Toplam] - Net Olağandışı Dönem Sonucu', 'Extraordinary result', false, 115, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M899', NULL, 'M899 - 690 - Vergi Öncesi Dönem Karı/Zararı', 'EBT', false, 116, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M909', NULL, 'M909 - 691.01 - Kurumlar Vergisi Karşılığı', 'Taxes on income', false, 117, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M910', NULL, 'M910 - 692 - Vergi Sonrası Net Dönem Karı/Zararı', 'RESULT AFTER TAXES', false, 118, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M915', NULL, 'M915 - 689.05 - Kanunen Kabul Edilmeyen Vergiler', 'Other taxes', false, 119, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M919', NULL, 'M919 - 590/591 - Dönem Net Karı veya Zararı', 'NET INCOME FOR THE PERIOD', false, 120, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M930', NULL, 'M930 - 549.01 - Vergilendirilmemiş Yedek Akçe Çözümü', 'Release of untaxed reserves', false, 121, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M935', NULL, 'M935 - 520/521 - Sermaye Yedeklerinden Çözüm', 'Release of capital reserves', false, 122, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M940', NULL, 'M940 - 540/541 - Kar Yedeklerinden Çözüm', 'Release of revenue reserves', false, 123, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M950', NULL, 'M950 - 549.02 - Vergilendirilmemiş Yedek Akçe Ayrılması', 'Allocation to untaxed reserves', false, 124, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M955', NULL, 'M955 - 542 - Olağanüstü Yedek Akçe Ayrılması', 'Allocation to revenue reserves', false, 125, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M959', NULL, 'M959 - 540-549 - Yedek Akçe Net Hareketleri', 'Release/Allocation reserves', false, 126, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M960', NULL, 'M960 - 500.02 / 58 - Azınlık Payları', 'Minority interest', false, 127, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M970', NULL, 'M970 - 590 ? 331/500 - Dönem Karı Dağıtımı', 'Distribution of result', false, 128, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

INSERT INTO financial_categories (company_id, code, parent_code, name_tr, name_en, is_custom, sort_order, is_active)
  VALUES ((SELECT id FROM companies LIMIT 1), 'M999', NULL, 'M999 - 590 - Nihai Dağıtılabilir Net Kar', 'NET INCOME', false, 129, true)
  ON CONFLICT (company_id, code) DO UPDATE SET name_tr = EXCLUDED.name_tr, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order;

