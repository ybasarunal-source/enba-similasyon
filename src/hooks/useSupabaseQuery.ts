import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Supabase (veya herhangi async) fetch için standart hook.
 * - loading / error / data state otomatik yönetilir
 * - Component unmount'ta isteği iptal eder (memory leak koruması)
 * - refetch() ile manuel yenileme
 *
 * Kullanım:
 *   const { data, loading, error, refetch } = useSupabaseQuery(
 *     () => permitsAPI.getAll(),
 *     []   // initialValue
 *   );
 */
export function useSupabaseQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  initialValue: T,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Her render'da güncel fetcher'ı tut ama effect'i yeniden çalıştırma
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(signal);
      if (!signal.aborted) setData(result);
    } catch (err: any) {
      if (!signal.aborted) setError(err?.message || 'Veri yüklenemedi');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort(); // unmount'ta iptal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    run(controller.signal);
  }, [run]);

  return { data, loading, error, refetch };
}
