import { QueryClient } from '@tanstack/react-query';

let queryClient: QueryClient | null = null

export const getQueryClient = (): QueryClient => {
    if(!queryClient) {
        queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: 2,
              staleTime: 30 * 60 * 1000
            }
          }
        })
    }

    return queryClient
}