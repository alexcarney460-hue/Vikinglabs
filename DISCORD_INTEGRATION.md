# Discord Integration Implementation Guide

## Overview

This document describes the Discord integration for Viking Labs, enabling:
1. **Automatic Discord invite generation** for affiliate welcome emails
2. **Automatic Discord invite generation** for first-purchase customer emails
3. **Website "Join Discord" CTA** in header navigation
4. **Idempotent email tracking** to prevent duplicate Discord invites

## What Was Added

### New Files

1. **`/src/lib/discordInvites.ts`**
   - Core utility for managing Discord invites
   - Handles unique invite creation via Discord API
   - Falls back to stable invite link if API fails
   - Persists invite metadata for idempotency

2. **`/src/emails/DiscordCta.tsx`**
   - Shared email component for Discord CTAs
   - Used by both affiliate and customer welcome emails
   - Styled to match brand

3. **`/src/app/api/customers/welcome/route.ts`**
   - New API endpoint: `POST /api/customers/welcome`
   - Triggers first-purchase welcome email
   - Accepts `email`, `name`, `orderAmount`

### Modified Files

1. **`/src/lib/affiliates.ts`**
   - Added import of `discordInvites` utilities
   - Updated `sendWelcomeEmail()` to include Discord CTA block
   - New function: `sendFirstPurchaseEmail()`

2. **`/src/components/Header.tsx`**
   - Added "Discord" link to desktop navigation
   - Added "Discord" link to mobile menu
   - Uses `NEXT_PUBLIC_DISCORD_INVITE_URL` env var (with fallback)

3. **`.env.example`**
   - Added Discord configuration section
   - Added email configuration section

## Database Schema

### New Table: `discord_invite_records`

```sql
CREATE TABLE IF NOT EXISTS discord_invite_records (
  id uuid PRIMARY KEY,
  user_email text NOT NULL,
  flow_type text NOT NULL,
  discord_invite_code text NOT NULL,
  created_at timestamptz NOT NULL,
  sent_at timestamptz NULL,
  UNIQUE(user_email, flow_type)
);
```

**Note:** This table is automatically created on first use via `ensureDiscordInviteTable()`.

### Flow Types

- `affiliate_welcome` - Sent when an affiliate is approved
- `customer_first_purchase` - Sent when a customer makes their first purchase

## Environment Variables

### Required (Discord)

```env
DISCORD_BOT_TOKEN=<bot-token>
DISCORD_GUILD_ID=<your-guild-id>
DISCORD_AFFILIATE_INVITE_CHANNEL_ID=<channel-id>
DISCORD_CUSTOMER_INVITE_CHANNEL_ID=<channel-id>
```

### Optional (Discord)

```env
DISCORD_FALLBACK_INVITE_URL=https://discord.gg/vikinglabs
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/vikinglabs
DISCORD_AFFILIATE_ROLE_ID=<role-id>
```

### Email Configuration

```env
RESEND_API_KEY=<resend-api-key>
AFFILIATE_EMAIL=affiliates@vikinglabs.co
CUSTOMER_EMAIL=support@vikinglabs.co
```

### SMTP Fallback (Optional)

```env
SMTP_HOST=mail.example.com
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_PORT=587
SMTP_SECURE=false
```

## Setup Instructions

### 1. Discord Bot Configuration

#### Create a Bot Application

