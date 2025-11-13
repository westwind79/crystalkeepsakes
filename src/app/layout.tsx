import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production' 
      ? 'https://crystalkeepsakes.com' 
      : 'http://localhost:3000'
  ),
  title: 'CrystalKeepsakes - Custom 3D Crystal Engravings',
  description: 'Premium custom engraving services. Transform your memories into beautiful crystal keepsakes with precision laser engraving.',
  keywords: 'crystal engraving, custom crystals, laser engraving, personalized gifts, keepsakes',
  robots: 'index follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  // Get environment mode for development indicator
  const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';
  const isDevelopment = envMode === 'development';
  const isTesting = envMode === 'testing';
  
  // Console log for development tracking
  if (typeof window !== 'undefined' && (isDevelopment || isTesting)) {
    console.log('🏠 Layout loaded:', {
      environment: envMode,
      timestamp: new Date().toISOString(),
      page: 'layout'
    });
  }

  return (
    <html lang="en">
      <body className={isDevelopment || isTesting ? "dev-mode" : ""}>

        {/* Development/Testing mode indicator */}
        {(isDevelopment || isTesting) && (
          <div className="dev-mode-alert">
            {envMode.toUpperCase()} MODE
          </div>
        )}
        
        {/* Global Header - appears on all pages */}
        <Header />
        
        {/* Main content - this is where page content goes */}
        <main id="main-content">
          {children}
        </main>
        
        {/* Global Footer - appears on all pages */}
        <Footer />
        
        {/* Development debug info */}
        {/*{isDevelopment && (
          <div className="fixed bottom-[10%] left-2.5 bg-black/80 text-brand-500 p-2.5 rounded text-xs max-w-[250px]">
            <strong className="text-red-600">Debug Info:</strong><br />
            Environment: {envMode}<br />
            Timestamp: {new Date().toISOString()}<br />
            Layout rendered successfully
          </div>
        )}*/}
      </body>
    </html>
  )
}