// components/PageLayout.tsx
// Wrapper component for pages that need Header and Footer

import Header from './Header'
import Footer from './Footer'

export default function PageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
