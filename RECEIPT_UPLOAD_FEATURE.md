# 📸 Receipt Image Upload & OCR Feature

## Overview

This feature allows users to upload receipt images, automatically extract transaction details using Gemini Vision AI, and save them to the database. The system uses OCR (through Gemini's vision capabilities) to read receipt data and intelligently parse it into structured transaction information.

## Features

### 📤 Image Upload

- Drag & drop or click to upload
- Image preview before processing
- Supports PNG, JPG, WebP formats
- Maximum file size: 10MB
- Base64 encoding for storage

### 🤖 AI-Powered OCR & Parsing

- Powered by Google's Gemini 1.5 Flash Vision model
- Extracts: amount, merchant, date, category
- Intelligent category suggestion
- Automatic data structuring
- Date normalization

### 💾 Database Storage

- Receipt image stored as base64 in MongoDB
- Merchant name tracked separately
- Source field set to "receipt"
- All standard transaction fields supported

### ✅ Confirmation & Editing

- Shows receipt image in confirmation modal
- All fields editable before saving
- Merchant field included
- Visual "Receipt scanned" badge

## How It Works

### 1. User Flow

1. Click the **blue camera button** (left of the voice button)
2. Select or drag-drop receipt image
3. Preview the image
4. Click "Process Receipt"
5. AI extracts and parses receipt data
6. Review parsed details with image preview
7. Edit any fields if needed
8. Click "Confirm & Save" to store transaction

### 2. Data Extraction

The AI automatically extracts:

- **Total Amount**: Numeric value (currency symbols removed)
- **Merchant**: Store/vendor name
- **Date**: Transaction date (normalized to YYYY-MM-DD)
- **Category**: Best-match from predefined list
- **Type**: Expense (default) or Income (context-based)
- **Note**: Additional items/context from receipt

### 3. Image Storage

- Images stored as **base64 strings** in MongoDB
- Directly embedded in transaction documents
- No separate file storage needed
- Displayed in confirmation modal and transaction details

## Technical Implementation

### Components

#### 1. ReceiptUpload Component (`components/ReceiptUpload.tsx`)

**Features:**

- File input with drag-drop area
- Image format validation (jpg, png, webp)
- Size validation (max 10MB)
- Image preview with remove button
- Upload progress indicator
- Tips for best results

**Key Functions:**

```typescript
handleFileSelect(); // Validates and converts image to base64
handleUpload(); // Sends to parse-receipt API
handleClose(); // Cleanup on close
```

#### 2. Parse Receipt API (`app/api/parse-receipt/route.ts`)

**Endpoint:** `POST /api/parse-receipt`

**Request:**

```json
{
  "image": "base64_encoded_image_data",
  "mimeType": "image/jpeg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "type": "expense",
    "amount": 1500,
    "category": "Food & Dining",
    "merchant": "Coffee Shop",
    "date": "2026-03-03",
    "note": "2x Coffee, 1x Sandwich",
    "source": "receipt"
  }
}
```

**Gemini Vision Configuration:**

```typescript
{
  model: "gemini-1.5-flash",
  temperature: 0.1,  // Low for consistent extraction
  topK: 1,
  topP: 1,
  maxOutputTokens: 512
}
```

#### 3. Updated Transaction Model

**New Fields:**

```typescript
interface ITransaction {
  // ... existing fields
  source: "manual" | "import" | "recurring" | "voice" | "receipt";
  imageUrl?: string; // Base64 image data
  merchant?: string; // Merchant/vendor name
}
```

#### 4. Enhanced ConfirmationModal

**New Features:**

- Receipt image display
- Merchant input field
- Source-specific badge text
- Scrollable content area

### Data Flow

```
User Selects Image
       ↓
File Validation
       ↓
Convert to Base64
       ↓
POST /api/parse-receipt
       ↓
Gemini Vision API
       ↓
Extract Receipt Text (OCR)
       ↓
Parse Structured Data
       ↓
Return JSON with imageUrl
       ↓
ConfirmationModal
       ↓
User Reviews & Edits
       ↓
POST /api/transactions
       ↓
MongoDB (with imageUrl)
       ↓
Dashboard Update
```

## Setup Instructions

### Prerequisites

- Gemini API key (already configured for voice feature)
- Same `.env` variable used: `GEMINI_API_KEY`

### No Additional Setup Required

The feature uses the existing Gemini API key. Just ensure:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Browser Compatibility

Works in all modern browsers:

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Receipt Upload Tips

### For Best Results:

1. **Good Lighting** - Avoid shadows
2. **Clear Focus** - No blur
3. **Flat Surface** - Minimize wrinkles
4. **Full Receipt** - Include all text
5. **High Contrast** - Good visibility

### Common Receipt Types:

- ✅ Restaurant receipts
- ✅ Grocery store receipts
- ✅ Gas station receipts
- ✅ Retail store receipts
- ✅ Online order confirmations (printed/screenshot)
- ✅ Invoice photos

## API Prompt Engineering

### Vision Prompt Structure:

```
Analyze this receipt image and extract:
1. Total amount (number only)
2. Merchant/vendor name
3. Date (YYYY-MM-DD format)
4. Transaction type (usually expense)
5. Appropriate category
6. Relevant items/notes
```

### Category Mapping:

**Expense Categories:**

- Food & Dining, Transport, Shopping, Bills & Utilities
- Entertainment, Healthcare, Education, Groceries, Other

**Income Categories:**

- Salary, Freelance, Investment, Business, Gift, Refund, Other

### Intelligent Matching:

- "Restaurant" → Food & Dining
- "Gas Station" → Transport
- "Supermarket" → Groceries
- "Hospital" → Healthcare
- etc.

## Image Storage Strategy

### Base64 Storage in MongoDB

**Advantages:**

- ✅ No separate file storage service needed
- ✅ Atomic transactions (image + data together)
- ✅ Simple backup and restore
- ✅ No file cleanup needed
- ✅ Easy to implement

**Considerations:**

- Document size increases
- 16MB MongoDB document limit (10MB upload limit helps)
- Query performance (use projection to exclude images)

### Alternative: Cloud Storage

For production at scale, consider:

- AWS S3
- Google Cloud Storage
- Cloudinary
- Store URL reference instead of base64

## UI Components

### Receipt Upload Button

- **Position:** Fixed bottom-right (left of voice button)
- **Color:** Blue gradient
- **Icon:** Camera/image icon
- **Label:** "Upload receipt"

### Upload Modal

- **Header:** "Upload Receipt"
- **Area:** Dashed border dropzone
- **Preview:** Full image with remove button
- **Process Button:** Primary action button
- **Tips Section:** Best practices guide

### Confirmation Modal Enhancements

- Receipt image displayed at top
- Merchant field (if receipt)
- Badge: "Receipt scanned by Gemini AI"
- All fields editable
- Scrollable content

## Error Handling

### Upload Validation

- File type check (image/\* mime types)
- File size limit (10MB)
- User-friendly error messages

### API Errors

- Invalid image format
- Gemini API failures
- JSON parsing errors
- Missing required fields
- Network errors

### User Feedback

- Processing spinner overlay
- Error alerts with retry option
- Success confirmation
- All editable before final save

## Security Considerations

### Image Handling

- Client-side validation before upload
- Server-side MIME type verification
- File size limits enforced
- Base64 encoding for safe storage

### API Security

- Session authentication required
- Gemini API key server-side only
- Rate limiting (Gemini free tier)
- Input sanitization

### Data Privacy

- Images stored with user's transactions
- Access controlled by user session
- No public image URLs
- Can implement image retention policies

## Performance

### Upload Process

- Image conversion: Instant (client-side)
- Upload time: ~1-2 seconds (base64 transfer)
- Gemini Vision processing: ~2-4 seconds
- Total time: ~3-6 seconds

### Storage Impact

- Average receipt image: 500KB - 2MB base64
- 10MB limit ensures reasonable size
- Consider image compression for optimization

### Gemini API Limits

- **Free Tier:** 15 requests/minute
- **Cost:** Very low per request
- **Image Size:** Up to 10MB supported

## Future Enhancements

### Technical Improvements

- [ ] Image compression before storage
- [ ] Cloud storage integration (S3/GCS)
- [ ] Batch receipt upload
- [ ] Receipt image thumbnails
- [ ] OCR accuracy confidence score

### Feature Additions

- [ ] Receipt gallery view
- [ ] Edit/replace receipt image
- [ ] Receipt search by merchant
- [ ] Export receipts to PDF
- [ ] Receipt categorization analytics
- [ ] Multi-item receipt splitting
- [ ] Receipt expiration tracking (warranties)

### UX Improvements

- [ ] Camera capture (mobile)
- [ ] Receipt cropping tool
- [ ] Image rotation
- [ ] Brightness/contrast adjustment
- [ ] Receipt templates for common merchants

## Troubleshooting

### "Failed to parse receipt"

- Ensure receipt is clear and readable
- Check Gemini API key is valid
- Verify image format is supported
- Try different lighting/angle

### "Image too large"

- Compress image before upload
- Use photo editing to resize
- Take photo at lower resolution

### Incorrect Amount/Details

- Review and edit in confirmation modal
- Ensure total is visible on receipt
- Check date format is clear

### Processing Takes Long

- Normal for detailed receipts
- Check network connection
- API might be rate-limited
- Try again in a moment

## Best Practices

### For Developers

1. Implement image compression
2. Add loading states
3. Handle all error cases
4. Test with various receipt types
5. Monitor API usage/costs

### For Users

1. Upload clear, well-lit photos
2. Ensure all text is visible
3. Review parsed data before saving
4. Edit any incorrect fields
5. Keep receipts for reference

## Integration Points

### Dashboard

- Blue camera button added
- Opens ReceiptUpload modal
- Shares ConfirmationModal with voice
- Same success/error flow

### Transaction Flow

- Source automatically set to "receipt"
- imageUrl and merchant saved
- All standard validations apply
- Appears in transaction list

### Data Model

- Backward compatible (optional fields)
- Existing transactions unaffected
- Can query by source="receipt"
- Image can be displayed in details

---

**Built with:** Next.js 15, TypeScript, Gemini 1.5 Flash Vision, MongoDB

**Status:** ✅ Production Ready (requires Gemini API key configured for voice feature)

**No Additional Setup Needed** - Uses existing Gemini API key!
