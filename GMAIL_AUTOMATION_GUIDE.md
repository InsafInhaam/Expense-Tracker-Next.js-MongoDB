# Gmail Automation System - Setup Guide

## 🚀 Overview

Your expense tracker now includes **automated Gmail scraping** that runs nightly to detect bills, receipts, and subscriptions from your inbox. The system uses AI to parse email content and automatically creates transactions.

## 📋 Features Implemented

✅ **Gmail OAuth Integration** - Secure token-based authentication  
✅ **Automated Email Scraping** - Nightly cron job  
✅ **AI-Powered Parsing** - Gemini AI extracts transaction data  
✅ **Subscription Detection** - Identifies recurring charges (Netflix, Spotify, etc.)  
✅ **Deduplication** - Never processes same email twice  
✅ **Rate Limiting** - Cost-controlled with delays  
✅ **Background Processing** - Never blocks user experience

---

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Gmail OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Encryption Key (32 characters minimum)
ENCRYPTION_KEY=your-32-character-encryption-key!!

# Cron Job Secret (for securing cron endpoint)
CRON_SECRET=your-random-secret-string

# Existing variables (keep these)
GEMINI_API_KEY=your-gemini-api-key
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - **Authorized redirect URIs**: `http://localhost:3000/api/gmail/callback` (dev) and `https://your-domain.com/api/gmail/callback` (prod)
5. Copy Client ID and Client Secret to `.env`

### 3. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

This generates a 32-character key for encrypting OAuth tokens.

### 4. Set Cron Secret

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🕐 Cron Job Setup

The Gmail sync runs automatically via cron. Two options:

### Option A: Vercel Cron (Recommended for Vercel deployment)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Schedule: `0 2 * * *` = Every day at 2:00 AM

### Option B: External Cron Service

Use services like:

- **cron-job.org**
- **EasyCron**
- **UptimeRobot** (with webhook monitoring)

Configuration:

- **URL**: `https://your-domain.com/api/cron/gmail-sync`
- **Method**: POST
- **Header**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Schedule**: Daily at 2:00 AM (or your preferred time)

---

## 📊 Database Collections

### New Collections Created

**1. Subscriptions**

```javascript
{
  userId: ObjectId,
  merchantName: "Netflix",
  normalizedMerchant: "netflix",
  averageAmount: 15.99,
  currency: "USD",
  billingCycle: "monthly", // weekly, monthly, quarterly, yearly
  lastChargedDate: Date,
  totalSpent: 191.88,
  transactionCount: 12,
  isActive: true,
  confidence: 95,
  relatedTransactionIds: [ObjectId, ObjectId, ...],
  category: "Entertainment"
}
```

### Updated Collections

**User Model** - Added fields:

- `gmailAccessToken` (encrypted)
- `gmailRefreshToken` (encrypted)
- `gmailTokenExpiry`
- `gmailSyncState` with:
  - `lastSyncAt`
  - `processedMessageIds[]`
  - `totalEmailsProcessed`
  - `lastSyncStatus`

---

## 🎯 User Flow

1. **Connect Gmail**:
   - User clicks "Connect" in Profile page
   - Redirected to Google OAuth consent screen
   - Approves Gmail read-only access
   - Tokens encrypted and stored in database

2. **Automatic Sync** (Nightly):
   - Cron job triggers `/api/cron/gmail-sync`
   - System fetches new emails since last sync
   - Filters for financial keywords (receipt, payment, bill, invoice, etc.)
   - Gemini AI parses each email
   - High-confidence transactions saved automatically
   - Processed message IDs stored to prevent duplicates

3. **Subscription Detection**:
   - Analyzes transaction patterns
   - Identifies recurring charges from same merchant
   - Calculates billing cycle (weekly, monthly, yearly)
   - Creates Subscription records
   - Shows in dashboard

---

## 🔒 Security Features

✅ **Token Encryption** - OAuth tokens encrypted with AES-256  
✅ **Minimal Permissions** - Only read-only Gmail access  
✅ **Cron Authentication** - Secret key required for cron endpoint  
✅ **Session-Based** - All user actions require valid NextAuth session  
✅ **Deduplication** - Message IDs tracked to prevent reprocessing

---

## 📡 API Endpoints

### Gmail Connection

