# Email Authentication Integration — Viking Labs

Complete email signup, login, and password reset implementation.

---

## What's Included

✅ **Email Signup** — Verification code flow (6-digit code, 15-min expiry)  
✅ **Email Login** — Email + password authentication  
✅ **Password Reset** — Email link + new password form  
✅ **NextAuth Integration** — Credentials provider + JWT sessions  
✅ **Supabase Schema** — Tables for tokens + verification  
✅ **API Endpoints** — Send code, verify code, reset password  
✅ **UI Components** — Tabbed login, verification, password reset forms  

---

## Installation Steps

### 1. Install Dependencies

```bash
npm install bcryptjs nodemailer
npm install -D @types/bcryptjs
```

### 2. Update Supabase Schema

Run `src/lib/authjs/email-schema.sql` in Supabase SQL Editor:

```sql
-- Create tables for:
-- - email_verification_tokens (6-digit codes)
-- - password_reset_tokens (reset links)
-- - account_links (OAuth to email linking)
```

### 3. Update .env.local

Add email configuration (choose one method):

**Option A: SMTP (Recommended)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@vikinglabs.co
FROM_NAME=Viking Labs
```

**Option B: Development (Console Only)**
```env
# No SMTP config — codes/links printed to console
```

### 4. Update NextAuth Config

The email provider is already added to `src/lib/authjs/options.ts`:

```typescript
import { EmailCredentialsProvider } from './credentials-provider';

providers: [
  EmailCredentialsProvider, // ← Already added
  // ... OAuth providers
]
```

### 5. Copy Files

All files are ready to use. Just copy:

**Backend:**
- `src/lib/authjs/email-service.ts` — Core logic
- `src/lib/authjs/credentials-provider.ts` — NextAuth provider
- `src/lib/email.ts` — Email templates
- `src/app/api/auth/send-verification/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

**Frontend:**
- `src/app/account/login/LoginForm.tsx` — Email form component
- `src/app/account/login/page-updated.tsx` — Replace `page.tsx` with this
- `src/app/account/verify-email/page.tsx` — Verification code entry
- `src/app/account/forgot-password/page.tsx` — Reset request
- `src/app/account/reset-password/page.tsx` — Reset password form

### 6. Replace Login Page

```bash
# Backup old
mv src/app/account/login/page.tsx src/app/account/login/page.bak.tsx

# Use new
mv src/app/account/login/page-updated.tsx src/app/account/login/page.tsx
```

---

## Flows

### Email Signup Flow

```
1. User clicks "Email" tab → enters email → "Create Account"
2. → /api/auth/send-verification (sends 6-digit code)
3. → Redirects to /account/verify-email
4. → User enters 6 digits
5. → /api/auth/verify-email (creates user)
6. → Auto-signs in
7. → Redirects to /account
```

### Email Login Flow

```
1. User clicks "Email" tab → enters email + password → "Sign In"
2. → NextAuth CredentialsProvider validates
3. → User signed in
4. → Redirects to /account
```

### Password Reset Flow

```
1. User clicks "Forgot password?" → enters email
2. → /api/auth/forgot-password (sends reset link)
3. → Shows "Check your email"
4. → User clicks link → /account/reset-password?token=...
5. → Enters new password
6. → /api/auth/reset-password (updates password)
7. → Shows "Success, sign in with new password"
```

---

## Environment Variables (.env.local)

**Required:**
```env
NEXTAUTH_URL=http://localhost:3000  # or production URL
NEXTAUTH_SECRET=<generate-random>    # Run: openssl rand -base64 32
```

**Email (SMTP):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password      # Gmail: use App Password, not account password
FROM_EMAIL=noreply@vikinglabs.co
FROM_NAME=Viking Labs
```

**Supabase:**
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Testing

### Local Testing (No Email)

Leave `SMTP_*` env vars empty. Verification codes print to console:

```bash
npm run dev
# Go to http://localhost:3000/account/login
# Click "Email" → "Create Account"
# Console shows: "[DEV] Verification code for user@example.com: 123456"
```

### With Gmail SMTP

1. Enable 2FA on Gmail
2. Create App Password (not account password)
3. Set `SMTP_USER` and `SMTP_PASSWORD` in `.env.local`
4. Test signup → email arrives in inbox

### Password Reset Testing

1. Sign up with email
2. Click "Forgot password?" → enter email
3. Console shows reset link (local) or email arrives (production)
4. Click link → set new password → sign in

---

## Security Notes

✅ Passwords hashed with bcrypt (12 rounds)  
✅ Verification codes: 6-digit, single-use, 15-min expiry  
✅ Reset tokens: random hash, single-use, 1-hour expiry  
✅ Password reset doesn't reveal if email exists (security)  
✅ All API endpoints use POST with validation  
✅ RLS policies on Supabase tables (service role only)  

---

## Common Issues

### "SMTP connection failed"
- Check `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- For Gmail, use App Password (not account password)
- Ensure 2FA is enabled on Gmail

### "Email not received"
- Check spam folder
- Verify `FROM_EMAIL` and `FROM_NAME`
- Check Supabase logs for errors

### "Code expired"
- Codes expire in 15 minutes
- Show "Resend code" button (already implemented)

### "Password reset link not working"
- Check token in URL matches database
- Verify token hasn't expired (1 hour)
- Check `NEXTAUTH_URL` matches actual domain

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Run Supabase schema
3. ✅ Configure `.env.local`
4. ✅ Copy files to your project
5. ✅ Test locally (console email)
6. ✅ Set up SMTP for production
7. ✅ Deploy to Vercel

---

## Ready for Upwork?

This is **production-ready** and can be offered as:
- "Email authentication + password reset for Next.js/Supabase"
- "OAuth + email hybrid auth system"
- "Complete authentication system (5+ providers)"

**Typical client:**
- E-commerce, SaaS, community platforms
- Need multi-auth options
- ~2-3 day implementation time per client

---

## Support

Questions? Check:
- Email service: `src/lib/authjs/email-service.ts`
- API routes: `src/app/api/auth/*/route.ts`
- UI components: `src/app/account/*/page.tsx`
