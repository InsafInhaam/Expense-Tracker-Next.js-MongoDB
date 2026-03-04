# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with your credentials:

### MongoDB

Get your MongoDB connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):

- Create a free cluster
- Go to Database → Connect → Connect your application
- Copy the connection string and replace `<password>` with your database password

### NextAuth Secret

Generate a secure secret:

```bash
openssl rand -base64 32
```

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if not done already
6. Select "Web application" as application type
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
8. Copy the Client ID and Client Secret

Your `.env.local` should look like:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Step 3: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Testing

1. You'll be redirected to the sign-in page
2. Click "Continue with Google"
3. Sign in with your Google account
4. After authentication, you'll see the dashboard
5. Click the + button to add your first transaction

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Update Google OAuth redirect URI with your production domain
5. Deploy!

### Other Platforms

The app can be deployed to any Node.js hosting platform:

- Railway
- Render
- Fly.io
- DigitalOcean App Platform

Make sure to:

- Set all environment variables
- Update `NEXTAUTH_URL` to your production domain
- Add production OAuth redirect URI in Google Cloud Console

## PWA Installation

After deploying:

- **Desktop:** Click the install icon in the browser address bar
- **Mobile:** Use "Add to Home Screen" from the browser menu

## Troubleshooting

### Build Errors

```bash
npm run build
```

Check the error messages and ensure all dependencies are installed.

### Database Connection Issues

- Verify MongoDB URI is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure database user has proper permissions

### Google OAuth Errors

- Verify redirect URIs match exactly (including http/https)
- Check client ID and secret are correct
- Ensure OAuth consent screen is configured

### TypeScript Errors

```bash
npm run type-check
```

## Features Overview

- ✅ Google OAuth authentication with NextAuth.js
- ✅ MongoDB for data persistence
- ✅ TypeScript for type safety
- ✅ Tailwind CSS with Apple-inspired design
- ✅ PWA support with offline capability
- ✅ Mobile-first responsive design
- ✅ Transaction tracking (income/expenses)
- ✅ Real-time balance calculations
- ✅ Clean, minimal UI

Enjoy your new finance tracker! 🎉
