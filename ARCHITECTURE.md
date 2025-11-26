# PremiumRadar Architecture

## The Two Engines

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PremiumRadar Platform                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │      PremiumRadar SaaS       │    │           UPR OS                 │  │
│  │      (The Experience)        │    │         (The Brain)              │  │
│  │                              │    │                                  │  │
│  │  • Auth & Identity           │    │  • Intelligence Layer            │  │
│  │  • Billing & Plans           │    │  • LLM Routing                   │  │
│  │  • Tenant Admin UI           │    │  • API Providers                 │  │
│  │  • Workspace UI              │    │  • Vertical Packs                │  │
│  │  • Journey Builder UI        │    │  • Journey Engine                │  │
│  │  • Widgets & Dashboards      │    │  • Autonomous Engine             │  │
│  │  • Mobile/PWA                │    │  • Evidence System               │  │
│  │  • Marketplace               │    │  • Object Intelligence           │  │
│  │  • Integrations UI           │    │  • Predictive Models             │  │
│  │                              │    │  • Real-time Signals             │  │
│  │  Multi-tenant concerns       │    │  • Data Warehouse                │  │
│  │  User-facing features        │    │  • Vertex AI                     │  │
│  │                              │    │                                  │  │
│  └──────────────────────────────┘    └──────────────────────────────────┘  │
│              │                                    │                         │
│              │         API Calls                  │                         │
│              └────────────────────────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Hard Rules

1. **All INTELLIGENCE stays in UPR OS**
2. **All MULTI-TENANT CONTROL stays in PremiumRadar SaaS**
3. **SaaS calls OS via API - never the reverse**
4. **OS has NO knowledge of tenants - receives context via API**

---

## Sprint Allocation

| Sprint | Service | Reason |
|--------|---------|--------|
| S48 | PremiumRadar SaaS | Identity, vertical lock, onboarding |
| S49 | PremiumRadar SaaS | RBAC, DLP, tenant security |
| S50 | UPR OS | API provider engine |
| S51 | UPR OS | LLM routing engine |
| S52 | UPR OS | Vertical pack engine |
| S53 | UPR OS | Territory config engine |
| S54 | PremiumRadar SaaS | Tenant admin UI |
| S55 | UPR OS | Config kernel |
| S56 | UPR OS | Target type schemas |
| S57 | PremiumRadar SaaS | Billing, plans, feature flags |
| S58 | UPR OS | Journey engine core |
| S59 | UPR OS | Journey steps library |
| S60 | UPR OS | Journey templates |
| S61 | UPR OS | Journey monitoring engine |
| S62 | PremiumRadar SaaS | Journey builder UI |
| S63 | PremiumRadar SaaS | Workspace UI, widgets |
| S64 | UPR OS | Object intelligence |
| S65 | UPR OS | Evidence system |
| S66 | UPR OS | Autonomous agent foundation |
| S67 | UPR OS | Autonomous discovery |
| S68 | UPR OS | Autonomous outreach |
| S69 | UPR OS | Autonomous learning |
| S70 | UPR OS | Autonomous dashboard engine |
| S71 | UPR OS | Real-time signals |
| S72 | UPR OS | Predictive intelligence |
| S73 | UPR OS | ML & Data Platform |
| S74 | UPR OS | Performance & security hardening |
| S75 | Shared | Integrations (UI=SaaS, Backend=OS) |
| S76 | PremiumRadar SaaS | Mobile/PWA |
| S77 | PremiumRadar SaaS | Marketplace |

---

## Folder Structure

