import type { Metadata } from 'next'
import AdminLayoutClient from './layout-client'

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
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
