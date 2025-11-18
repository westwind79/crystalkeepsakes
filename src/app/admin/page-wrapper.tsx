'use client'

// Simple wrapper that only shows admin in development
export default function AdminPageWrapper({ children }: { children: React.ReactNode }) {
  // Only show admin panel in development
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENV_MODE === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
          <p className="text-gray-600 mb-8">This page does not exist.</p>
          <a href="/" className="text-blue-600 hover:underline">Return to Home</a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
