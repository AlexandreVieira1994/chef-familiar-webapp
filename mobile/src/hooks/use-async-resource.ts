import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

type AsyncResourceState<TData> = {
  data: TData | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<TData | null>>;
};

export function useAsyncResource<TData>(loader: () => Promise<TData>): AsyncResourceState<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh: boolean) => {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const nextData = await loader();
        setData(nextData);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Ocorreu um erro inesperado.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loader],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const reload = useCallback(async () => {
    await load(true);
  }, [load]);

  return {
    data,
    error,
    loading,
    refreshing,
    reload,
    setData,
  };
}