```
premiumradar/
├── packages/
│   ├── upr-os/                          # Intelligence Engine
│   │   ├── src/
│   │   │   ├── intelligence/            # S50-S53 Config Foundation
│   │   │   │   ├── providers/           # API provider management
│   │   │   │   ├── llm-router/          # LLM engine routing
│   │   │   │   ├── vertical-packs/      # Vertical configuration
│   │   │   │   ├── territory/           # Territory hierarchy
│   │   │   │   └── config-kernel/       # Unified config loader
│   │   │   │
│   │   │   ├── journey-engine/          # S58-S61 Journey Engine
│   │   │   │   ├── core/                # State machine, executor
│   │   │   │   ├── steps/               # Step types library
│   │   │   │   ├── templates/           # Journey templates
│   │   │   │   └── monitoring/          # Execution tracking
│   │   │   │
│   │   │   ├── objects/                 # S56, S64 Object Intelligence
│   │   │   │   ├── schemas/             # Company, Individual, Family, Candidate
│   │   │   │   ├── detection/           # Object detection rules
│   │   │   │   └── relationships/       # Object graph
│   │   │   │
│   │   │   ├── evidence/                # S65 Evidence System
│   │   │   │   ├── aggregation/         # Multi-provider merge
│   │   │   │   ├── scoring/             # Provider weights
│   │   │   │   └── rules/               # Evidence rules engine
│   │   │   │
│   │   │   ├── autonomous/              # S66-S70 Autonomous Mode
│   │   │   │   ├── agent/               # Task queue, execution
│   │   │   │   ├── discovery/           # Auto-discovery
│   │   │   │   ├── outreach/            # Auto-outreach
│   │   │   │   ├── learning/            # Auto-tuning
│   │   │   │   └── dashboard/           # Metrics engine
│   │   │   │
│   │   │   ├── signals/                 # S71 Real-time Signals
│   │   │   │   ├── websocket/           # Signal hub
│   │   │   │   ├── correlation/         # Signal correlation
│   │   │   │   └── subscriptions/       # Stream management
│   │   │   │
│   │   │   ├── predictive/              # S72 Predictive Intelligence
│   │   │   │   ├── models/              # Prediction models
│   │   │   │   ├── training/            # Training pipelines
│   │   │   │   └── validation/          # Accuracy tracking
│   │   │   │
│   │   │   ├── data-platform/           # S73 Vertex AI / BigQuery
│   │   │   │   ├── warehouse/           # BigQuery
│   │   │   │   ├── feature-store/       # Vertex Feature Store
│   │   │   │   ├── pipelines/           # Vertex AI Pipelines
│   │   │   │   └── vectors/             # Vector search
│   │   │   │
│   │   │   └── api/                     # UPR OS API Layer
│   │   │       ├── routes/              # API endpoints
│   │   │       └── middleware/          # Auth, rate limiting
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── saas/                            # Multi-tenant SaaS
│       ├── src/
│       │   ├── app/                     # Next.js app router
│       │   │   ├── (auth)/              # S48-S49 Auth, identity
│       │   │   ├── (dashboard)/         # Dashboard routes
│       │   │   ├── admin/               # S54 Tenant admin
│       │   │   ├── billing/             # S57 Billing
│       │   │   ├── workspace/           # S63 Workspace
│       │   │   ├── journey-builder/     # S62 Journey Builder UI
│       │   │   └── marketplace/         # S77 Marketplace
│       │   │
│       │   ├── components/              # UI Components
│       │   │   ├── workspace/           # Workspace widgets
│       │   │   ├── journey/             # Journey builder components
│       │   │   └── ...
│       │   │
│       │   ├── lib/
│       │   │   ├── auth/                # S48-S49 Auth logic
│       │   │   │   ├── identity/        # Email verification, industry detection
│       │   │   │   ├── vertical-lock/   # Vertical assignment
│       │   │   │   └── rbac/            # Role-based access
│       │   │   │
│       │   │   ├── billing/             # S57 Billing
│       │   │   │   ├── plans/           # Plan definitions
│       │   │   │   ├── stripe/          # Stripe integration
│       │   │   │   └── feature-flags/   # Feature gating
│       │   │   │
│       │   │   ├── tenant/              # S54 Tenant management
│       │   │   │   ├── settings/        # Tenant settings
│       │   │   │   ├── team/            # Team management
│       │   │   │   └── templates/       # Email templates
│       │   │   │
│       │   │   └── upr-client/          # UPR OS API Client
│       │   │       ├── intelligence.ts
│       │   │       ├── journey.ts
│       │   │       ├── autonomous.ts
│       │   │       └── ...
│       │   │
│       │   └── stores/                  # Zustand stores
│       │
│       ├── package.json
│       └── tsconfig.json
│
├── turbo.json                           # Turborepo config
├── package.json                         # Root package.json
└── ARCHITECTURE.md                      # This file
```

---

## GCP Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Google Cloud Platform                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Cloud Run Services                            │ │
│  │                                                                        │ │
│  │  ┌──────────────────────┐     ┌──────────────────────────────────┐   │ │
│  │  │  premiumradar-saas   │────▶│         upr-os-api               │   │ │
│  │  │  (Next.js SSR)       │     │       (Node.js/Express)          │   │ │
│  │  │                      │     │                                  │   │ │
│  │  │  • Frontend          │     │  • Intelligence API              │   │ │
│  │  │  • Auth              │     │  • Journey Engine API            │   │ │
│  │  │  • Billing           │     │  • Autonomous API                │   │ │
│  │  │  • Admin UI          │     │  • Signals API                   │   │ │
│  │  └──────────────────────┘     └──────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Data & AI Services                            │ │
│  │                                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │ │
│  │  │   Supabase   │  │   BigQuery   │  │        Vertex AI             │ │ │
│  │  │              │  │              │  │                              │ │ │
│  │  │  • Auth      │  │  • Warehouse │  │  • Feature Store             │ │ │
│  │  │  • Database  │  │  • Analytics │  │  • Model Registry            │ │ │
│  │  │  • RLS       │  │  • ML Data   │  │  • Pipelines                 │ │ │
│  │  └──────────────┘  └──────────────┘  │  • Vector Search             │ │ │
│  │                                      └──────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Supporting Services                           │ │
│  │                                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │    Redis     │  │  Cloud Tasks │  │  Pub/Sub     │  │  Secrets   │ │ │
│  │  │  (Memorystore│  │  (Job Queue) │  │  (Events)    │  │  Manager   │ │ │
│  │  │   /Upstash)  │  │              │  │              │  │            │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Git Repository Strategy

### Option A: Monorepo with Turborepo (RECOMMENDED)

