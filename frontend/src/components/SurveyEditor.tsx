'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Question, QuestionOption, QuestionType } from '@/types/survey'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'

interface QuestionDraft {
  id?: number
  text: string
  question_type: QuestionType
  is_required: boolean
  order: number
  conditional_logic: {
    depends_on_question_index?: number
    trigger_value?: string
  } | null
  options: QuestionOption[]
}

export function SurveyEditor({ surveyId }: { surveyId?: string }) {
  const isEditing = Boolean(surveyId)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (isEditing && surveyId) {
      setLoading(true)
      api
        .getSurvey(surveyId)
        .then((survey) => {
          setTitle(survey.title)
          setDescription(survey.description || '')
          const loadedQuestions: QuestionDraft[] = (survey.questions || []).map((q, idx) => ({
            id: q.id,
            text: q.text,
            question_type: q.question_type,
            is_required: q.is_required,
            order: q.order ?? idx,
            conditional_logic: q.conditional_logic ?? null,
            options: q.options || [],
          }))
          setQuestions(loadedQuestions)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load survey')
        })
        .finally(() => setLoading(false))
    } else {
      setQuestions([
        {
          text: '',
          question_type: 'text',
          is_required: false,
          order: 0,
          conditional_logic: null,
          options: [],
        },
      ])
    }
  }, [surveyId, isEditing])

  const addQuestion = (type: QuestionType = 'text') => {
    const newQ: QuestionDraft = {
      text: '',
      question_type: type,
      is_required: false,
      order: questions.length,
      conditional_logic: null,
      options:
        type === 'single_select' || type === 'multi_select'
          ? [
              { label: 'Option 1', value: 'Option 1', order: 0 },
              { label: 'Option 2', value: 'Option 2', order: 1 },
            ]
          : [],
    }
    setQuestions([...questions, newQ])
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, idx) => idx !== index)
    const sanitized = updated.map((q) => {
      if (q.conditional_logic?.depends_on_question_index !== undefined) {
        if (q.conditional_logic.depends_on_question_index === index) {
          return { ...q, conditional_logic: null }
        } else if (q.conditional_logic.depends_on_question_index > index) {
          return {
            ...q,
            conditional_logic: {
              ...q.conditional_logic,
              depends_on_question_index: q.conditional_logic.depends_on_question_index - 1,
            },
          }
        }
      }
      return q
    })
    setQuestions(sanitized)
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= questions.length) return

    const reordered = [...questions]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    reordered.forEach((q, idx) => {
      q.order = idx
    })

    setQuestions(reordered)
  }

  const updateQuestion = (index: number, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== index) return q
        const updated = { ...q, ...patch }
        if (
          (updated.question_type === 'single_select' || updated.question_type === 'multi_select') &&
          (!updated.options || updated.options.length === 0)
        ) {
          updated.options = [
            { label: 'Option 1', value: 'Option 1', order: 0 },
            { label: 'Option 2', value: 'Option 2', order: 1 },
          ]
        }
        return updated
      })
    )
  }

  const addOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q
        const currentOpts = q.options || []
        const optNum = currentOpts.length + 1
        const newOpt: QuestionOption = {
          label: `Option ${optNum}`,
          value: `Option ${optNum}`,
          order: currentOpts.length,
        }
        return { ...q, options: [...currentOpts, newOpt] }
      })
    )
  }

  const updateOption = (qIndex: number, optIndex: number, label: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q
        const currentOpts = [...(q.options || [])]
        currentOpts[optIndex] = {
          ...currentOpts[optIndex],
          label,
          value: label,
        }
        return { ...q, options: currentOpts }
      })
    )
  }

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q
        const currentOpts = (q.options || []).filter((_, oIdx) => oIdx !== optIndex)
        return { ...q, options: currentOpts }
      })
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Survey title is required.')
      return
    }

    if (questions.length === 0) {
      setError('Please add at least one question.')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`Question #${i + 1} is missing its question text.`)
        return
      }
      if (
        (questions[i].question_type === 'single_select' ||
          questions[i].question_type === 'multi_select') &&
        (!questions[i].options || questions[i].options.length === 0)
      ) {
        setError(`Question #${i + 1} is a choice question and must have at least one option.`)
        return
      }
    }

    setSaving(true)
    const payloadQuestions: Question[] = questions.map((q, idx) => ({
      text: q.text.trim(),
      question_type: q.question_type,
      is_required: q.is_required,
      order: idx,
      conditional_logic:
        q.conditional_logic &&
        q.conditional_logic.depends_on_question_index !== undefined &&
        q.conditional_logic.trigger_value
          ? q.conditional_logic
          : null,
      options:
        q.question_type === 'single_select' || q.question_type === 'multi_select'
          ? (q.options || []).map((opt, oIdx) => ({
              label: opt.label.trim(),
              value: opt.value.trim() || opt.label.trim(),
              order: oIdx,
            }))
          : [],
    }))

    try {
      if (isEditing && surveyId) {
        await api.updateSurvey(surveyId, {
          title: title.trim(),
          description: description.trim() || undefined,
          questions: payloadQuestions,
        })
        setSuccess('Survey updated successfully!')
      } else {
        const created = await api.createSurvey({
          title: title.trim(),
          description: description.trim() || undefined,
          questions: payloadQuestions,
        })
        setSuccess('Survey created successfully!')
        setTimeout(() => {
          router.push(`/surveys/${created.id}`)
        }, 800)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save survey')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <div className="py-24 text-center text-gray-500 text-sm">Loading survey details...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Surveys
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Admin Panel
        </span>
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-xs">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {isEditing ? 'Edit Survey' : 'Create New Survey'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Configure basic information and compose questions.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Survey Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Customer Satisfaction Survey 2026"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this survey is about or instructions for responders..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Questions ({questions.length})
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addQuestion('text')}
                className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Text
              </button>
              <button
                type="button"
                onClick={() => addQuestion('single_select')}
                className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Single Choice
              </button>
              <button
                type="button"
                onClick={() => addQuestion('multi_select')}
                className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Multi Choice
              </button>
              <button
                type="button"
                onClick={() => addQuestion('rating')}
                className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Rating (1-5)
              </button>
            </div>
          </div>

          {questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs relative"
            >
              <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Question
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveQuestion(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded cursor-pointer"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(idx, 'down')}
                    disabled={idx === questions.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded cursor-pointer"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded ml-1 cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={q.text}
                      onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                      placeholder="e.g. How satisfied are you with our product?"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                      Type
                    </label>
                    <select
                      value={q.question_type}
                      onChange={(e) =>
                        updateQuestion(idx, { question_type: e.target.value as QuestionType })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="text">Text Input</option>
                      <option value="single_select">Multiple Choice (Single)</option>
                      <option value="multi_select">Checkbox (Multi-select)</option>
                      <option value="rating">Rating (1–5)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={q.is_required}
                      onChange={(e) => updateQuestion(idx, { is_required: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium text-xs">Required answer</span>
                  </label>
                </div>

                {idx > 0 && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-2">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span>Conditional Display Logic</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-600 mb-1">
                          Only show this question if:
                        </label>
                        <select
                          value={
                            q.conditional_logic?.depends_on_question_index !== undefined
                              ? q.conditional_logic.depends_on_question_index
                              : ''
                          }
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '') {
                              updateQuestion(idx, { conditional_logic: null })
                            } else {
                              updateQuestion(idx, {
                                conditional_logic: {
                                  depends_on_question_index: parseInt(val, 10),
                                  trigger_value: q.conditional_logic?.trigger_value || '',
                                },
                              })
                            }
                          }}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white text-xs"
                        >
                          <option value="">Always visible (No condition)</option>
                          {questions.slice(0, idx).map((parentQ, pIdx) => (
                            <option key={pIdx} value={pIdx}>
                              Question {pIdx + 1}: {parentQ.text || '(Untitled question)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {q.conditional_logic &&
                        q.conditional_logic.depends_on_question_index !== undefined && (
                          <div>
                            <label className="block text-gray-600 mb-1">
                              Has answer equal to:
                            </label>
                            {questions[q.conditional_logic.depends_on_question_index]?.options &&
                            questions[q.conditional_logic.depends_on_question_index].options
                              .length > 0 ? (
                              <select
                                value={q.conditional_logic.trigger_value || ''}
                                onChange={(e) =>
                                  updateQuestion(idx, {
                                    conditional_logic: {
                                      ...q.conditional_logic!,
                                      trigger_value: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white text-xs"
                              >
                                <option value="">-- Select option --</option>
                                {questions[
                                  q.conditional_logic.depends_on_question_index
                                ].options.map((opt, optI) => (
                                  <option key={optI} value={opt.label}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="e.g. Yes"
                                value={q.conditional_logic.trigger_value || ''}
                                onChange={(e) =>
                                  updateQuestion(idx, {
                                    conditional_logic: {
                                      ...q.conditional_logic!,
                                      trigger_value: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                              />
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {(q.question_type === 'single_select' || q.question_type === 'multi_select') && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Choices / Options
                    </label>
                    <div className="space-y-2">
                      {(q.options || []).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-4 text-xs text-gray-400 text-center font-mono">
                            {oIdx + 1}.
                          </span>
                          <input
                            type="text"
                            required
                            value={opt.label}
                            onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                          {(q.options || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(idx, oIdx)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                              title="Remove option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addOption(idx)}
                      className="mt-2.5 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg p-4 shadow-md flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Survey...' : isEditing ? 'Update Survey' : 'Publish Survey'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
