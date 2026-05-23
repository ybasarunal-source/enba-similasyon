-- Hangi tablolarda user_id kolonu var, hangisinde yok?
SELECT
  t.table_name,
  CASE WHEN c.column_name IS NOT NULL THEN '✓ var' ELSE '✗ YOK' END AS user_id_durumu
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name  = t.table_name
  AND c.column_name = 'user_id'
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'project_groups', 'projects', 'tasks',
    'cashflow_parameters', 'personnel', 'attendance',
    'stock_records', 'logistics_records', 'production_records'
  )
ORDER BY t.table_name;