```bash
# Single repo with packages
premiumradar/
├── packages/upr-os/       # UPR OS package
├── packages/saas/         # SaaS package
└── turbo.json             # Turborepo orchestration

# Benefits:
# - Atomic commits across both services
# - Shared types/contracts
# - Single PR for cross-cutting changes
# - Easier local development
```

### Option B: Separate Repos

```bash
# Two separate repos
upr-os/                    # github.com/premiumradar/upr-os
premiumradar-saas/         # github.com/premiumradar/premiumradar-saas

# Benefits:
# - Strict separation
# - Independent versioning
# - Separate CI/CD pipelines
```

### RECOMMENDED: Option A (Monorepo)

For the current stage of development, a monorepo is more practical:
- Faster iteration
- Easier refactoring
- Single source of truth
- Can split later if needed

---

## API Contract Between Services

### SaaS → UPR OS API Calls

```typescript
// packages/saas/src/lib/upr-client/index.ts

const UPR_OS_URL = process.env.UPR_OS_URL;

export const uprClient = {
  // Intelligence
  async getConfig(params: ConfigRequest): Promise<VerticalConfig> {
    return fetch(`${UPR_OS_URL}/api/config`, { ... });
  },

  // Journey Engine
  async executeJourney(journeyId: string, context: JourneyContext): Promise<JourneyResult> {
    return fetch(`${UPR_OS_URL}/api/journey/execute`, { ... });
  },

  // Autonomous
  async triggerAutoDiscovery(params: DiscoveryParams): Promise<void> {
    return fetch(`${UPR_OS_URL}/api/autonomous/discovery`, { ... });
  },

  // Predictions
  async getPredictions(companyId: string): Promise<Predictions> {
    return fetch(`${UPR_OS_URL}/api/predict/${companyId}`, { ... });
  },
};
```

### Context Passing (Tenant-Agnostic OS)

```typescript
// UPR OS receives tenant context via API headers/params
// OS NEVER stores tenant IDs - operates on passed context

// SaaS sends:
{
  "context": {
    "vertical": "banking",
    "subVertical": "employee-banking",
    "country": "UAE",
    "region": "Gulf",
    "subregion": "Dubai",
    "territory": "DIFC"
  },
  "request": {
    "type": "journey_execute",
    "journeyId": "banking-onboarding-v1",
    "target": { ... }
  }
}

// OS processes without knowing WHICH tenant
// Just processes based on vertical/region context
```

---

## Implementation Workflow

### For Each Sprint:

1. **Check allocation** → Is this UPR OS or SaaS?
2. **Create branch** → `feat/s48-identity-intelligence`
3. **Work in correct package** → `packages/upr-os/` or `packages/saas/`
4. **Test in isolation** → Package-level tests
5. **Integration test** → Cross-package tests
6. **Deploy** → Deploy correct service to GCP

### Branch Naming Convention

```
feat/s48-saas-identity-intelligence
feat/s50-os-api-provider-management
feat/s55-os-config-kernel
feat/s62-saas-journey-builder-ui
```

### Commit Convention

```
feat(saas/s48): Add email domain verification
feat(os/s50): Implement provider fallback engine
fix(os/s58): Journey state machine race condition
```

---

## Migration Plan (Current → Monorepo)

### Step 1: Create monorepo structure
```bash
mkdir -p packages/upr-os/src
mkdir -p packages/saas/src
```

### Step 2: Move existing code
```bash
# Current lib/intelligence → packages/upr-os/src/intelligence
# Current app/ → packages/saas/src/app
# Current components/ → packages/saas/src/components
```

### Step 3: Setup Turborepo
```bash
npm install turbo -D
# Configure turbo.json
```

### Step 4: Update imports
```bash
# SaaS imports from upr-os package
import { JourneyEngine } from '@premiumradar/upr-os';
```

---

## Enforcement Rules

### Import Rules (ESLint)

```javascript
// .eslintrc.js
{
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          // UPR OS cannot import from SaaS
          {
            group: ['@premiumradar/saas/*', '../saas/*'],
            message: 'UPR OS cannot import from SaaS layer'
          }
        ]
      }
    ]
  }
}
```

### Package Dependencies

```json
// packages/upr-os/package.json
{
  "name": "@premiumradar/upr-os",
  "dependencies": {
    // NO SaaS dependencies allowed
  }
}

// packages/saas/package.json
{
  "name": "@premiumradar/saas",
  "dependencies": {
    "@premiumradar/upr-os": "workspace:*"  // Can import OS
  }
}
```

---

## Summary

| Aspect | UPR OS | PremiumRadar SaaS |
|--------|--------|-------------------|
| **Purpose** | Intelligence Engine | Multi-tenant UI |
| **Knows tenants?** | NO | YES |
| **GCP Service** | `upr-os-api` (Cloud Run) | `premiumradar-saas` (Cloud Run) |
| **Package** | `packages/upr-os` | `packages/saas` |
| **Sprints** | S50-53, S55-56, S58-61, S64-74 | S48-49, S54, S57, S62-63, S76-77 |
| **Import direction** | Cannot import SaaS | CAN import UPR OS |
