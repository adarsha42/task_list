export interface User {
  id: number
  username: string
  email: string
}

export interface TaskInput {
  header: string
  description: string
  assignee_email: string
  deadline: string
}

export interface Task extends TaskInput {
  id: number
  status: 'pending' | 'completed'
  notification_sent: boolean
}

export interface NotificationSettings {
  notify_hours_before: number
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = body?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { msg: string }) => item.msg).join('; ')
        : `Request failed (${response.status}). Please try again.`
    throw new ApiError(message, response.status)
  }

  return body as T
}

export const api = {
  currentUser: async () => {
    try {
      return await request<User>('/auth/me')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },
  login: (identifier: string) => request<User>('/auth/login', {
    method: 'POST', body: JSON.stringify({ identifier }),
  }),
  logout: () => request<{
    success: boolean
  }>('/auth/logout', { method: 'POST' }),

  tasks: () => request<Task[]>('/tasks/'),
  createTask: (task: TaskInput) => request<Task>('/tasks/',
    {
      method: 'POST', body: JSON.stringify(task),
    }),
  updateTask: (id: number, task: TaskInput) => request<Task>(`/tasks/${id}`,
    {
      method: 'PUT', body: JSON.stringify(task),
    }),
  deleteTask: (id: number) => request<{
    success: boolean
  }>(`/tasks/${id}`, { method: 'DELETE' }),
  completeTask: (id: number) => request<Task>(`/tasks/${id}/complete`, { method: 'POST' }),

  settings: () => request<NotificationSettings>('/tasks/settings/deadline-notification'),
  updateSettings: (settings: NotificationSettings) => request<NotificationSettings>(
    '/tasks/settings/deadline-notification', {
    method: 'PUT', body: JSON.stringify(settings)
  },
  ),
}
