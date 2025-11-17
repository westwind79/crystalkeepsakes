import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './css/globals.css'
import './css/variables.css'
import './css/navigation.css'
import './css/modal.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://crystalkeepsakes.com'),
  title: {
    default: 'CrystalKeepsakes - Premium 3D Crystal Photo Gifts & Personalized Keepsakes',
    template: '%s | CrystalKeepsakes'
  },
  description: 'Transform your cherished memories into stunning 3D laser-engraved crystal keepsakes. Premium personalized gifts for weddings, memorials, pets, and special occasions. Custom photo crystals with FREE design preview.',
  keywords: ['3D crystal photo', 'personalized crystal gifts', 'laser engraved crystals', '3D photo crystals', 'custom crystal keepsakes', 'memorial crystals', 'wedding gifts', 'pet memorial crystals', 'personalized gifts'],
  authors: [{ name: 'CrystalKeepsakes' }],
  creator: 'CrystalKeepsakes',
  publisher: 'CrystalKeepsakes',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crystalkeepsakes.com',
    siteName: 'CrystalKeepsakes',
    title: 'CrystalKeepsakes - Premium 3D Crystal Photo Gifts',
    description: 'Transform your cherished memories into stunning 3D laser-engraved crystal keepsakes. Custom personalized gifts for every occasion.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CrystalKeepsakes - 3D Crystal Photo Gifts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrystalKeepsakes - Premium 3D Crystal Photo Gifts',
    description: 'Transform your cherished memories into stunning 3D laser-engraved crystal keepsakes.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when ready
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://crystalkeepsakes.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
