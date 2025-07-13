import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addDefaultData as addDefaultDataAction,
  getTermsFromDatabase,
  getAvailableLanguages,
} from './actions';

export const QUERY_KEYS = {
  terms: ['terms'] as const,
  languages: ['languages'] as const,
  defaultData: ['defaultData'] as const,
};

// Hook to fetch terms from database
export function useTerms() {
  return useQuery({
    queryKey: QUERY_KEYS.terms,
    queryFn: getTermsFromDatabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Hook to fetch available languages
export function useLanguages() {
  return useQuery({
    queryKey: QUERY_KEYS.languages,
    queryFn: getAvailableLanguages,
    staleTime: 10 * 60 * 1000, // 10 minutes (languages change less frequently)
    retry: 2,
  });
}

// Hook to add default data
export function useAddDefaultData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addDefaultDataAction,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate and refetch both terms and languages to get the fresh data
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.terms });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.languages });
      }
    },
    onError: (error) => {
      console.error('Error adding default data:', error);
    },
  });
}

// Hook to manually refresh terms and languages
export function useRefreshData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.terms });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.languages });
  };
}
