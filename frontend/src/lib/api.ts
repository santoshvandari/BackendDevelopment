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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
    credentials: 'include',
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
  async login(formData: FormData): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/token', {
      method: 'POST',
      body: formData,
    })
  },

  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
    })
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
