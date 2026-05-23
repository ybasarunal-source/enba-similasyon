-- ============================================================
-- ENBA migration_v24b — Eski RLS Policy Temizliği
--
-- migration_v24 yeni policy'leri ekledi ama orijinal şemadan
-- kalan eski policy'ler silinmedi. Bu script onları temizler.
--
-- Silinecekler:
--   business_plans : "Adminler tüm planları görebilir" (eski subquery)
--                    "Ekleme", "Güncelleme", "Seçme", "Silme"
--   project_groups : "Users can manage their own project_groups"
--   projects       : "Users can manage their own projects"
--   tasks          : "Users can manage their own tasks"
--
-- Kalacaklar (v24'te eklendi):
--   Her tabloda "SuperAdmin ... yönetir" + "Kullanıcı kendi şirket ..."
--
-- GÜVENLİ: Sadece DROP POLICY, veri dokunulmaz.
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── business_plans ───────────────────────────────────────────
DROP POLICY IF EXISTS "Adminler tüm planları görebilir" ON public.business_plans;
DROP POLICY IF EXISTS "Ekleme"                          ON public.business_plans;
DROP POLICY IF EXISTS "Güncelleme"                      ON public.business_plans;
DROP POLICY IF EXISTS "Seçme"                           ON public.business_plans;
DROP POLICY IF EXISTS "Silme"                           ON public.business_plans;

-- ── project_groups ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own project_groups" ON public.project_groups;

-- ── projects ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;

-- ── tasks ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;


-- ── Doğrulama ────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%app_metadata%' THEN '✓ JWT tabanlı'
    WHEN qual LIKE '%profiles%'     THEN '⚠ Eski subquery'
    ELSE '— diğer'
  END AS policy_tipi
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('business_plans', 'project_groups', 'projects', 'tasks')
ORDER BY tablename, policyname;
-- Beklenen: her tabloda tam 2 policy, hepsi "✓ JWT tabanlı"
