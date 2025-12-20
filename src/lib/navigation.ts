// lib/navigation.ts
// Version: 1.0.0 | Date: 2024-12-18
// Central navigation config - single source of truth for Header + Sitemap

export interface NavItem {
  href: string
  label: string
  priority?: number // For sitemap.xml
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

export const navItems: NavItem[] = [
  { href: '/', label: 'HOME', priority: 1, changeFrequency: 'daily' },
  { href: '/products', label: 'PRODUCTS', priority: 0.9, changeFrequency: 'weekly' },
  { href: '/about', label: 'ABOUT', priority: 0.7, changeFrequency: 'monthly' },
  { href: '/contact', label: 'CONTACT', priority: 0.6, changeFrequency: 'monthly' },
  { href: '/faq', label: 'FAQ', priority: 0.6, changeFrequency: 'monthly' },
]