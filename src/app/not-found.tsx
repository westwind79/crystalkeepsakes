import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#72B01D] text-white font-semibold rounded-lg hover:bg-[#5A8E17] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
