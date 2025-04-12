import useSWR from 'swr';
import { UserSchema } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

export function useSchemaData() {
  const {
    data: schemas,
    isLoading,
    error,
    mutate
  } = useSWR<UserSchema[]>(
    '/api/schema',
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false
    }
  );

  return {
    schemas: schemas || [],
    isLoading,
    error,
    mutate,
  };
}