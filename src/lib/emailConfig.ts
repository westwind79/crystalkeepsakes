/**
 * Email Configuration Utility
 * Determines whether to use Next.js API (dev/Mailhog) or PHP (production)
 */

export function getEmailEndpoint(type: 'contact' | 'order'): string {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_USE_MAILHOG === 'true'
  
  if (isDevelopment) {
    // Development: Use Next.js API routes (Mailhog compatible)
    return type === 'contact' ? '/api/contact' : '/api/order-email'
  } else {
    // Production: Use PHP endpoints
    return type === 'contact' 
      ? '/api/contact.php' 
      : '/api/send-order-notification.php'
  }
}

export function isUsingMailhog(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_USE_MAILHOG === 'true'
}
