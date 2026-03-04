# 🎙️ Voice-to-Text Transaction Input

## Overview

This feature allows users to create transactions using voice commands. The system uses the browser's built-in SpeechRecognition API to capture speech and the Gemini AI API to intelligently parse transaction details.

## Features

### 🎤 Voice Recognition

- Browser-based speech recognition (no external dependencies)
- Real-time transcript display
- Visual feedback during recording
- Supports natural language input

### 🤖 AI-Powered Parsing

- Powered by Google's Gemini 1.5 Flash model
- Extracts: amount, category, date, transaction type
- Understands natural language dates ("yesterday", "last Monday", etc.)
- Matches categories intelligently
- Preserves original statement as note

### ✅ Confirmation Modal

- Shows parsed results before saving
- Allows editing all fields
- Visual AI badge indicator
- Date formatting for readability

## How It Works

### 1. User Flow

1. Click the **purple microphone button** (next to the "+" FAB)
2. Grant microphone permission if prompted
3. Speak your transaction naturally
4. Review the live transcript
5. Click "Parse Transaction"
6. AI processes and extracts details
7. Review and edit in confirmation modal
8. Click "Confirm & Save" to add transaction

### 2. Example Voice Commands

**Expenses:**

- "Spent 1500 rupees on food yesterday"
- "Paid 300 for transport today"
- "Bought groceries for 2500 last Monday"
- "Entertainment expense of 800 on Friday"

**Income:**

- "Earned 50000 from salary today"
- "Received 15000 freelance payment yesterday"
- "Got 5000 as a gift on my birthday"
- "Investment return of 12000 this week"

### 3. Natural Language Date Parsing

The AI understands various date formats:

- **"today"** → Current date
- **"yesterday"** → Previous day
- **"last Monday"** → Most recent Monday
- **"March 1"** → Specific date
- **"2 days ago"** → Relative dates

## Technical Implementation

### Components

#### 1. VoiceInput Component (`components/VoiceInput.tsx`)

- Uses browser's SpeechRecognition API
- Displays live transcript
- Animated microphone button
- Example phrases guide
- Error handling for unsupported browsers

**Key Features:**

- Continuous interim results
- Visual recording indicator
- Stop/start toggle
- Automatic cleanup on close

#### 2. ConfirmationModal Component (`components/ConfirmationModal.tsx`)

- Displays parsed transaction data
- Editable fields (all standard transaction fields)
- Type toggle (Income/Expense)
- Category dropdown (context-aware)
- Date picker with validation
- Note field (200 char limit)
- AI badge indicator

**Key Features:**

- Pre-filled with AI-parsed data
- Full edit capability
- Validation before submission
- Cancel without saving

#### 3. API Route (`app/api/parse-transaction/route.ts`)

- Authenticates user session
- Calls Gemini API with structured prompt
- Validates API key
- Parses JSON response
- Error handling and validation

**Gemini Configuration:**

```typescript
{
  model: "gemini-1.5-flash",
  temperature: 0.1,  // Low for consistent parsing
  topK: 1,
  topP: 1,
  maxOutputTokens: 256
}
```

### Data Flow

```
User Speech
    ↓
SpeechRecognition API
    ↓
Text Transcript
    ↓
VoiceInput Component
    ↓
POST /api/parse-transaction
    ↓
Gemini API
    ↓
Parsed JSON Response
    ↓
ConfirmationModal
    ↓
User Review & Edit
    ↓
POST /api/transactions
    ↓
MongoDB
    ↓
Dashboard Update
```

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key

### 2. Configure Environment Variable

Add to your `.env` file:

