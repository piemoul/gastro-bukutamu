-- Read-only baseline for the existing Buku Tamu tables.
-- Run on the SAME production database before and immediately after migration.
-- Pause application writes during this comparison. Save results outside Git.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL TIME ZONE 'UTC';

SELECT current_database() AS database_name, current_schema() AS schema_name;

SELECT 'users' AS table_name,
       count(*)::bigint AS row_count,
       md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY id), '')) AS rows_fingerprint
FROM public.users t
UNION ALL
SELECT 'events',
       count(*)::bigint,
       md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY code), ''))
FROM public.events t
UNION ALL
SELECT 'clients',
       count(*)::bigint,
       md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY id), ''))
FROM public.clients t;

COMMIT;
