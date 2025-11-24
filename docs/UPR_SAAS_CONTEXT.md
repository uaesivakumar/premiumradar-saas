# UPR SaaS Context Document

**Version:** 1.0.0
**Last Updated:** 2025-11-24
**Purpose:** Master context document for PremiumRadar SaaS development

---

## 1. Architecture Overview

### Repository Structure (Phase-2)

| Repository | Purpose | Cloud Run Service | Service Account |
|------------|---------|-------------------|-----------------|
| [upr-os](https://github.com/uaesivakumar/upr-os) | Core Intelligence Layer | upr-os-service | upr-os-sa |
| [premiumradar-saas](https://github.com/uaesivakumar/premiumradar-saas) | SaaS Presentation | premiumradar-saas-service | premiumradar-saas-sa |
| [upr-os-worker](https://github.com/uaesivakumar/upr-os-worker) | Async Processing | upr-os-worker | upr-os-worker-sa |
| [upr-infra](https://github.com/uaesivakumar/upr-infra) | Shared Infrastructure | N/A | N/A |

### Zero-Trust Security Model

```
                     [Internet]
                          │
                    Cloud Armor WAF
                    (SQLi, XSS, Rate)
                          │
                    ┌─────▼─────┐
                    │  SaaS     │ ← Public (allUsers)
                    │  Service  │
                    └─────┬─────┘
                          │ OIDC Token
                    ┌─────▼─────┐
                    │  OS       │ ← Private (SaaS SA only)
                    │  Service  │
                    └─────┬─────┘
                          │ OIDC Token
                    ┌─────▼─────┐
                    │  Worker   │ ← Private (OS SA + Pub/Sub)
                    │  Service  │
                    └───────────┘
```

**IAM Bindings:**
- `premiumradar-saas-service`: `allUsers` can invoke
- `upr-os-service`: Only `premiumradar-saas-sa` can invoke
- `upr-os-worker`: Only `upr-os-sa` and Pub/Sub SA can invoke

---

## 2. Notion Integration

### Database IDs (PremiumRadar-SAAS Workspace)

```json
{
  "sprints_db_id": "5c32e26d-641a-4711-a9fb-619703943fb9",
  "module_features_db_id": "26ae5afe-4b5f-4d97-b402-5c459f188944",
  "knowledge_page_id": "f1552250-cafc-4f5f-90b0-edc8419e578b"
}
```

**Note:** Token stored in GCP Secret Manager as `NOTION_TOKEN_SAAS`

### Sprint Management Commands

```bash
# Get sprint features
NOTION_TOKEN="<token>" node scripts/notion/getSprint<N>Features.js

# Update feature status
NOTION_TOKEN="<token>" node scripts/notion/updateSprint<N>Feature.js "<feature_name>" "<status>"

# Complete sprint (marks all Done, updates sprint status)
NOTION_TOKEN="<token>" node scripts/notion/updateNotionComplete.js <current_sprint> <previous_sprint>
```

### Feature Status Values
- `Not Started`
- `In Progress`
- `Done`
- `Blocked`

---

## 3. UPR OS Integration Contract

### Base URL
```
Production: https://upr-os-service-<hash>-uc.a.run.app
Environment: UPR_OS_BASE_URL
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/os/health` | GET | Health check |
| `/api/os/__diag` | GET | Diagnostics |
| `/api/os/discovery` | POST | Lead discovery |
| `/api/os/enrich` | POST | Data enrichment |
| `/api/os/score` | POST | Q/T/L/E scoring |
| `/api/os/rank` | POST | Lead prioritization |
| `/api/os/outreach` | POST | Generate sequences |
| `/api/os/pipeline` | POST | Full pipeline execution |

### Authentication

The SaaS layer uses OIDC tokens for zero-trust authentication:

```typescript
// lib/os-client.ts handles this automatically
// In production: OIDC token added via request interceptor
// In development: OIDC skipped (localhost)
```

### Request Format

```typescript
interface PipelineRequest {
  tenant_id: string;
  region_code: string;   // 'ae', 'sa', 'us', etc.
  vertical_id: string;   // Industry vertical
  config?: Record<string, unknown>;
}
```

### Response Format

```typescript
interface OSResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

---

## 4. Frontend Tech Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | ^14.0.0 | App Router framework |
| React | ^18.2.0 | UI library |
| TanStack Query | ^5.0.0 | Data fetching |
| Zustand | ^4.4.0 | State management |
| Tailwind CSS | ^3.3.0 | Styling |
| Framer Motion | ^10.16.0 | Animations |
| Stripe | ^14.0.0 | Payments |
| NextAuth | ^4.24.0 | Authentication |

### Directory Structure

```
premiumradar-saas/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Design system
│   ├── chat/             # Chat interface
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities
│   ├── os-client.ts      # UPR OS API client
│   └── utils.ts          # Helpers
├── hooks/                 # Custom hooks
├── stores/               # Zustand stores
├── types/                # TypeScript types
└── docs/                 # Documentation
```

---

## 5. Golden Rules for Development

### TC Execution Protocol

1. **Checkpoints**: After every major feature, run type check (`npm run build`)
2. **QA Certification**: All features must pass before marking Done
3. **Document Hygiene**: Update relevant docs as you work

### Code Standards

```typescript
// MANDATORY: Use OS client for all API calls
import { osClient } from '@/lib/os-client';

// FORBIDDEN: Direct fetch to OS endpoints
// FORBIDDEN: Importing from upr-os repo
// FORBIDDEN: Shared code symlinks
```

### Component Guidelines

1. Use Tailwind CSS for styling (no inline styles)
2. Prefer server components when possible
3. Use React Query for data fetching
4. Implement loading states and error boundaries
5. Follow accessibility best practices

### Security Requirements

1. All API keys in environment variables
2. Use OIDC for service-to-service auth
3. Validate all user inputs
4. Sanitize data before rendering
5. No secrets in client-side code

---

## 6. Phase 2 Goals

### Sprint Themes

| Sprint | Theme | Focus |
|--------|-------|-------|
| 64 | Landing Experience | Marketing site, value props |
| 65 | SaaS Onboarding | Signup flow, trial setup |
| 66 | Stripe Integration | Billing, subscriptions |
| 67 | Dashboard Shell | Layout, navigation |
| 68 | OS Integration | Connect to OS pipeline |
| 69 | Chat Interface | AI chat implementation |
| 70 | Polish & Launch | Bug fixes, performance |

### Key Features

1. **Landing Page**: Modern marketing site with value proposition
2. **Authentication**: Email/password + OAuth (Google, GitHub)
3. **Onboarding**: Guided setup wizard for new users
4. **Billing**: Stripe subscriptions with multiple tiers
5. **Dashboard**: Lead management interface
6. **Chat OS**: Natural language interface to OS
7. **Real-time**: SSE streaming for live updates

---

## 7. Environment Variables

### Required for Development

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# UPR OS
UPR_OS_BASE_URL=http://localhost:8080
UPR_OS_API_KEY=dev-api-key

# Auth
NEXTAUTH_SECRET=development-secret
NEXTAUTH_URL=http://localhost:3000

# Database (optional for Phase 2)
DATABASE_URL=postgresql://...

# Stripe (required for billing features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Required for Production

```env
# UPR OS (auto-configured via Cloud Run)
UPR_OS_BASE_URL=https://upr-os-service-xxx-uc.a.run.app

# OIDC handled automatically by GCP metadata server
```

---

## 8. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: premiumradar-saas-service
          region: us-central1
```

### Deployment Checklist

1. All tests pass locally
2. Type check succeeds (`npm run build`)
3. No lint errors
4. Environment variables configured
5. Notion sprint features updated

---

## 9. Testing Strategy

### Unit Tests (Vitest)

```bash
npm test
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

### Test Coverage Requirements

- Components: 80%+
- Hooks: 90%+
- Utils: 100%
- API routes: 80%+

---

## 10. Quick Reference

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Useful Links

- [UPR OS API Docs](https://github.com/uaesivakumar/upr-os)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Stripe API](https://stripe.com/docs/api)

---

## Appendix: OS Client Usage Examples

### Health Check

```typescript
import { osClient } from '@/lib/os-client';

const health = await osClient.health();
console.log(health.success); // true
```

### Full Pipeline

```typescript
const result = await osClient.pipeline({
  tenant_id: 'tenant-123',
  region_code: 'ae',
  vertical_id: 'real-estate',
  config: {
    max_leads: 100,
    quality_threshold: 0.7
  }
});
```

### Error Handling

```typescript
try {
  const leads = await osClient.discovery({
    tenant_id: 'tenant-123',
    region_code: 'ae',
    vertical_id: 'insurance'
  });
} catch (error) {
  if (error.response?.status === 401) {
    // OIDC token issue
  }
  if (error.response?.status === 403) {
    // IAM binding issue
  }
}
```
