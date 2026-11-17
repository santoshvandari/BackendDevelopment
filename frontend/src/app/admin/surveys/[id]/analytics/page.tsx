'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { SurveyAnalytics } from '@/types/survey'
import {
  ArrowLeft,
  Users,
  BarChart2,
  Star,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'

export default function AnalyticsDashboardPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    if (!id) return
    setLoading(true)
    setError(null)
    api
      .getAnalytics(id)
      .then((data) => setAnalytics(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load analytics.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return <div className="py-24 text-center text-gray-500 text-sm">Loading analytics...</div>
  }

  if (error || !analytics) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-4">
          {error || 'Survey analytics could not be retrieved.'}
        </div>
        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          &larr; Back to surveys
        </Link>
      </div>
    )
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
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 border border-gray-200 rounded bg-white shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-xs">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          Survey Insights
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-4">
          {analytics.survey_title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Submissions</p>
              <p className="text-xl font-bold text-gray-900">{analytics.total_responses}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Questions Analyzed</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics.question_analytics.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Question Results</h2>

        {analytics.question_analytics.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-500">
            No questions to display analytics for.
          </div>
        ) : (
          analytics.question_analytics.map((qa, idx) => (
            <div
              key={qa.question_id || idx}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    <span className="text-gray-400 mr-2 font-mono">{idx + 1}.</span>
                    {qa.text}
                  </h3>
                  <span className="inline-block mt-1 text-[11px] font-medium uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {qa.question_type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {qa.total_answers} answer{qa.total_answers === 1 ? '' : 's'}
                </span>
              </div>

              {qa.question_type === 'text' && (
                <div>
                  {qa.data.responses && qa.data.responses.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {qa.data.responses.map((item: string, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="p-3 bg-gray-50 border border-gray-100 rounded text-sm text-gray-800 flex items-start gap-2"
                        >
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="break-words">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No responses recorded yet.</p>
                  )}
                </div>
              )}

              {qa.question_type === 'rating' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-6 h-6 fill-amber-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {qa.data.average ?? 0}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">/ 5.0 Average</span>
                    </div>
                  </div>

                  {qa.data.distribution && (
                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = qa.data.distribution?.[String(stars)] || 0
                        const pct =
                          qa.total_answers > 0 ? Math.round((count / qa.total_answers) * 100) : 0
                        return (
                          <div key={stars} className="flex items-center gap-3 text-xs">
                            <span className="w-12 text-gray-600 flex items-center gap-1 font-medium">
                              {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-14 text-right text-gray-500 font-mono">
                              {count} ({pct}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {(qa.question_type === 'single_select' || qa.question_type === 'multi_select') && (
                <div>
                  {qa.data.counts && Object.keys(qa.data.counts).length > 0 ? (
                    <div className="space-y-2.5">
                      {Object.entries(qa.data.counts).map(([label, count]) => {
                        const numericCount = count as number
                        const pct =
                          qa.total_answers > 0
                            ? Math.round((numericCount / qa.total_answers) * 100)
                            : 0
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-gray-700">{label}</span>
                              <span className="text-gray-500 font-mono">
                                {numericCount} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No responses recorded yet.</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
