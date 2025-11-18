'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TestLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => {
    // If not in test environment, redirect to home
    if (process.env.NEXT_PUBLIC_BASE_PATH !== '/test') {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Set cookie via API route
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to original destination
        router.push(redirect)
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#72b01d] rounded-full mb-4">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 92.93 84.163">
                <polygon points="24.753 84.163 0 71.889 28.032 81.483 7.453 58.266 32.67 77.845 18.076 47.813 39.35 75.565 30.941 39.241 44.686 75.868 47.965 0 51.245 75.868 64.99 39.241 55.58 75.565 77.854 46.813 63.26 77.845 87.477 59.266 67.898 81.483 92.93 71.889 71.178 84.163 24.753 84.163" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Test Environment Access
            </h1>
            <p className="text-gray-600 text-sm">
              CrystalKeepsakes Staging Site
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Access Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-[#72b01d] transition-all"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#72b01d] hover:bg-[#5a8c15] disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? 'Authenticating...' : 'Access Test Site'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This is a password-protected staging environment for testing purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
