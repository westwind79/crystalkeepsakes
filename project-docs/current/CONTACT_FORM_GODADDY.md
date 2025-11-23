# Contact Form - GoDaddy Setup Guide

## Problem Fixed

**Issue:** Contact form returning HTML instead of JSON on GoDaddy
**Cause:** PHP errors displayed as HTML, breaking JSON response

## Solution Applied

Updated `/public/api/contact.php` with GoDaddy-specific fixes:

1. ✅ **Output buffering** - Captures any stray HTML/errors
2. ✅ **Error suppression** - Logs errors instead of displaying
3. ✅ **Clean output** - Removes buffer before JSON response
4. ✅ **Better error handling** - Catches JSON parsing errors

## Testing on GoDaddy

### Step 1: Upload Files
Upload to your GoDaddy hosting:
- `/public/api/contact.php` → Main contact handler
- `/public/api/contact-test.php` → Diagnostic tool

### Step 2: Test the Diagnostic
Visit: `https://crystalkeepsakes.com/api/contact-test.php`

You should see JSON like:
```json
{
  "test": "Contact form test",
  "php_version": "8.x",
  "can_send_mail": true,
  "mail_test": "success"
}
```

### Step 3: Test with POST data
```bash
curl -X POST https://crystalkeepsakes.com/api/contact-test.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

Should return:
```json
{
  "received_data": {
    "name": "Test",
    "email": "test@example.com"
  },
  "json_valid": true
}
```

### Step 4: Test Real Contact Form
Submit a test message from `/contact` page

## Email Configuration

The contact form routes emails to:
- `orders@crystalkeepsakes.com` - Order problems
- `support@crystalkeepsakes.com` - Website issues  
- `admin@crystalkeepsakes.com` - Custom requests
- `info@crystalkeepsakes.com` - Default/other

**You said:** "I do have email accounts just set up emails like we have them and I'll fix that later."

So these email addresses are already configured in your GoDaddy email settings. The PHP `mail()` function should work automatically.

## Common GoDaddy Issues & Fixes

### Issue: "mail() not sending"
**Solution:** Check GoDaddy's requirements:
- From address must be from your domain (`@crystalkeepsakes.com`)
- May need to enable mail() in PHP settings
- Check spam folders

### Issue: Still getting HTML response
**Diagnosis:**
1. Check PHP version (needs 7.4+)
2. Look at raw response headers
3. Check error logs in cPanel

### Issue: CORS errors
Already handled with:
```php
header('Access-Control-Allow-Origin: *');
```

## File Changes

**Modified:** `/public/api/contact.php`
- Added output buffering
- Suppressed error display
- Clean JSON output
- Better error handling

**Created:** `/public/api/contact-test.php`
- Diagnostic tool
- Test mail() function
- Verify JSON response

## Next Steps

1. Upload files to GoDaddy
2. Run contact-test.php to diagnose
3. If mail() fails, check GoDaddy email settings
4. Test contact form on live site
5. You'll configure actual email routing later

## Build Notes

Files are in `/out/api/` after running:
```bash
npm run build:prod
```

Upload entire `/out/` directory to GoDaddy root.
