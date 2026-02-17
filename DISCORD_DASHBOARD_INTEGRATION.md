# Discord Dashboard Integration

**Added:** Discord invite cards to both affiliate and customer dashboards.

---

## What's New

### 1. **Affiliate Dashboard** (`/account/affiliates`)
- New card on **Overview** tab: "Join Our Community"
- Shows their **unique Discord invite link** (single-use)
- Copy-to-clipboard button
- "Join Discord" button opens invite in new tab
- Helpful tip about single-use nature

**Location**: After "Affiliate Link & Code" section in overview tab

### 2. **Customer Account Dashboard** (`/account`)
- New card in **Profile** tab: "Join Our Community"
- **Only visible** if customer has made a purchase
- Shows their **unique Discord invite link** (single-use)
- Copy-to-clipboard button
- "Join Discord" button
- Same helpful tip

**Location**: After "Research Library" section, spans full width (lg:col-span-3)

---

## Files Added

### **`/src/app/api/discord/invite/route.ts`** (56 lines)
Endpoint: `GET /api/discord/invite?flow=customer|affiliate`

**Purpose:** Returns user's Discord invite URL
- Requires authentication (NextAuth session)
- Checks user has orders if requesting customer flow
- Falls back gracefully if DB unavailable
- Returns invite URL, flow type, and user email

**Response:**
```json
{
  "ok": true,
  "inviteUrl": "https://discord.gg/ABC123XYZ",
  "flowType": "customer_first_purchase",
  "email": "user@example.com"
}
```

### **`/src/components/DiscordInviteCard.tsx`** (180 lines)
Reusable React component for displaying Discord invites.

**Props:**
```typescript
interface DiscordInviteCardProps {
  flowType?: 'affiliate' | 'customer';  // Determines API flow
  title?: string;                        // Card title
  description?: string;                  // Card subtitle
  className?: string;                    // Tailwind classes
}
```

**Features:**
- Automatic fetch from `/api/discord/invite`
- Loading state (skeleton)
- Error handling with user-friendly messages
- Copy-to-clipboard with confirmation
- "Join Discord" button opens link in new tab
- Single-use notification
- Responsive design (mobile-friendly)

---

## Files Modified

### **`/src/components/affiliate/AffiliateDashboard.tsx`**
- Added import: `import DiscordInviteCard from '../DiscordInviteCard';`
- Added card to Overview tab (after affiliate link section):
```tsx
<DiscordInviteCard
  flowType="affiliate"
  title="Join Our Community"
  description="Connect with other affiliates, get exclusive partner updates, and collaborate with the Viking Labs team."
/>
```

### **`/src/app/account/AccountClient.tsx`**
- Added import: `import DiscordInviteCard from '@/components/DiscordInviteCard';`
- Added state: `const [hasOrders, setHasOrders] = useState(false);`
- Updated useEffect to check if user has orders (via `/api/discord/invite?flow=customer`)
- Added card to Profile tab (after research library section):
```tsx
{hasOrders && (
  <div className="lg:col-span-3">
    <DiscordInviteCard
      flowType="customer"
      title="Join Our Community"
      description="Connect with other researchers, get product updates, and participate in discussions with the Viking Labs community."
    />
  </div>
)}
```

---

## How It Works

### Affiliate Flow
1. Affiliate logs into account → `/account`
2. Auto-detects affiliate status via `/api/affiliate/summary`
3. Shows "Affiliate Dashboard" tab if approved
4. User clicks "Affiliate Dashboard" tab
5. DiscordInviteCard component:
   - Fetches `/api/discord/invite?flow=affiliate`
   - Receives their unique invite URL from DB
   - Displays with copy button and join link
6. User can:
   - Copy link to share with team
   - Join directly via button
   - See it expires (single-use)

### Customer Flow
1. Customer logs into account → `/account`
2. Auto-checks for orders via `/api/discord/invite?flow=customer`
3. If user has orders, `hasOrders = true`
4. Discord card appears in Profile tab
5. DiscordInviteCard component:
   - Fetches `/api/discord/invite?flow=customer`
   - Receives their unique invite URL from DB
   - Displays with copy button and join link
6. User can join community

---

## Key Features

### ✅ Idempotency
- Same affiliate/customer always gets same invite URL
- Unique constraint on `(user_email, flow_type)` in DB
- Safe to refresh page multiple times