```
GET  /api/gmail/connect         - Initiate OAuth flow
GET  /api/gmail/callback        - Handle OAuth callback
POST /api/profile/gmail/disconnect - Disconnect Gmail
```

### Subscriptions

```
GET   /api/subscriptions         - Get all active subscriptions + spend summary
PATCH /api/subscriptions         - Update subscription (mark inactive)
```

### Cron Job

```
POST /api/cron/gmail-sync        - Trigger Gmail sync (secured with CRON_SECRET)
GET  /api/cron/gmail-sync        - Health check
```

---

## 🧪 Testing

### 1. Test Gmail Connection

```bash
# Start dev server
npm run dev

# Navigate to http://localhost:3000/profile
# Click "Connect" button
# Complete OAuth flow
# Check MongoDB to verify tokens stored
```

### 2. Test Manual Sync

```bash
# Trigger sync manually (replace YOUR_CRON_SECRET)
curl -X POST http://localhost:3000/api/cron/gmail-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check console logs for sync progress
```

### 3. Test Subscription Detection

```javascript
// Run this in MongoDB shell or create test transactions
use lume-expense-tracker
db.transactions.insertMany([
  {
    userId: ObjectId("your-user-id"),
    type: "expense",
    amount: 15.99,
    category: "Entertainment",
    note: "Netflix Monthly Subscription",
    date: ISODate("2026-01-15"),
    source: "gmail"
  },
  {
    userId: ObjectId("your-user-id"),
    type: "expense",
    amount: 15.99,
    category: "Entertainment",
    note: "Netflix Monthly Subscription",
    date: ISODate("2026-02-15"),
    source: "gmail"
  }
])

// Then call subscription detection API or wait for next sync
```

---

## 📈 Monitoring

### Check Sync Status

In MongoDB, query user's `gmailSyncState`:

```javascript
db.users.findOne({ email: "user@example.com" }, { gmailSyncState: 1 });
```

Response shows:

- `lastSyncAt` - When last sync ran
- `totalEmailsProcessed` - Lifetime count
- `lastSyncStatus` - "success", "error", or "in-progress"
- `processedMessageIds` - Array of processed Gmail message IDs

---

## 🚨 Troubleshooting

### Issue: "Gmail not connected"

- Check if tokens exist in database
- Verify OAuth callback URL matches Google Console
- Ensure user completed OAuth flow

### Issue: "No emails processed"

- Check Gmail query filters in `gmailService.ts`
- Verify user has financial emails in last 30 days
- Check Gemini API rate limits

### Issue: "Duplicate transactions"

- Verify `processedMessageIds` array is being updated
- Check deduplication logic in `gmailSync.ts`

### Issue: "Low confidence transactions not saving"

- Confidence threshold is 50% (configurable)
- Check Gemini parsing prompt in `gmailSync.ts`
- Review email body content format

---

## 💰 Cost Estimation

### Gemini API (Flash model)

- ~500 tokens per email parse
- 50 emails/night = 25,000 tokens
- At $0.075 per 1M tokens ≈ **$0.002/night**
- Monthly cost ≈ **$0.06**

### Gmail API

- Free quota: 1 billion queries/day
- Your usage: ~50 queries/night
- Cost: **$0**

**Total monthly cost: ~$0.06** ✅

---

## 🎉 Next Steps

1. ✅ Connect Gmail in Profile page
2. ✅ Set up cron job (Vercel or external)
3. ✅ Wait for first nightly sync
4. ✅ Check dashboard for auto-detected transactions
5. ✅ View detected subscriptions in future Subscriptions page

---

## 📚 File Structure

```
lib/
  encryption.ts           - Token encryption/decryption
  gmailService.ts         - Gmail API client & OAuth
  gmailSync.ts            - Main sync logic + AI parsing
  subscriptionDetector.ts - Recurring pattern detection

models/
  User.ts                 - Extended with Gmail sync state
  Subscription.ts         - New subscription model

app/api/
  gmail/
    connect/route.ts      - OAuth initiation
    callback/route.ts     - OAuth callback handler
  subscriptions/route.ts  - Subscription CRUD
  cron/
    gmail-sync/route.ts   - Scheduled sync endpoint
```

---

## ✨ Features Still Available

- Manual transaction entry
- Voice input parsing
- Receipt upload
- Email transaction parsing (manual)
- AI-powered categorization
- Currency selection
- Usage tracking

Gmail automation runs silently in the background without affecting any existing features!
