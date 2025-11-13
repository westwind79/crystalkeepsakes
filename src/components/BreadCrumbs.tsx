<nav aria-label="Breadcrumb" className="border-b border-gray-200">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="flex items-center space-x-2 py-4 text-sm">
      <Link href="/" className="font-medium text-gray-500 hover:text-gray-900">Home</Link>
      <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
      </svg>
      <Link href="/products" className="font-medium text-gray-500 hover:text-gray-900">Products</Link>
      <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
      </svg>
      <span className="font-medium text-gray-500">{product.name}</span>
    </div>
  </div>
</nav>