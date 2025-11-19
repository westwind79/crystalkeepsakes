# 🔐 Security Checklist Before Publishing

## ✅ Pre-Publish Verification

Before pushing to GitHub or deploying publicly, verify:

### 1. Environment Files

- [ ] `.env.local` is **NOT** in the repository
- [ ] `.env.example` contains only placeholder values
- [ ] `.gitignore` includes `.env*` patterns
- [ ] No `.env` files are tracked by git

**Verify:**
```bash
git ls-files | grep ".env"
# Should only show: .env.example
```

### 2. API Keys & Credentials

Search for exposed secrets:

```bash
# Search for Stripe keys
grep -r "sk_live_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "sk_test_" . --exclude-dir=node_modules --exclude-dir=.git

# Search for passwords
grep -r "password.*=" . --exclude-dir=node_modules --exclude-dir=.git | grep -v "your_password"
```

**Expected Result:** No real keys found (only placeholder text)

### 3. Database Credentials

- [ ] No hardcoded database passwords
- [ ] DB credentials use environment variables
- [ ] Example files show placeholder values only

### 4. Third-Party API Keys

Check for exposed:
- [ ] Cockpit3D credentials
- [ ] Email/SMTP passwords
- [ ] OAuth client secrets
- [ ] Webhook secrets

### 5. Configuration Files

Review these files for sensitive data:
- [ ] `composer.json` - No secrets
- [ ] `package.json` - No secrets
- [ ] `next.config.ts` - No hardcoded URLs/keys
- [ ] PHP files in `/api/` - Use env vars only

### 6. Documentation Files

Verify docs don't contain real credentials:
- [ ] `README.md`
- [ ] `STRIPE_CHECKOUT_SETUP.md`
- [ ] `QUICK_START.md`
- [ ] Any other `.md` files

### 7. Git History

Check if secrets were previously committed:

```bash
# Search git history for Stripe keys
git log -S "sk_live_" --all
git log -S "sk_test_" --all
```

**If found:** Use `git filter-branch` or BFG Repo-Cleaner to remove from history

## 🚨 What to Do If You Exposed Secrets

### If Already Pushed to GitHub:

1. **Immediately rotate all exposed credentials:**
   - Stripe: https://dashboard.stripe.com/apikeys → Delete and create new
   - Database: Change passwords
   - Cockpit3D: Generate new API tokens

2. **Remove from Git history:**
   ```bash
   # Using BFG Repo-Cleaner (recommended)
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. **Update all deployments** with new credentials

4. **Monitor for unauthorized usage** of old keys

## 📋 Safe Files to Commit

### ✅ Safe:
- `.env.example` (with placeholders)
- `ENV_SETUP.md`
- `SECURITY_CHECKLIST.md`
- All documentation with placeholder keys
- Source code using `process.env.VARIABLE`

### ❌ Never Commit:
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- Any file with real credentials
- Database dumps with user data
- Private keys (`.pem`, `.key` files)

## 🔍 Automated Security Scanning

### GitHub Secret Scanning

GitHub automatically scans for exposed secrets. If detected:
- You'll receive an alert
- Immediately rotate the exposed credential

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for common secret patterns
if git diff --cached | grep -E "(sk_live_|sk_test_|pk_live_|pk_test_)"; then
    echo "❌ Potential Stripe key found in commit!"
    echo "Please remove and use environment variables"
    exit 1
fi
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## 🛡️ Production Security

### Additional Steps for Production:

1. **Use Secret Management:**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Cloud Secret Manager
   - Vercel Environment Variables

2. **Enable Environment Variable Encryption**

3. **Set Up Monitoring:**
   - Stripe Dashboard → Alerts
   - Database access logs
   - API usage monitoring

4. **Regular Security Audits:**
   ```bash
   npm audit
   composer audit
   ```

5. **Update Dependencies:**
   ```bash
   npm update
   composer update
   ```

## ✅ Final Check

Before pushing to public repository:

```bash
# 1. Verify no env files tracked
git ls-files | grep -E "\.env\b|\.env\."

# 2. Search for common secret patterns
git grep -E "(sk_live|sk_test|password|secret)" | grep -v "placeholder\|example\|YOUR_"

# 3. Check current changes
git diff HEAD

# 4. Review staged files
git status
```

All should show clean results or only placeholder values.

## 📞 Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Stripe Security Best Practices](https://stripe.com/docs/security)

---

**Remember:** It's easier to prevent exposure than to clean it up afterward!
