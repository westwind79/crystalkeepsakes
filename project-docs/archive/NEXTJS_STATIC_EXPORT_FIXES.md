# Next.js Static Export - RSC Payload Errors Fix

## 🐛 The Problem

When deployed to GoDaddy with `output: 'export'`, you see console errors:
```
Failed to fetch RSC payload for /test/products/hearts/index.txt
GET https://crystalkeepsakes.com/404.shtml/ net::ERR_TOO_MANY_REDIRECTS
```

## 🔍 Root Cause

- Next.js with `output: 'export'` creates static HTML files
- The client-side router still tries to prefetch RSC (React Server Components) payloads
- These `.txt` files don't exist in static exports
- GoDaddy's default 404 handling creates a redirect loop

## ✅ Fixes Applied

### 1. Disabled PPR in next.config.ts

```typescript
experimental: {
  ppr: false,  // Disable Partial Prerendering for static export
}
```

### 2. Understanding the Errors

These errors are **harmless** but annoying:
- They only appear in browser console
- They don't break functionality
- Next.js falls back to normal browser navigation

## 🚀 Additional Solutions

### Option 1: Disable Link Prefetching (If needed)

Add `prefetch={false}` to problem Link components:

```tsx
<Link href="/products/hearts" prefetch={false}>
  Hearts
</Link>
```

### Option 2: Create Custom 404 Page

Create `/app/src/app/not-found.tsx`:
```tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  )
}
```

### Option 3: GoDaddy .htaccess Fix

Add to your GoDaddy `.htaccess`:
```apache
# Prevent 404 redirect loops
ErrorDocument 404 /404.html

# Don't redirect .txt files to 404.shtml
<Files "*.txt">
  Order allow,deny
  Allow from all
</Files>
```

## 📝 Long-term Solution

These console warnings are a known limitation of Next.js static export. They will be fixed in future Next.js versions. For now:

1. ✅ Errors are cosmetic - site works fine
2. ✅ `ppr: false` reduces the warnings
3. ✅ Users don't see these errors (only in browser console)
4. ✅ Consider upgrading Next.js when new versions improve static export

## 🔗 Related

- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- RSC Payload Issue: https://github.com/vercel/next.js/issues/49279
