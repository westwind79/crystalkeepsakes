import type { Metadata } from 'next'
import { Cinzel, Open_Sans } from 'next/font/google'
import '../globals.css'

// Font Theme: Option 3 - Refined Luxury
const cinzel = Cinzel({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const openSans = Open_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

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
    <div className="min-h-screen bg-gray-50">
      {/* No Header or Footer - clean admin interface */}
      {children}
    </div>
  )
}
