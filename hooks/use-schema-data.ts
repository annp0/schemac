import useSWR, { KeyedMutator } from 'swr';
import { UserSchema } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

// Define the return type for better type safety
export function useSchemaData(): {
  schemas: UserSchema[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<UserSchema[]>;
} {
  const {
    data: schemas,
    isLoading,
    error,
    mutate
  } = useSWR<UserSchema[]>(
    '/api/schema', // Always attempt to fetch
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false,
      revalidateOnMount: true
    }
  );

  return {
    schemas: schemas || [],
    isLoading,
    error,
    mutate,
  };
}