# Finance App - Project Overview

## 🎨 Design Philosophy

This app embodies Apple's design principles:

### Visual Design

- **Typography**: Clean, readable Geist Sans font
- **Spacing**: Generous padding and margins for breathing room
- **Shadows**: Soft, subtle depth (0.04-0.06 opacity blacks)
- **Corners**: Rounded-xl (0.75rem) and larger for friendly feel
- **Colors**: Professional grayscale palette (#171717 to #fafafa)
- **Animations**: Smooth 200-300ms transitions on all interactions

### User Experience

- **Mobile-first**: Optimized for phones, scales up beautifully
- **Minimal**: Only essential UI elements visible
- **Intuitive**: Clear hierarchy, obvious actions
- **Fast**: Optimistic updates, instant feedback
- **Calm**: No clutter, no noise, just what you need

## 📱 Features

### Authentication

- Google OAuth only (simple, secure)
- Auto-creates user record on first login
- Session management with NextAuth.js JWT
- Protected routes via middleware

### Dashboard

```
┌─────────────────────────────┐
│  Finance        Sign out    │
├─────────────────────────────┤
│                             │
│  ┌──────────────────────┐  │
│  │   Total Balance      │  │  ← Dark gradient card
│  │   $X,XXX.XX          │  │
│  └──────────────────────┘  │
│                             │
│  ┌──────┐    ┌──────────┐  │
│  │Income│    │ Expenses │  │  ← Light cards with
│  │$X,XXX│    │  $X,XXX  │  │     colored amounts
│  └──────┘    └──────────┘  │
│                             │
│         [+ FAB]             │  ← Floating Action Button
└─────────────────────────────┘
```

### Transaction Modal

- Slide-up modal from bottom (iOS-style)
- Type toggle: Income / Expense
- Categories for both types
- Optional description field
- Large, clear submit button

### PWA Features

- Installable on desktop and mobile
- Offline viewing of dashboard
- App manifest with metadata
- Service worker for caching
- Standalone mode (no browser UI)

## 🏗️ Architecture

### Frontend

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom utilities
- **State**: React hooks + Server components
- **Auth**: NextAuth.js client hooks

### Backend

- **API Routes**: Next.js API routes (App Router)
- **Database**: MongoDB with Mongoose ODM
- **Auth**: NextAuth.js with Google provider
- **Session**: JWT-based (no database sessions)

### Data Models

```typescript
User {
  name: string
  email: string (unique)
  image?: string
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
}

Transaction {
  userId: ObjectId -> User
  type: "income" | "expense"
  amount: number
  category: string
  description?: string
  date: Date
  createdAt: Date
  updatedAt: Date
}
```

### API Endpoints

```
POST /api/auth/[...nextauth]
  - NextAuth.js authentication handlers

GET  /api/transactions
  - Fetch all user transactions (sorted by date)

POST /api/transactions
  - Create new transaction

GET  /api/transactions/summary
  - Get balance, total income, total expenses
```

## 🎯 Key Design Decisions

### Why TypeScript?

- Type safety catches bugs early
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring

### Why MongoDB?

- Flexible schema for evolving features
- JSON-like documents (natural for JavaScript)
- Great Node.js ecosystem (Mongoose)
- Easy to deploy (Atlas)

### Why NextAuth.js?

- Battle-tested authentication
- Built for Next.js
- Handles OAuth complexity
- Secure by default

### Why Google OAuth Only?

- Simplicity (one provider, less code)
- Universal (everyone has Google)
- Secure (no password storage)
- Fast integration

### Why No Email/Password?

- Reduces security surface area
- No password reset flows needed
- No email verification needed
- Faster development, better UX

### Why PWA?

- Native app feel without stores
- Offline capability built-in
- Lower barrier to "install"
- One codebase for all platforms

### Why Minimal Design?

- Focus on content, not chrome
- Faster to understand and use
- Timeless aesthetic
- Better performance
- Easier to maintain

## 🚀 Performance Optimizations

- Server Components by default (less JavaScript)
- Client Components only where needed
- Font optimization with next/font
- Image optimization ready (next/image)
- API routes colocated with app
- MongoDB connection pooling
- JWT sessions (no DB lookup per request)
- Service Worker caching strategy

## 📊 Scalability Considerations

### Ready for Growth

- Indexed MongoDB queries (userId + date)
- Cached database connections
- Stateless authentication (JWT)
- Horizontal scaling friendly
- CDN-ready static assets

### Future Enhancements

- Transaction categories with icons
- Date range filtering
- Charts and analytics
- Budget goals
- Recurring transactions
- Multi-currency support
- Export to CSV
- Dark mode
- Transaction editing/deletion
- Search and filters

## 🔒 Security

- HTTPS enforced (production)
- OAuth state validation
- CSRF protection (NextAuth.js)
- Environment variables for secrets
- No sensitive data in client
- MongoDB connection string security
- JWT token rotation
- Input validation on API routes

## 🎨 Color Palette

```css
Background:     #ffffff (white)
Text Primary:   #171717 (gray-900)
Text Secondary: #737373 (gray-500)
Borders:        #e5e5e5 (gray-200)
Hover:          #f5f5f5 (gray-100)
Accent Dark:    #171717 - #262626 (gradient)
Success:        #16a34a (green-600)
Danger:         #dc2626 (red-600)
```

## 📦 Dependencies

### Core

- next@15.5.6
- react@19.1.0
- react-dom@19.1.0

### Authentication

- next-auth@4.24.7

### Database

- mongoose@8.19.1

### Styling

- tailwindcss@4
- @tailwindcss/postcss@4

### TypeScript

- typescript@5.6.0
- @types/node@22
- @types/react@18.3
- @types/react-dom@18.3

## 📁 Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth endpoints
│   │   └── transactions/     # Transaction CRUD
│   ├── auth/signin/          # Sign-in page
│   ├── dashboard/            # Main dashboard
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home (redirects)
├── components/               # React components
│   ├── BalanceCard.tsx       # Card UI
│   ├── FloatingActionButton.tsx
│   ├── Providers.tsx         # Context providers
│   ├── ServiceWorkerRegistration.tsx
│   └── TransactionModal.tsx  # Add transaction
├── lib/                      # Utilities
│   ├── auth.ts               # NextAuth config
│   └── mongodb.ts            # DB connection
├── models/                   # Mongoose models
│   ├── User.ts
│   └── Transaction.ts
├── public/                   # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icon-*.svg            # App icons
├── types/                    # TypeScript types
│   └── next-auth.d.ts
├── middleware.ts             # Route protection
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind config
├── next.config.mjs           # Next.js config
├── .env.example              # Env template
├── .gitignore
├── package.json
├── README.md                 # Main docs
└── SETUP.md                  # Setup guide
```

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js Guide](https://next-auth.js.org/getting-started/introduction)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

Built with ❤️ using modern web technologies
