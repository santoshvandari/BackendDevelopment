'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ClipboardList, LogIn, LogOut, PlusCircle } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 text-lg">
          <div className="p-1.5 bg-blue-600 text-white rounded">
            <ClipboardList className="w-5 h-5" />
          </div>
          <span>SurveyEngine</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            Surveys
          </Link>

          {user ? (
            <>
              <Link
                href="/admin/create"
                className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-3.5 py-1.5 rounded hover:bg-blue-700 transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Survey</span>
              </Link>
              <div className="h-4 w-px bg-gray-200 mx-1"></div>
              <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded border border-gray-200">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-red-600 px-2.5 py-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Admin Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
