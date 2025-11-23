# PremiumRadar SaaS

AI-Powered Sales Intelligence Platform built on UPR OS.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PremiumRadar SaaS                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Landing   │  │  Workspace  │  │     Admin Dashboard     │  │
│  │  (Orb+Demo) │  │     UI      │  │  (Tenant + SuperAdmin)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────┴─────────────────────────────────┐  │
│  │                    SaaS API Layer                         │  │
│  │  /api/app/*  (Auth, Billing, Workspaces, Analytics)       │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │ ${UPR_OS_BASE_URL}/api/os/*
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       UPR OS v1.0.0                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Discovery │ │ Enrich   │ │  Score   │ │  Rank    │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────────────────────────────────┐          │
│  │ Outreach │ │        Full Pipeline                 │          │
│  └──────────┘ └──────────────────────────────────────┘          │
│                                                                  │
│  Region Engine │ Data Lake │ USP Hooks │ Vertical Engine        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Rules

### ⛔ NEVER
- Import code directly from UPR OS repo
- Use shared code symlinks
- Modify OS core without version bump
- Call OS endpoints not in `/api/os/*`

### ✅ ALWAYS
- Call OS via `UPR_OS_BASE_URL` environment variable
- Use the `osClient` from `lib/os-client.ts`
- Request new OS capabilities via USP hooks or new `/api/os/v1/*` endpoints

## Project Structure

```
premiumradar-saas/
├── app/                    # Next.js App Router
│   ├── (landing)/          # Public landing pages
│   ├── (workspace)/        # Authenticated workspace
│   ├── (admin)/            # Admin dashboards
│   └── api/                # SaaS API routes
│       ├── auth/           # Authentication
│       ├── billing/        # Stripe integration
│       ├── workspaces/     # Workspace management
│       └── os/             # OS proxy (optional caching)
├── components/             # React components
│   ├── landing/            # Landing page components
│   ├── workspace/          # Workspace UI components
│   └── shared/             # Shared UI components
├── lib/                    # Core libraries
│   ├── os-client.ts        # OS API client (THE way to call OS)
│   ├── auth.ts             # Authentication helpers
│   ├── stripe.ts           # Billing helpers
│   └── db.ts               # Database client
├── stores/                 # Zustand state stores
├── hooks/                  # React hooks
└── types/                  # TypeScript types
```

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local

# Set UPR_OS_BASE_URL to your OS service
# UPR_OS_BASE_URL=https://upr-os-service-xxxxx.run.app

# Run development server
npm run dev
```

## OS Integration

All OS calls go through the `osClient`:

```typescript
import { osClient } from '@/lib/os-client';

// Health check
const health = await osClient.health();

// Full pipeline
const result = await osClient.pipeline({
  tenant_id: 'tenant-123',
  region_code: 'UAE',
  vertical_id: 'banking_employee',
});
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UPR_OS_BASE_URL` | OS service URL | Yes |
| `UPR_OS_API_KEY` | OS API key | Yes |
| `DATABASE_URL` | SaaS database | Yes |
| `NEXTAUTH_SECRET` | Auth secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe key | Yes |

## Deployment

Deploys to GCP Cloud Run as `premiumradar-saas-service`.

See `../upr/gcp/cloud-run-saas-service.yaml` for configuration.

## License

Proprietary - All rights reserved.
