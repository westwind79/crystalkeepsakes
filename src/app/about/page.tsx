// app/about/page.tsx
import { Metadata } from 'next'
import AboutPageClient from './AboutPageClient'

// Metadata for SEO (Server Component only)
export const metadata: Metadata = {
  title: 'About CrystalKeepsakes - 3D Crystal Memories',
  description: 'Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal.',
  keywords: '3D crystal engraving, crystal memories, custom crystal art, laser engraving, crystal keepsakes, about us',
  openGraph: {
    title: 'About CrystalKeepsakes - 3D Crystal Memories',
    description: 'Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal.',
    images: ['/img/noahs-keepsake-1.png'],
  }
}

// Server Component - just renders the client component
export default function AboutPage() {
  return <AboutPageClient />
}