1. Go to [Discord Developer Portal](https://discord.dev)
2. Click "New Application"
3. Go to "Bot" section and click "Add Bot"
4. Under "TOKEN", click "Copy" to get your bot token
5. Set as `DISCORD_BOT_TOKEN`

#### Configure Bot Permissions

Your bot needs these permissions:
- `manage_channels` (to create invites)
- `read_message_history` (optional)

Invite URL: `https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=16&scope=bot`

#### Get Guild ID

1. Enable Developer Mode in Discord settings
2. Right-click your server → "Copy Server ID"
3. Set as `DISCORD_GUILD_ID`

#### Create Invite Channels

1. Create two channels in your Discord server:
   - `#affiliate-invites` (for affiliate welcome links)
   - `#customer-invites` (for customer welcome links)
2. Right-click each → "Copy Channel ID"
3. Set as `DISCORD_AFFILIATE_INVITE_CHANNEL_ID` and `DISCORD_CUSTOMER_INVITE_CHANNEL_ID`

#### (Optional) Create Affiliate Role

If you want to auto-assign roles to affiliates:
1. Create a role (e.g., "Affiliate Partner")
2. Right-click → "Copy Role ID"
3. Set as `DISCORD_AFFILIATE_ROLE_ID`

### 2. Vercel Environment Setup

Add the following to your Vercel project environment variables:

```
DISCORD_BOT_TOKEN
DISCORD_GUILD_ID
DISCORD_AFFILIATE_INVITE_CHANNEL_ID
DISCORD_CUSTOMER_INVITE_CHANNEL_ID
DISCORD_FALLBACK_INVITE_URL
NEXT_PUBLIC_DISCORD_INVITE_URL
RESEND_API_KEY (if using Resend)
```

### 3. Email Provider Setup

#### Option A: Resend (Recommended)

1. Get API key from [Resend](https://resend.com)
2. Set `RESEND_API_KEY` in Vercel

#### Option B: SMTP

Configure these in Vercel:
```
SMTP_HOST
SMTP_USER
SMTP_PASS
SMTP_PORT
SMTP_SECURE
```

## Integration Points

### Affiliate Welcome Email

**Current Flow:** Already implemented when affiliate is approved via `/api/affiliates/[id]/welcome`

**What changed:**
- Discord CTA block automatically included
- Unique Discord invite link generated and tracked
- If invite creation fails, falls back to stable link

### First-Purchase Email

**New Flow:** Called from checkout success or Stripe webhook

**To trigger from checkout success page:**

Add to `/src/app/checkout/success/page.tsx` (client-side):

```typescript
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Example: Trigger first-purchase email
    // In production, get email from Stripe session data
    const email = sessionStorage.getItem('checkout_email');
    const name = sessionStorage.getItem('checkout_name');
    
    if (email) {
      fetch('/api/customers/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || 'Customer',
          orderAmount: undefined, // Set from order data
        }),
      }).catch(err => console.warn('Welcome email send failed:', err));
    }
  }, []);

  return (
    // ... existing JSX
  );
}
```

**Better: Use Stripe Webhook**

Create `/src/app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendFirstPurchaseEmail } from '@/lib/affiliates';
import { stripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;
    const email = charge.billing_details?.email || charge.receipt_email;
    
    if (email && charge.paid) {
      try {
        await sendFirstPurchaseEmail({
          customerEmail: email,
          customerName: charge.billing_details?.name,
          orderAmount: charge.amount,
        });
      } catch (error) {
        console.error('First-purchase email failed:', error);
        // Don't fail the webhook; log and continue
      }
    }
  }

  return NextResponse.json({ received: true });
}
```

### Manual API Endpoint

Trigger first-purchase email directly:

```bash
curl -X POST https://vikinglabs.co/api/customers/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "name": "John Doe",
    "orderAmount": 5000
  }'
```

## Testing

### 1. Test Discord Invite Creation

```bash
# From Node.js console or script
import { getDiscordInviteUrl } from '@/lib/discordInvites';

const url = await getDiscordInviteUrl({
  flowType: 'affiliate_welcome',
  userEmail: 'test@example.com',
});
console.log(url);
```

### 2. Test Affiliate Welcome Email

Use the existing admin endpoint:

```bash
curl -X POST https://vikinglabs.co/api/affiliates/{affiliate_id}/welcome \
  -H "Cookie: <admin-session-cookie>"
```

### 3. Test First-Purchase Email

```bash
curl -X POST https://vikinglabs.co/api/customers/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test Customer",
    "orderAmount": 5000
  }'
```

## Error Handling & Fallbacks

### Discord API Failures

If Discord API returns an error or is unavailable:
1. Unique invite creation fails
2. Falls back to `DISCORD_FALLBACK_INVITE_URL`
3. Email still sends with fallback link
4. Error is logged for monitoring

### Email Failures

If email provider is unavailable:
1. `sendWelcomeEmail()` and `sendFirstPurchaseEmail()` throw
2. Caller must handle retry logic
3. For affiliate approval: error is logged, webhook notified
4. For first-purchase: webhook responds with error (don't mark as processed)

### Database Unavailability

If Supabase and Postgres are both unavailable:
1. Invite tracking fails
2. Falls back to using stable invite link
3. Warning logged
4. Email still sends with fallback link

## Monitoring & Logging

All functions include console logging:
- `[getDiscordInviteUrl]` - Invite creation and lookup
- `[createUniqueDiscordInvite]` - Discord API calls
- `[sendWelcomeEmail]` - Email sending flow
- `[sendFirstPurchaseEmail]` - First-purchase email flow

**In production, integrate these logs with your monitoring service (e.g., Sentry, Datadog, LogRocket).**

## Idempotency

### Affiliate Welcome

The same affiliate approval can be safely retried:
- If Discord invite already created → reuses same invite
- Email is resent each time (consider adding `email_sent` flag to prevent duplicate emails)

### First-Purchase Email

The same customer email can only generate one Discord invite:
- Unique constraint on `(user_email, flow_type)` prevents duplicates
- `hasDiscordInviteBeenSent()` checks before sending
- Safe to retry

## Security Notes

1. **Discord Bot Token**: Never log or expose. Store in Vercel secrets only.
2. **Invite Links**: Unique invites are single-use by default. Set `max_uses: 1` in API.
3. **Email Verification**: Verify customer email before sending (handled by Stripe/checkout).
4. **Rate Limiting**: Discord API has rate limits. Consider caching invites within time windows.

## Troubleshooting

### Invites Not Creating

1. Check `DISCORD_BOT_TOKEN` is valid
2. Verify bot has `manage_channels` permission
3. Check channel IDs are correct
4. Verify channels exist in guild
5. Check logs for Discord API errors

### Emails Not Sending

1. Check email provider credentials (`RESEND_API_KEY` or SMTP settings)
2. Verify sender email is verified (Resend/SMTP)
3. Check spam folder
4. Review email provider logs

### Idempotency Issues

1. Ensure database migrations ran (table created)
2. Check for `UNIQUE(user_email, flow_type)` constraint
3. Verify `hasDiscordInviteBeenSent()` logic

## Future Enhancements

1. **Discord Message on Join**: Post to #announcements when user joins
2. **Role Auto-Assignment**: Automatically assign roles based on purchase tier
3. **Community Insights**: Track Discord growth, engagement metrics
4. **Email Customization**: A/B testing different Discord CTAs
5. **Webhook Signing**: Sign all requests for security

## Rollback

If you need to disable Discord invites temporarily:

1. Set `DISCORD_BOT_TOKEN` to empty string
2. All invite creation will fail gracefully to fallback
3. Emails will still send with stable invite link

To disable first-purchase emails:
1. Remove calls to `sendFirstPurchaseEmail()` from webhooks
2. Restart/redeploy

No database cleanup needed; it's all safe.
