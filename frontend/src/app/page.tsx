'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { SurveyListItem } from '@/types/survey'
import {
  FileText,
  BarChart3,
  ExternalLink,
  PlusCircle,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState<SurveyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchSurveys = async (currentPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getSurveys(currentPage, 9)
      setSurveys(data.items)
      setTotal(data.total)
      setTotalPages(data.total_pages || 1)
      setPage(data.page)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load surveys.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurveys(page)
  }, [page])

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return
    }
    try {
      await api.deleteSurvey(id)
      fetchSurveys(page)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete survey')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Surveys</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse public surveys to respond or manage surveys as an administrator.
          </p>
        </div>

        {user && (
          <Link
            href="/admin/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Survey</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm">Loading surveys...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No surveys found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            There are currently no active surveys published in the system.
          </p>
          {user ? (
            <Link
              href="/admin/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Survey</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Sign in as Admin to create one
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between hover:border-gray-300 transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-base font-bold text-gray-900 line-clamp-1">{survey.title}</h2>
                  {user && (
                    <button
                      onClick={() => handleDelete(survey.id, survey.title)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded cursor-pointer"
                      title="Delete survey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {survey.description || 'No description provided.'}
                </p>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 mb-6">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    {survey.question_count} question{survey.question_count === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                    {survey.response_count} response{survey.response_count === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(survey.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <Link
                  href={`/surveys/${survey.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>Take Survey</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                {user && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/surveys/${survey.id}/edit`}
                      className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 bg-gray-100 rounded"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/surveys/${survey.id}/analytics`}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900 px-2 py-1 bg-emerald-50 rounded flex items-center gap-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analytics
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            Showing Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span> ({total} surveys total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
