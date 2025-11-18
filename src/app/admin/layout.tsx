import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel | CrystalKeepsakes',
  description: 'Product management admin panel',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          {/* No Header or Footer - clean admin interface */}
          {children}
        </div>
      </body>
    </html>
  )
}
