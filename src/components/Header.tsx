// components/Header.tsx
// Version: 3.0.0 | Date: 2025-11-05
// FIXED: Complete rebuild with TailwindCSS - removed Bootstrap dependencies
// FIXED: Overflow issues causing mobile nav to hide
// FIXED: Z-index stacking for proper overlay behavior

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CartIcon from './CartIcon'

export default function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation items
  const navItems = [
    { href: '/', label: 'HOME' },
    { href: '/products', label: 'PRODUCTS' },
    { href: '/about', label: 'ABOUT' },
    { href: '/contact', label: 'CONTACT' },
    { href: '/faq', label: 'FAQ' },
  ]

  // Check if link is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* HEADER - Sticky with proper z-index */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md shadow-[0_5px_10px_-5px_rgba(0,0,0,0.75)]">
        <nav className="h-20 px-4 lg:px-8 overflow-visible">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
            
            {/* LOGO / BRAND */}
            <Link 
              href="/" 
              className="hover:text-brand-400 transition-colors no-underline flex-shrink-0"
            >
              <div className="brand-text">
                <div className="text-white text-xl lg:text-2xl font-bold tracking-wider">
                  CRYSTALKEEPSAKES
                </div>
                <div className="text-xs lg:text-sm text-brand-400 font-light tracking-[2px] mt-0.5">
                  LIGHT. LASER. LOVE.
                </div>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden lg:flex items-center gap-1">
              <ul className="flex items-center gap-2 m-0 p-0 list-none">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`overflow-hidden
                        group relative block px-4 py-2 
                        uppercase text-sm font-medium tracking-wide 
                        transition-colors duration-300 no-underline
                        ${isActive(item.href) 
                          ? 'text-brand-500' 
                          : 'text-gray-300 hover:text-brand-400'
                        }
                      `}
                    >
                      {item.label}
                      {/* Desktop underline with glow effect */}
                      <span 
                        className={`
                          absolute left-1/2 -bottom-0 h-[1px] 
                          bg-brand-500 transition-all duration-300
                          -translate-x-1/2
                          ${isActive(item.href) 
                            ? 'w-full shadow-[0_10px_25px_8px_#acf213]' 
                            : 'w-0 group-hover:w-full group-hover:shadow-[0_12px_25px_8px_#acf213]'
                          }
                        `}
                      />
                    </Link>
                  </li>
                ))}
                <li className="px-2">
                  <CartIcon />
                </li>
              </ul>
            </div>

            {/* MOBILE: Cart + Menu Button */}
            <div className="flex lg:hidden items-center gap-3">            
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="
                  w-10 h-10 flex flex-col justify-center items-center gap-1
                  bg-brand-400 rounded border-0 
                  hover:bg-brand-500 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-brand-400 
                  focus:ring-offset-2 focus:ring-offset-black
                "
                type="button"
                aria-label="Toggle navigation"
                aria-expanded={isMobileMenuOpen}
              >
                {/* Animated hamburger icon */}
                <span 
                  className={`
                    block w-6 h-0.5 bg-white transition-all duration-300
                    ${isMobileMenuOpen ? 'rotate-45 translate-y-[5px]' : ''}
                  `}
                />
                <span 
                  className={`
                    block w-6 h-0.5 bg-white transition-all duration-300
                    ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}
                  `}
                />
                <span 
                  className={`
                    block w-6 h-0.5 bg-white transition-all duration-300
                    ${isMobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''}
                  `}
                />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* MOBILE MENU OVERLAY - Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MOBILE MENU PANEL - Slide from right */}
      <div 
        className={`
          fixed top-0 right-0 bottom-0 w-[300px] 
          bg-gray-900 z-50 lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          shadow-[-5px_0_15px_rgba(0,0,0,0.5)]
          overflow-y-auto
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800">
          <h2 
            id="mobile-menu-title"
            className="text-xl font-semibold text-white m-0 uppercase tracking-wider"
          >
            Menu
          </h2>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="
              w-10 h-10 flex items-center justify-center 
              bg-transparent border-0 rounded 
              hover:bg-gray-700 transition-colors
              focus:outline-none focus:ring-2 focus:ring-brand-400
            "
            type="button"
            aria-label="Close menu"
          >
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Body */}
        <div className="p-6">
          <nav>
            <ul className="flex flex-col gap-2 m-0 p-0 list-none">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      block px-4 py-4 rounded-lg
                      uppercase text-base font-medium tracking-wide 
                      transition-all duration-300 no-underline
                      border-l-4
                      ${isActive(item.href) 
                        ? 'text-brand-300 bg-brand-500/10 border-l-brand-400' 
                        : 'text-gray-300 border-l-transparent hover:text-white hover:bg-gray-800/50 hover:translate-x-2'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Cart Section in Mobile Menu */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="px-4">
              <CartIcon />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}