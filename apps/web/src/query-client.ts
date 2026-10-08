import { MutationCache, QueryCache, QueryClient, queryOptions } from '@tanstack/react-query'
import { api, ApiError } from './api'

function handleSessionError(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(['current-user'], null)
    queryClient.removeQueries({ queryKey: ['tasks'] })
    queryClient.removeQueries({ queryKey: ['notification-settings'] })
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleSessionError }),
  mutationCache: new MutationCache({ onError: handleSessionError }),
  defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
})

export const userQuery = queryOptions({ queryKey: ['current-user'], queryFn: api.currentUser })
export const tasksQuery = queryOptions({ queryKey: ['tasks'], queryFn: api.tasks })
export const settingsQuery = queryOptions({ queryKey: ['notification-settings'], queryFn: api.settings })
