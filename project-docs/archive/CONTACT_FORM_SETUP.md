# Contact Form Setup Guide

## Overview
The contact form has been enhanced with:
- ✅ Topic dropdown (Problem with Order, Website Issue, Product Question, Custom Request, Other)
- ✅ Conditional order number field (shown when "Problem with Order" is selected)
- ✅ Email notifications sent to both admin and customer
- ✅ Form validation
- ✅ Success/error feedback messages

## Testing with MailHog (Local Development)

### What is MailHog?
MailHog is an email testing tool that captures emails sent from your application without actually sending them. Perfect for development!

### Installation

**Option 1: Using Docker (Recommended)**
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

**Option 2: Using Homebrew (Mac)**
```bash
brew install mailhog
mailhog
```

**Option 3: Download Binary**
- Download from: https://github.com/mailhog/MailHog/releases
- Run the executable

### Access MailHog Web UI
Once running, open your browser to:
```
http://localhost:8025
```

You'll see all emails sent from your application here!

### Configuration
The `.env` file is already configured for MailHog:
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
```

## Testing the Contact Form

1. **Start MailHog** (using one of the methods above)

2. **Start your Next.js app**
   ```bash
   yarn dev
   ```

3. **Navigate to Contact Page**
   ```
   http://localhost:3000/contact
   ```

4. **Fill out the form:**
   - Name: Test User
   - Email: test@example.com
   - Topic: Problem with Order
   - Order Number: ORD-12345
   - Message: Test message

5. **Check MailHog** at `http://localhost:8025`
   - You should see **2 emails**:
     - One to admin (info@crystalkeepsakes.com)
     - One confirmation to customer (test@example.com)

## Production Setup (GoDaddy)

### Step 1: Update Environment Variables
Edit `.env` (or `.env.production` for deployment):

```env
# GoDaddy SMTP Settings
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-godaddy-email-password
SMTP_FROM="CrystalKeepsakes <noreply@crystalkeepsakes.com>"
CONTACT_EMAIL=info@crystalkeepsakes.com
```

### Step 2: Configure GoDaddy Email
1. Log into your GoDaddy account
2. Go to Email & Office Dashboard
3. Create an email account (e.g., `noreply@crystalkeepsakes.com`)
4. Enable SMTP access if needed
5. Use those credentials in your `.env` file

### Important Notes for Production:
- **SPF Records**: Add GoDaddy to your domain's SPF record to prevent spam
- **DKIM**: Enable DKIM signing in GoDaddy for better deliverability
- **Rate Limiting**: Consider adding rate limiting to prevent spam
- **Monitoring**: Set up email delivery monitoring

## Troubleshooting

### Emails not appearing in MailHog
1. Check if MailHog is running: `curl http://localhost:8025`
2. Check console for errors
3. Verify SMTP_PORT=1025 in `.env`
4. Restart your Next.js app after changing `.env`

### Emails going to spam (Production)
1. Set up SPF record: `v=spf1 include:secureserver.net ~all`
2. Enable DKIM in GoDaddy
3. Set up DMARC policy
4. Use a verified "From" address
5. Avoid spam trigger words in subject/body

### Form submission fails
1. Check browser console for errors
2. Check Next.js terminal for API errors
3. Verify all required fields are filled
4. Check network tab in DevTools

## API Endpoint
The contact form submits to:
```
POST /api/contact
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "topic": "order_problem",
  "orderNumber": "ORD-12345",
  "comment": "I have an issue with my order"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

**Response (Error):**
```json
{
  "error": "Error message here"
}
```

## File Structure
```
/crystalkeepsakes/
├── src/
│   ├── app/
│   │   ├── contact/
│   │        └── page.tsx                      # Contact form UI
── api/
│   └── contact.php                            # Email sending API
│                          
├──.env                                        # Local environment config
├── .env.example                               # Example config
└── project-docs/CONTACT_FORM_SETUP.md         # This file
```

## Features Implemented

### 1. Topic Dropdown
Users can select from:
- Problem with Order
- Website Issue
- Product Question
- Custom Design Request
- Other

### 2. Conditional Order Number Field
- Only shows when "Problem with Order" is selected
- Required field with validation
- Highlighted with yellow background for visibility

### 3. Email Notifications
**Admin Email** includes:
- Customer name and contact info
- Selected topic
- Order number (if applicable)
- Full message

**Customer Confirmation** includes:
- Personalized greeting
- Topic confirmation
- Order number reference
- Copy of their message
- Professional signature

### 4. Form Validation
- Required field checks
- Email format validation
- Conditional validation for order number
- Real-time error display

### 5. User Feedback
- Loading state during submission
- Success message (green)
- Error message (red)
- Form reset after successful submission

## Next Steps

1. ✅ Test locally with MailHog
2. ⬜ Set up GoDaddy SMTP credentials
3. ⬜ Configure SPF/DKIM records
4. ⬜ Test in staging environment
5. ⬜ Deploy to production
6. ⬜ Monitor email deliverability

## Support
For issues or questions, refer to:
- Nodemailer docs: https://nodemailer.com/
- MailHog: https://github.com/mailhog/MailHog
- GoDaddy SMTP: https://www.godaddy.com/help/server-and-port-settings-for-workspace-email-6949
