export type QuestionType =
  | 'text'
  | 'single_select'
  | 'multi_select'
  | 'rating'

export interface QuestionOption {
  id?: number
  label: string
  value: string
  order: number
}

export interface ConditionalLogic {
  depends_on_question_index?: number
  trigger_value?: string
}

export interface Question {
  id?: number
  text: string
  question_type: QuestionType
  is_required: boolean
  order: number
  conditional_logic?: ConditionalLogic | null
  options?: QuestionOption[]
}

export interface Survey {
  id: number
  title: string
  description?: string | null
  created_at: string
  updated_at: string
  questions: Question[]
}

export interface SurveyListItem {
  id: number
  title: string
  description?: string | null
  created_at: string
  updated_at: string
  question_count: number
  response_count: number
}

export interface PaginatedSurveys {
  items: SurveyListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AnswerSubmission {
  question_id: number
  value: string | number | string[]
}

export interface ResponseSubmitPayload {
  answers: AnswerSubmission[]
}

export interface QuestionAnalyticsData {
  responses?: string[]
  average?: number
  distribution?: Record<string, number>
  counts?: Record<string, number>
}

export interface QuestionAnalytics {
  question_id: number
  text: string
  question_type: QuestionType
  total_answers: number
  data: QuestionAnalyticsData
}

export interface SurveyAnalytics {
  survey_id: number
  survey_title: string
  total_responses: number
  question_analytics: QuestionAnalytics[]
}

export interface User {
  username: string
  email?: string | null
  full_name?: string | null
  disabled?: boolean
}
