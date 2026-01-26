# Event Registration System

Next.js-based event registration and check-in management system with real-time QR code verification.

## Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Supabase recommended)

## Installation

```bash
npm install
```

## Environment Variables

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.xxx:password@aws-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Upstash Redis
UPSTASH_REDIS_REST_URL="your-upstash-redis-rest-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-rest-token"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed admin user (optional)
npm run db:seed
```

## Development

```bash
npm run dev
```

Application runs on http://localhost:3000

## Build

```bash
npm run build
npm start
```

## Project Structure

```bash
src/
├── app/
│   ├── (public)/              # Public routes
│   │   ├── page.tsx           # Registration form
│   │   ├── success/           # Registration success + QR
│   ├── └── login/             # Admin login
│   ├── check-in/              # QR scanner page
│   ├── dashboard/             # Protected admin dashboard
│   │   ├── page.tsx           # Dashboard home + analytics
│   │   ├── registrations/     # Registration management
│   │   └── logs/              # Audit logs
│   └── api/
│       ├── auth/[..nextauth]/ # Next auth endpoint
│       ├── register/          # Registration endpoint
│       ├── check-in/          # Check-in verification
│       ├── qr/[token]/image/  # QR image generation
│       └── register/     # CRUD operations
├── components/                # React components
│   │── dashboard/
│   │   ├── RegistrationsTable.tsx
│   │   ├── AnalyticsCharts.tsx
│   │   └── Navbar.tsx
│   │── layout/
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   ├── RegistrationForm.tsx
│   ├── QRScanner.tsx
│   ├── Login.tsx
├── lib/                       # Utilities and services
│   ├── prisma.ts              # Database client
│   ├── auth.ts                # NextAuth configuration
│   ├── validations.ts         # Zod schemas
│   ├── rateLimit.ts           # Rate limiting
│   └── utils.ts               # Helper functions
└── types/                     # TypeScript types
```

## Deployment

Deployed on Vercel with automatic deployments from the main branch.

## License

[MIT](https://choosealicense.com/licenses/mit/)
