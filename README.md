# Churn Buster

A Whop App Store application that helps businesses reduce customer churn by presenting retention offers to members who are about to cancel their subscriptions.

## Features

- **Retention Flow**: When a member tries to cancel, they're shown a customizable discount offer
- **Admin Dashboard**: Business owners can configure discount percentages and view analytics
- **Credit System**: Pay-per-use model where each retention attempt costs 1 credit
- **Analytics**: Track saved members, cancellation reasons, and credit usage

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Styling**: Tailwind CSS + Radix UI
- **Database**: Firebase Firestore
- **Platform**: Whop App Store
- **Authentication**: Whop JWT tokens

## Getting Started

### Prerequisites

- Node.js 18+
- A Whop Developer account
- A Firebase project

### 1. Clone and Install

```bash
git clone https://github.com/your-username/churn-buster-v8.git
cd churn-buster-v8
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `WHOP_API_KEY` - Your Whop App API key
- `NEXT_PUBLIC_WHOP_APP_ID` - Your Whop App ID
- `WHOP_WEBHOOK_SECRET` - Webhook signing secret
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key

### 3. Configure Whop App

1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer)
2. Create a new app or select existing one
3. Configure the following:
   - **Seller Path**: `/dashboard/$companyId` (Admin dashboard)
   - **Customer Path**: `/experiences/$experienceId` (Retention flow)
   - **Webhook URL**: `https://your-domain.com/api/webhook/whop`

### 4. Run Development Server

```bash
npm run dev
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── claim-offer/     # Apply retention discount
│   │   ├── config/          # Company settings
│   │   ├── create-checkout/ # Credit purchase
│   │   ├── log/             # Analytics logging
│   │   ├── stats/           # Dashboard statistics
│   │   └── webhook/whop/    # Whop webhook handler
│   ├── dashboard/[companyId]/ # Admin dashboard page
│   └── experiences/[experienceId]/ # Customer retention page
├── components/
│   ├── admin-dashboard-client.tsx
│   ├── retention-dash.tsx
│   └── ui/                  # Shadcn UI components
├── hooks/
│   └── useWhop.ts           # Whop iframe SDK hook
└── lib/
    ├── credits.ts           # Credit management
    ├── firebase.ts          # Firebase Admin SDK
    ├── utils.ts             # Utilities
    └── whop.ts              # Whop SDK configuration
```

## Whop Integration

### Authentication

All API routes use Whop JWT token verification:

```typescript
import { whopsdk } from "@/lib/whop";
import { headers } from "next/headers";

const { userId } = await whopsdk.verifyUserToken(await headers());
```

### Webhook Events

The app handles these Whop webhook events:
- `payment.succeeded` - Add credits when payment is received
- `membership.went_valid` - Initialize new company with welcome credits
- `membership.went_invalid` - Mark company as inactive

### Iframe SDK

Client components use the `useWhop` hook for iframe communication:

```typescript
import { useWhop } from "@/hooks/useWhop";

const { sdk, isInIframe, showToast } = useWhop();
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Ensure all variables from `.env.example` are set in your deployment platform.

## API Permissions Required

Your Whop App needs these permissions:
- `memberships:read` - Read membership data
- `memberships:write` - Update membership metadata
- `users:read` - Read user information
- `companies:read` - Read company information

## License

MIT
