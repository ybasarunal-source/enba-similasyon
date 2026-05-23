-- ============================================================
-- ENBA migration_v24 — RLS Tamamlama + Policy Güncelleme
--
-- 1. business_plans  → RLS hiç yoktu, ekleniyor
-- 2. project_groups  → eski subquery policy → JWT policy
-- 3. projects        → eski subquery policy → JWT policy
-- 4. tasks           → eski subquery policy → JWT policy
--
-- Eski "Proje gruplarını yönet / Projeleri yönet / Görevleri yönet"
-- policy'leri profiles tablosunu subquery ile sorguluyor.
-- Bu hem yavaş hem döngüsel risk taşıyor.
-- Yeni policy'ler JWT'deki company_id'yi direkt okur.
--
-- GÜVENLİ: Sadece POLICY değiştirilir, tablo verisi dokunulmaz.
-- Birden fazla çalıştırmak güvenlidir (DROP IF EXISTS + idempotent).
--
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ── 1. business_plans — RLS Aktifleştir ──────────────────────
-- Tablo zaten var (v2'den beri), sadece RLS hiç eklenmemişti.

ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin business_plans yönetir"       ON public.business_plans;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket business_plans"   ON public.business_plans;
DROP POLICY IF EXISTS "business_plans kullanıcı erişimi"        ON public.business_plans;

CREATE POLICY "SuperAdmin business_plans yönetir"
  ON public.business_plans FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- company_id varsa şirket izolasyonu, yoksa user_id fallback (migration öncesi kayıtlar)
CREATE POLICY "Kullanıcı kendi şirket business_plans"
  ON public.business_plans FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 2. project_groups — JWT tabanlı policy'ye geç ────────────
DROP POLICY IF EXISTS "Proje gruplarını yönet"                ON public.project_groups;
DROP POLICY IF EXISTS "SuperAdmin project_groups yönetir"     ON public.project_groups;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket project_groups" ON public.project_groups;

CREATE POLICY "SuperAdmin project_groups yönetir"
  ON public.project_groups FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket project_groups"
  ON public.project_groups FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 3. projects — JWT tabanlı policy'ye geç ──────────────────
DROP POLICY IF EXISTS "Projeleri yönet"                   ON public.projects;
DROP POLICY IF EXISTS "SuperAdmin projects yönetir"       ON public.projects;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket projects"   ON public.projects;

CREATE POLICY "SuperAdmin projects yönetir"
  ON public.projects FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket projects"
  ON public.projects FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 4. tasks — JWT tabanlı policy'ye geç ─────────────────────
DROP POLICY IF EXISTS "Görevleri yönet"                 ON public.tasks;
DROP POLICY IF EXISTS "SuperAdmin tasks yönetir"        ON public.tasks;
DROP POLICY IF EXISTS "Kullanıcı kendi şirket tasks"    ON public.tasks;

CREATE POLICY "SuperAdmin tasks yönetir"
  ON public.tasks FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Kullanıcı kendi şirket tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
    OR user_id = auth.uid()
  );


-- ── 5. Doğrulama ─────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%app_metadata%' THEN '✓ JWT tabanlı'
    WHEN qual LIKE '%profiles%'     THEN '⚠ Eski subquery (yavaş)'
    ELSE '— diğer'
  END AS policy_tipi
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('business_plans', 'project_groups', 'projects', 'tasks')
ORDER BY tablename, policyname;
-- Beklenen: her tabloda 2 policy, hepsi "✓ JWT tabanlı"
