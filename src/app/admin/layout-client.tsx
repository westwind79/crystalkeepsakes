'use client'

import { useEffect } from 'react'

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Hide header and footer on admin pages
    const style = document.createElement('style')
    style.innerHTML = `
      body header,
      body footer {
        display: none !important;
      }
      body main {
        padding: 0 !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      // Cleanup: remove the style when leaving admin
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