### ✅ Single-Use Invites
- Discord API creates invites with `max_uses: 1`
- Each user gets unique invite (can't be shared)
- UI helpfully notifies users about this

### ✅ Graceful Degradation
- If `/api/discord/invite` fails → error message, not crash
- Component shows loading state while fetching
- Can still use fallback URL if dynamic creation fails

### ✅ Security
- Requires NextAuth session (logged-in users only)
- Customer flow checks user has actual orders
- No sensitive data exposed in response

### ✅ User Experience
- Copy-to-clipboard with visual feedback
- Loading skeleton while fetching
- Helpful tip about single-use nature
- Responsive design (works on mobile)
- Matches site design/colors

---

## Testing

### Test Affiliate Card
1. Log in as affiliate → go to `/account`
2. Click "Affiliate Dashboard" tab
3. Scroll to bottom of Overview tab
4. Should see "Join Our Community" card with:
   - Your unique Discord invite link
   - Copy button (try copying)
   - Join Discord button
   - Single-use note

### Test Customer Card
1. Create test customer account
2. Make a test purchase
3. Log in → go to `/account`
4. In Profile tab, scroll down
5. Should see "Join Our Community" card with same features

### Test without Purchase
1. Create new account (no purchase)
2. Log in → go to `/account`
3. Profile tab should **not** show Discord card
4. Refresh page → still no card

---

## API Behavior

### Success (Affiliate)
```
GET /api/discord/invite?flow=affiliate
→ 200 OK
{
  "ok": true,
  "inviteUrl": "https://discord.gg/CODE1",
  "flowType": "affiliate_welcome",
  "email": "affiliate@example.com"
}
```

### Success (Customer with Orders)
```
GET /api/discord/invite?flow=customer
→ 200 OK
{
  "ok": true,
  "inviteUrl": "https://discord.gg/CODE2",
  "flowType": "customer_first_purchase",
  "email": "customer@example.com"
}
```

### Error (Customer without Orders)
```
GET /api/discord/invite?flow=customer
→ 403 Forbidden
{
  "error": "No purchase history found. Discord invite is for customers."
}
```

### Error (Not Logged In)
```
GET /api/discord/invite
→ 401 Unauthorized
{
  "error": "Unauthorized"
}
```

---

## Design Notes

### Affiliate Card
- Title: "Join Our Community"
- Color: Indigo/Blue gradient
- Description emphasizes affiliate collaboration
- Positioned in overview tab (prominent, visible immediately)

### Customer Card
- Title: "Join Our Community"  
- Same indigo/blue gradient (consistent branding)
- Description emphasizes research community
- Positioned in profile tab (secondary but accessible)
- Only shown if user has purchase history

Both cards use:
- Gradient background (from-indigo-600 to-indigo-500)
- Copy-to-clipboard button with feedback
- "Join Discord →" button
- Help text about single-use nature
- Responsive, mobile-friendly layout

---

## Database Integration

Uses existing `discord_invite_records` table:
```sql
UNIQUE(user_email, flow_type)
```

This ensures:
- Each affiliate gets exactly one invite per email
- Each customer gets exactly one invite per email
- No duplicate Discord API calls
- Safe to refresh page/retry requests

---

## Future Enhancements

1. **Show Invite History** — Display when invite was created/sent
2. **Regenerate Invite** — Button to create new invite (if old one expires)
3. **Analytics** — Track how many people joined via dashboards
4. **Discord Roles** — Auto-assign role when user joins (if available)
5. **Invite Widget** — Embed Discord server widget instead of link
6. **Member Status** — Show if user is currently in Discord (via Discord API)

---

## Troubleshooting

### Discord Card Not Appearing?

**Affiliate:**
- Check user is approved (`status = 'approved'`)
- Check `/api/affiliate/summary` returns 200

**Customer:**
- Check user has made a purchase
- Check `/api/discord/invite?flow=customer` returns 200
- Try logging out and back in

### Invite Link Not Working?

1. Click and it says "invite invalid" or "expired"?
   - Link was single-use, already consumed
   - Refresh page to get new unique invite
   - Or use fallback URL in email

2. Click but bot not in server?
   - Check bot has permissions (manage channels, create invites)
   - Check bot is actually in the guild
   - Verify channel IDs are correct

### Copy Button Not Working?

- Browser security restriction? Try:
  - Use HTTPS (not HTTP)
  - Different browser
  - Or manually copy from text field

---

## Notes

- Invites are tied to user email, not Discord username
- Each flow type (affiliate vs customer) gets separate invite
- Invites created once and cached in DB forever
- Fallback URL used if dynamic creation fails but email still sends
