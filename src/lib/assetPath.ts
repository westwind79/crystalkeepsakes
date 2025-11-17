// Helper to add basePath to asset URLs
export function assetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  // Don't add basePath if it's already there or if it's an external URL
  if (path.startsWith('http') || path.startsWith(basePath)) {
    return path
  }
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${basePath}${cleanPath}`
}
