export interface QuizSummary {
  id: string
  title: string
  description: string
  question_count: number
  created_at: string
}

export interface QuestionOut {
  id: string
  text: string
  options: string[]
  order: number
}

export interface QuestionWithAnswer extends QuestionOut {
  correct_index: number
}

export interface QuizDetail {
  id: string
  title: string
  description: string
  questions: QuestionOut[]
  created_at: string
}

export interface QuizCreate {
  title: string
  description: string
  questions: {
    text: string
    options: string[]
    correct_index: number
  }[]
}

export interface AttemptResult {
  id: string
  quiz_id: string
  score: number
  total: number
  answers: number[]
  questions: QuestionWithAnswer[]
  taken_at: string
}

export interface AttemptSummary {
  id: string
  quiz_id: string
  quiz_title: string
  score: number
  total: number
  taken_at: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  listQuizzes: () => request<QuizSummary[]>('/api/quizzes'),

  getQuiz: (id: string) => request<QuizDetail>(`/api/quizzes/${id}`),

  createQuiz: (data: QuizCreate) =>
    request<QuizSummary>('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteQuiz: (id: string) =>
    request<void>(`/api/quizzes/${id}`, { method: 'DELETE' }),

  submitQuiz: (id: string, answers: number[]) =>
    request<AttemptResult>(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    }),

  listAttempts: () => request<AttemptSummary[]>('/api/attempts'),

  getAttempt: (id: string) => request<AttemptResult>(`/api/attempts/${id}`),
}
