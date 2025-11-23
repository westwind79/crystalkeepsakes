# Email System Configuration

This project uses a **hybrid email approach**:
- **Development**: Next.js API routes → Mailhog (SMTP testing)
- **Production**: PHP files → PHP `mail()` function

## Architecture

### Development (Local with Mailhog)
```
Contact Form → /api/contact → Nodemailer → Mailhog (localhost:1025)
Order Email  → /api/order-email → Nodemailer → Mailhog (localhost:1025)
```

### Production (GoDaddy/Server)
```
Contact Form → /api/contact.php → PHP mail() → Real email delivery
Order Email  → /api/send-order-notification.php → PHP mail() → Real email delivery
```

## Setup Instructions

### 1. Development Setup (Mailhog)

**Install Mailhog:**
```bash
# macOS
brew install mailhog
mailhog

# Linux
go install github.com/mailhog/MailHog@latest
~/go/bin/MailHog

# Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

**Access Mailhog UI:**
- Web interface: http://localhost:8025
- SMTP server: localhost:1025

**Environment Variables (.env):**
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
ORDERS_EMAIL=orders@crystalkeepsakes.com
CONTACT_EMAIL=info@crystalkeepsakes.com
```

### 2. Production Setup (PHP)

**No additional setup needed** - PHP files use the server's built-in `mail()` function.

Files used in production:
- `/public/api/contact.php` - Contact form handler
- `/api/cockpit3d/send-order-notification.php` - Order email handler

## Testing

### Test Contact Form (Development)
```bash
# Start Mailhog
mailhog

# Start Next.js dev server
npm run dev

# Visit http://localhost:3000/contact
# Submit form → Check http://localhost:8025 for email
```

### Test Order Confirmation (Development)
```bash
# Complete a test order through Stripe
# After payment → Check Mailhog for order notification
```

## How It Works

### Environment Detection
The system automatically detects the environment:

```typescript
// lib/emailConfig.ts
export function getEmailEndpoint(type: 'contact' | 'order'): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    return type === 'contact' ? '/api/contact' : '/api/order-email'
  } else {
    return type === 'contact' 
      ? '/api/contact.php' 
      : '/api/send-order-notification.php'
  }
}
```

### Contact Form Flow
1. User submits form at `/contact`
2. `getEmailEndpoint('contact')` determines the endpoint
3. Development → Next.js API → Mailhog
4. Production → PHP file → Real email

### Order Confirmation Flow
1. Payment completes → `/order-confirmation` page
2. Calls `/api/process-order`
3. `sendOrderEmail()` detects environment
4. Development → `/api/order-email` → Mailhog
5. Production → `/api/send-order-notification.php` → Real email

## Troubleshooting

### Mailhog not receiving emails
- Check Mailhog is running: `curl localhost:1025`
- Check environment: `console.log(process.env.NODE_ENV)`
- Check SMTP settings in `.env`

### Production emails not sending
- Verify PHP `mail()` is enabled on server
- Check server email logs
- Verify `From` address is allowed by server

### Force Mailhog in any environment
```env
# Add to .env
NEXT_PUBLIC_USE_MAILHOG=true
```

## File Reference

### Next.js API Routes (Development)
- `/src/app/api/contact/route.ts` - Contact form email
- `/src/app/api/order-email/route.ts` - Order confirmation email
- `/src/app/api/process-order/route.ts` - Order processing coordinator

### PHP Files (Production)
- `/public/api/contact.php` - Contact form handler
- `/api/cockpit3d/send-order-notification.php` - Order email handler

### Configuration
- `/src/lib/emailConfig.ts` - Environment detection utility
- `/.env` - Development SMTP settings
- `/.env.example` - Template with all options
