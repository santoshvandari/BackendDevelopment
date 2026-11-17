'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Survey, AnswerSubmission } from '@/types/survey'
import { CheckCircle2, AlertCircle, ArrowLeft, Star, Send } from 'lucide-react'

export default function SurveyResponsePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [answers, setAnswers] = useState<Record<number, string | number | string[]>>({})
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .getSurvey(id)
      .then((data) => {
        setSurvey(data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load survey.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="py-24 text-center text-gray-500 text-sm">Loading survey...</div>
  }

  if (error || !survey) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-4">
          {error || 'Survey not found.'}
        </div>
        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          &larr; Back to available surveys
        </Link>
      </div>
    )
  }

  const isQuestionVisible = (qIndex: number): boolean => {
    const q = survey.questions[qIndex]
    if (!q.conditional_logic) return true

    const { depends_on_question_index, trigger_value } = q.conditional_logic
    if (depends_on_question_index === undefined || trigger_value === undefined) return true

    const parentQuestion = survey.questions[depends_on_question_index]
    if (!parentQuestion || !parentQuestion.id) return true

    const parentAnswer = answers[parentQuestion.id]
    if (parentAnswer === undefined || parentAnswer === null) return false

    if (Array.isArray(parentAnswer)) {
      return parentAnswer.includes(trigger_value)
    }

    return String(parentAnswer).trim().toLowerCase() === String(trigger_value).trim().toLowerCase()
  }

  const handleTextChange = (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }))
    if (validationErrors[qId]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[qId]
        return next
      })
    }
  }

  const handleSingleSelect = (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }))
    if (validationErrors[qId]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[qId]
        return next
      })
    }
  }

  const handleMultiSelect = (qId: number, val: string) => {
    setAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[qId]) ? (prev[qId] as string[]) : []
      let updated: string[]
      if (currentList.includes(val)) {
        updated = currentList.filter((item) => item !== val)
      } else {
        updated = [...currentList, val]
      }
      return { ...prev, [qId]: updated }
    })
    if (validationErrors[qId]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[qId]
        return next
      })
    }
  }

  const handleRatingChange = (qId: number, rating: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: rating }))
    if (validationErrors[qId]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[qId]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const errors: Record<number, string> = {}
    const answerSubmissions: AnswerSubmission[] = []

    survey.questions.forEach((q, idx) => {
      if (!q.id) return
      const visible = isQuestionVisible(idx)
      if (!visible) return

      const val = answers[q.id]
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0)

      if (q.is_required && isEmpty) {
        errors[q.id] = 'This question is required.'
      } else if (!isEmpty) {
        answerSubmissions.push({
          question_id: q.id,
          value: val,
        })
      }
    })

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      window.scrollTo({ top: 150, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    try {
      await api.submitResponse(survey.id, { answers: answerSubmissions })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit response.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600 text-sm mb-6">
            Your response for <span className="font-semibold text-gray-800">"{survey.title}"</span>{' '}
            has been successfully recorded.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded transition-colors"
            >
              Back to Surveys
            </Link>
            <button
              onClick={() => {
                setAnswers({})
                setValidationErrors({})
                setSubmitted(false)
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors cursor-pointer"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Surveys
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-6 shadow-xs">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h1>
        {survey.description && (
          <p className="text-sm text-gray-600 whitespace-pre-line">{survey.description}</p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions.map((q, idx) => {
          if (!isQuestionVisible(idx)) return null
          const qId = q.id!
          const qError = validationErrors[qId]
          const currentAnswer = answers[qId]

          return (
            <div
              key={qId || idx}
              className={`bg-white border rounded-lg p-6 transition-all shadow-xs ${
                qError ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'
              }`}
            >
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    <span className="text-gray-400 mr-2 font-mono">{idx + 1}.</span>
                    {q.text}
                    {q.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                {qError && <p className="text-xs text-red-600 mt-1">{qError}</p>}
              </div>

              {q.question_type === 'text' && (
                <input
                  type="text"
                  value={(currentAnswer as string) || ''}
                  onChange={(e) => handleTextChange(qId, e.target.value)}
                  placeholder="Your answer"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              )}

              {q.question_type === 'single_select' && (
                <div className="space-y-2">
                  {(q.options || []).map((opt, oIdx) => (
                    <label
                      key={oIdx}
                      className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors text-sm ${
                        currentAnswer === opt.label
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qId}`}
                        value={opt.label}
                        checked={currentAnswer === opt.label}
                        onChange={() => handleSingleSelect(qId, opt.label)}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'multi_select' && (
                <div className="space-y-2">
                  {(q.options || []).map((opt, oIdx) => {
                    const isChecked =
                      Array.isArray(currentAnswer) && currentAnswer.includes(opt.label)
                    return (
                      <label
                        key={oIdx}
                        className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors text-sm ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMultiSelect(qId, opt.label)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                        />
                        <span>{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {q.question_type === 'rating' && (
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(qId, star)}
                      className="p-2 rounded hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          Number(currentAnswer) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 stroke-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                  {Boolean(currentAnswer) && (
                    <span className="text-xs font-semibold text-gray-600 ml-2">
                      {String(currentAnswer)} / 5
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Answers'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