```bash
# Gemini API for voice transaction parsing
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

### 4. Browser Compatibility

Voice input requires a browser that supports SpeechRecognition:

- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Edge
- ✅ Safari (macOS 14.1+, iOS 14.5+)
- ❌ Firefox (limited support)

**Note:** HTTPS is required for microphone access in production.

## API Prompt Engineering

The system uses a carefully crafted prompt to ensure accurate parsing:

### Key Instructions:

1. **Type Detection:** Keywords like "spent"/"paid" = expense, "earned"/"received" = income
2. **Amount Extraction:** Removes currency symbols, returns pure number
3. **Category Mapping:** Uses predefined categories for consistency
4. **Date Intelligence:** Converts natural language to ISO format (YYYY-MM-DD)
5. **Note Preservation:** Keeps original statement for context

### Category Lists:

**Income Categories:**

- Salary, Freelance, Investment, Business, Gift, Refund, Other

**Expense Categories:**

- Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Groceries, Other

### Response Format:

```json
{
  "type": "income" | "expense",
  "amount": number,
  "category": "exact category name",
  "date": "YYYY-MM-DD",
  "note": "original statement"
}
```

## Error Handling

### Browser Compatibility

- Detects SpeechRecognition support on mount
- Shows error message if unavailable
- Graceful degradation (manual input still works)

### API Errors

- Session validation (401 if not authenticated)
- API key validation (500 if missing)
- Gemini API failures (network/rate limit)
- JSON parsing errors
- Field validation errors

### User Feedback

- Error messages in red alert boxes
- Processing overlay during AI parse
- Success toast after saving
- Cancel option at every step

## UI/UX Details

### Voice Button

- **Position:** Fixed bottom-right, left of main FAB
- **Color:** Purple gradient (distinguishes from main action)
- **Icon:** Microphone
- **Animation:** Scale on tap, shadow on hover

### Recording State

- **Button:** Pulsing red circle
- **Icon:** Stop square
- **Text:** "Listening..."

### Confirmation Modal

- **Header:** Gradient background with "Confirm Transaction"
- **Fields:** All editable with Apple-style inputs
- **Badge:** Purple "Parsed by Gemini AI" indicator
- **Actions:** Cancel (gray) and Confirm (black gradient)

### Processing State

- Full-screen overlay with backdrop blur
- Centered spinner with purple accent
- "Processing..." text

## Security Considerations

### API Key Protection

- Stored in `.env` (not committed to git)
- Only accessed server-side in API route
- Never exposed to client

### Authentication

- All API routes check user session
- Unauthorized requests return 401
- Transactions tied to authenticated user

### Input Validation

- User confirmation required before saving
- All fields validated on backend
- Amount must be positive
- Type must be "income" or "expense"
- Category must match predefined list

## Performance

### API Costs

- Gemini 1.5 Flash: Free tier includes 15 requests/minute
- Average tokens per request: ~150-200
- Cost: Highly economical for typical usage

### Response Time

- Speech recognition: Real-time
- Gemini API: ~1-2 seconds
- Total flow: ~3-5 seconds

### Optimization

- Low temperature (0.1) for consistency
- Short max tokens (256) for speed
- Structured prompt for reliable parsing
- No streaming (simpler implementation)

## Future Enhancements

### Potential Features

- [ ] Multi-language support
- [ ] Batch transactions ("spent 500 on food and 300 on transport")
- [ ] Voice editing of existing transactions
- [ ] Custom wake word ("Hey Finance")
- [ ] Offline transcript buffer
- [ ] Voice feedback confirmation
- [ ] Accent/dialect training
- [ ] Transaction templates from voice history

### Technical Improvements

- [ ] WebSpeech API polyfill for Firefox
- [ ] Retry logic for API failures
- [ ] Rate limiting UI feedback
- [ ] Progressive enhancement
- [ ] Voice command shortcuts

## Troubleshooting

### "Speech recognition not supported"

- Use Chrome, Edge, or Safari
- Update browser to latest version
- Check browser compatibility table

### "Failed to parse transaction"

- Check Gemini API key is valid
- Verify API key has quota remaining
- Check network connection
- Review API logs in terminal

### Inaccurate Parsing

- Speak clearly and naturally
- Use explicit keywords ("spent", "earned")
- Include amount with currency mention
- Review and edit in confirmation modal

### Microphone Not Working

- Grant microphone permission when prompted
- Check system microphone settings
- Ensure no other app is using microphone
- Use HTTPS in production

---

**Built with:** Next.js 15, TypeScript, Gemini 1.5 Flash, Web Speech API

**Status:** ✅ Production Ready (requires Gemini API key)
