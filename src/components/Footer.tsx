// components/Footer.tsx
// Version: 2.0.0 | Date: 2025-11-02
// Converted from Bootstrap to Tailwind CSS
// CHANGELOG: Removed all Bootstrap classes, replaced with Tailwind utilities

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-dark-surface text-text-secondary py-12 border-t border-border-subtle">
      <div className="w-full max-w-7xl mx-auto px-4">
        
        {/* Footer Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          <div>
            <h5 className="text-text-primary text-lg font-semibold mb-4">
              CrystalKeepsakes
            </h5>
            <p className="text-text-tertiary text-sm">
              Preserving memories in crystal since 2020
            </p>
          </div>
          
          {/* Products Links */}
          <div>
            <h6 className="text-text-primary text-base font-semibold mb-4">
              Products
            </h6>
            <ul className="space-y-2 list-none p-0 m-0">
              <li>
                <Link 
                  href="/products" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  All Crystals
                </Link>
              </li>
              <li>
                <Link 
                  href="/products/rectangles" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  Rectangles
                </Link>
              </li>
              <li>
                <Link 
                  href="/products/hearts" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  Hearts
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h6 className="text-text-primary text-base font-semibold mb-4">
              Support
            </h6>
            <ul className="space-y-2 list-none p-0 m-0">
              <li>
                <Link 
                  href="/faq" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  href="/shipping" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  Shipping
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Links */}
          <div>
            <h6 className="text-text-primary text-base font-semibold mb-4">
              Company
            </h6>
            <ul className="space-y-2 list-none p-0 m-0">
              <li>
                <Link 
                  href="/about" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/process" 
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  Our Process
                </Link>
              </li>
              <li>
                <Link 
                  href="https://x.com/3DKeepsakes" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-brand-400 transition-colors text-sm no-underline"
                >
                  Follow Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Divider */}
        <hr className="border-border-subtle my-8" />
        
        {/* Copyright */}
        <div className="text-center text-text-tertiary text-sm">
          <p className="m-0">
            &copy; 2025 Crystal Keepsakes. All rights reserved. | Without Prejudice
          </p>
        </div>
      </div>
    </footer>
  )
}