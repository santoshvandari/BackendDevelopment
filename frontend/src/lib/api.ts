import type {
  PaginatedSurveys,
  Question,
  ResponseSubmitPayload,
  Survey,
  SurveyAnalytics,
  User,
} from '../types/survey'

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
).replace(/\/+$/, '')

const TOKEN_KEY = 'auth_token'

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY)
  },
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = tokenStorage.get()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`
    try {
      const data = await res.json()
      if (data && typeof data === 'object') {
        if (data.detail) {
          errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
        } else if (data.message) {
          errorMessage = data.message
        }
      }
    } catch {
      const text = await res.text().catch(() => '')
      if (text) errorMessage = text
    }
    throw new Error(errorMessage)
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }
  return {} as T
}

export const api = {
  async login(formData: FormData): Promise<{ access_token: string; token_type: string }> {
    const result = await request<{ access_token: string; token_type: string }>('/auth/token', {
      method: 'POST',
      body: formData,
    })
    tokenStorage.set(result.access_token)
    return result
  },

  async logout(): Promise<void> {
    tokenStorage.clear()
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me')
  },

  async getSurveys(page = 1, pageSize = 10): Promise<PaginatedSurveys> {
    return request<PaginatedSurveys>(`/surveys/?page=${page}&page_size=${pageSize}`)
  },

  async getSurvey(id: number | string): Promise<Survey> {
    return request<Survey>(`/surveys/${id}`)
  },

  async createSurvey(data: {
    title: string
    description?: string
    questions: Question[]
  }): Promise<Survey> {
    return request<Survey>('/surveys/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateSurvey(
    id: number | string,
    data: {
      title?: string
      description?: string
      questions?: Question[]
    }
  ): Promise<Survey> {
    return request<Survey>(`/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteSurvey(id: number | string): Promise<{ message: string; id: number }> {
    return request<{ message: string; id: number }>(`/surveys/${id}`, {
      method: 'DELETE',
    })
  },

  async submitResponse(
    surveyId: number | string,
    payload: ResponseSubmitPayload
  ): Promise<unknown> {
    return request(`/surveys/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getAnalytics(surveyId: number | string): Promise<SurveyAnalytics> {
    return request<SurveyAnalytics>(`/surveys/${surveyId}/analytics`)
  },
}
