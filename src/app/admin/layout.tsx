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
    <div className="admin-page min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{
        __html: `
          .admin-page ~ * header,
          .admin-page ~ * footer,
          body:has(.admin-page) header,
          body:has(.admin-page) footer {
            display: none !important;
          }
          body:has(.admin-page) main {
            padding: 0 !important;
          }
        `
      }} />
      {children}
    </div>
  )
}
