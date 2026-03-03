# Finance - Minimal Money Tracker

A beautiful, minimal finance tracker built with Next.js, TypeScript, NextAuth.js, and MongoDB. Features a clean Apple-inspired design with PWA support.

## Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with NextAuth.js
- 💰 **Transaction Tracking** - Track income and expenses
- 📊 **Real-time Dashboard** - View balance, income, and expenses at a glance
- 🎨 **Apple-inspired Design** - Clean, minimal UI with smooth animations
- 📱 **Mobile-first & PWA** - Installable app with offline support
- 🌙 **Smooth Interactions** - Micro-interactions and fluid animations

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **Database:** MongoDB with Mongoose
- **PWA:** Service Worker with offline support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Google OAuth credentials

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Expense-Tracker-Next.js-MongoDB
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

- **MONGODB_URI:** Your MongoDB connection string
- **NEXTAUTH_URL:** Your app URL (http://localhost:3000 for development)
- **NEXTAUTH_SECRET:** Generate with `openssl rand -base64 32`
- **GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET:** Get from [Google Cloud Console](https://console.cloud.google.com/)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth.js API routes
│   │   └── transactions/          # Transaction API endpoints
│   ├── auth/signin/               # Sign-in page
│   ├── dashboard/                 # Main dashboard
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page (redirects)
├── components/
│   ├── BalanceCard.tsx            # Balance display cards
│   ├── FloatingActionButton.tsx   # FAB for adding transactions
│   ├── Providers.tsx              # NextAuth provider
│   ├── ServiceWorkerRegistration.tsx
│   └── TransactionModal.tsx       # Transaction form modal
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   └── mongodb.ts                 # MongoDB connection
├── models/
│   ├── User.ts                    # User model
│   └── Transaction.ts             # Transaction model
├── public/
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
├── types/
│   └── next-auth.d.ts             # NextAuth type definitions
└── middleware.ts                  # Route protection
```

## PWA Features

The app is installable as a PWA with:

- App manifest configuration
- Service worker for offline support
- Cached dashboard for offline viewing
- iOS app-like experience

To install:

- **Desktop:** Click install icon in address bar
- **Mobile:** Use "Add to Home Screen" option

## Design Philosophy

Inspired by Apple's design language:

- **Clean Typography** - Crisp, readable fonts
- **Generous Spacing** - Breathing room for content
- **Soft Shadows** - Subtle depth without harshness
- **Rounded Elements** - Friendly, modern appearance
- **Grayscale Palette** - Professional, timeless
- **Smooth Animations** - Polished micro-interactions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please open an issue on GitHub.
