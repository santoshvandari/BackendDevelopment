import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Survey Builder & Analytics',
  description: 'Clean survey creation, responses and analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
            <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-400">
              Survey Builder Application &middot; Clean Fullstack Architecture
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
