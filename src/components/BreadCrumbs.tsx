import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 py-4 text-sm">
          <Link href="/" className="breadcrumb-link font-medium">
            Home
          </Link>
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              {item.href ? (
                <Link href={item.href} className="breadcrumb-link font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-500">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
