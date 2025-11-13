// app/about/page.tsx
import { Metadata } from 'next'
import OrderConfirmationClient from './OrderConfirmationClient'

// Metadata for SEO (Server Component only)
export const metadata: Metadata = {
  title: 'Order Confirmation from CrystalKeepsakes',
  description: 'Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal.',
  keywords: '3D crystal engraving, crystal memories, custom crystal art, laser engraving, crystal keepsakes, about us',
  openGraph: {
    title: 'Order Confirmation',
    description: 'Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal.',
    images: ['/img/noahs-keepsake-1.png'],
  }
}

// Server Component - just renders the client component
export default function OrderConfirmation() {
  return <OrderConfirmationClient />
}
