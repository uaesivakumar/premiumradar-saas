# VS9: API Contract Specification

**Authorization Code:** `VS1-VS9-APPROVED-20251213`
**Version:** 1.0.0
**Status:** PRODUCTION READY

---

## Overview

This document defines the official API contract between PremiumRadar SaaS and UPR OS.

### Base URL
- Production: `${UPR_OS_BASE_URL}/api/os`
- Headers Required:
  - `Content-Type: application/json`
  - `x-pr-os-token: ${PR_OS_TOKEN}` (VS1: OS Security)
  - `Authorization: Bearer ${OIDC_TOKEN}` (Production only)
  - `x-tenant-id: ${tenant_id}` (VS5: RLS Context)

---

## Core Endpoints

### 1. Discovery - `POST /api/os/discovery`

Discover signals and leads from configured sources.

**Request:**
```json
{
  "tenant_id": "string (required)",
  "region_code": "string (required)",
  "vertical_id": "string (required)",
  "config": {
    "sources": ["apollo", "linkedin", "custom"],
    "limit": 100,
    "filters": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [...],
    "signals": [...],
    "total": 0,
    "region": "UAE",
    "vertical": "banking"
  },
  "meta": {
    "os_version": "1.0.0",
    "endpoint": "/api/os/discovery",
    "execution_time_ms": 150,
    "request_id": "os-xxx",
    "timestamp": "2025-12-13T00:00:00.000Z"
  }
}
```

**Fallback Response (VS6):**
```json
{
  "success": true,
  "data": {
    "companies": [],
    "signals": [],
    "total": 0,
    "fallback": true,
    "message": "Discovery temporarily unavailable"
  },
  "timestamp": "2025-12-13T00:00:00.000Z"
}
```

---

### 2. Score - `POST /api/os/score`

Calculate QTLE scores with optional AI explanations.

**Request:**
```json
{
  "entity_type": "company | individual",
  "entity_id": "string",
  "entity_data": {
    "name": "string",
    "domain": "string",
    "industry": "string"
  },
  "signals": [
    {
      "type": "string",
      "source": "string",
      "evidence": "string",
      "confidence": 0.0-1.0
    }
  ],
  "score_types": ["q_score", "t_score", "l_score", "e_score", "composite"],
  "options": {
    "include_breakdown": true,
    "include_explanation": true,
    "ai_explanation": false,
    "profile": "banking_employee"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entity_id": "string",
    "entity_type": "company",
    "scores": {
      "q_score": { "value": 85, "rating": "HIGH", "breakdown": {} },
      "t_score": { "value": 72, "category": "NOW", "breakdown": {} },
      "l_score": { "value": 68, "tier": "HOT", "breakdown": {} },
      "e_score": { "value": 90, "strength": "STRONG", "breakdown": {} },
      "composite": { "value": 79, "tier": "HOT", "grade": "B" }
    },
    "explanations": {
      "q_score": "AI-generated explanation...",
      "composite": "AI-generated composite explanation..."
    },
    "scoring_profile": "banking_employee"
  },
  "meta": {...}
}
```

**Fallback Response (VS6):**
```json
{
  "success": true,
  "data": {
    "entity_id": "string",
    "scores": {
      "q_score": { "value": 50, "rating": "FAIR" },
      "composite": { "value": 50, "tier": "COOL", "grade": "C" }
    },
    "explanations": {
      "composite": "Score calculated using fallback values"
    },
    "fallback": true
  },
  "timestamp": "..."
}
```

---

### 3. Outreach - `POST /api/os/outreach`

Generate personalized outreach messages with optional AI.

**Request:**
```json
{
  "leads": [
    {
      "id": "string",
      "name": "string",
      "designation": "string",
      "company": "string",
      "industry": "string",
      "email": "string",
      "linkedin": "string"
    }
  ],
  "options": {
    "channel": "email | linkedin | call",
    "tone": "formal | friendly | direct",
    "template_id": "string",
    "personalization_level": "low | medium | high",
    "profile": "banking_employee",
    "ai_outreach": false,
    "context": {}
  },
  "score": {
    "qtle": {...},
    "total": { "score": 79, "band": "HOT" },
    "flags": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "outreach_items": [
      {
        "lead_id": "string",
        "lead_name": "string",
        "channel": "email",
        "message": {
          "subject": "string",
          "body": "string"
        },
        "generated_at": "2025-12-13T00:00:00.000Z",
        "ai_generated": true
      }
    ],
    "total": 1
  },
  "meta": {...}
}
```

---

### 4. Pipeline - `POST /api/os/pipeline`

Execute full discovery-to-outreach pipeline.

**Request:**
```json
{
  "tenant_id": "string",
  "region_code": "string",
  "vertical_id": "string",
  "config": {
    "mode": "full_pipeline | discovery_to_score | discovery_only",
    "discovery": {...},
    "enrichment": {...},
    "scoring": {...},
    "outreach": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pipeline_id": "string",
    "status": "completed",
    "stages": {
      "discovery": { "status": "completed", "companies": [...] },
      "enrich": { "status": "completed", "enriched": [...] },
      "score": { "status": "completed", "scores": [...] },
      "rank": { "status": "completed", "ranked": [...] },
      "outreach": { "status": "completed", "messages": [...] }
    }
  },
  "meta": {...}
}
```

---

## Authentication (VS1)

### Header Requirements

| Header | Required | Description |
|--------|----------|-------------|
| `x-pr-os-token` | Yes | OS authentication token |
| `Authorization` | Production | `Bearer ${OIDC_TOKEN}` |
| `x-tenant-id` | Yes | Tenant context for RLS |
| `x-user-id` | No | User context |
| `x-request-id` | No | Request tracing |
| `X-Client` | Yes | `premiumradar-saas` |

### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Invalid or missing x-pr-os-token",
  "error_code": "OS_AUTH_FAILED"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Authorization denied - check IAM bindings",
  "error_code": "OS_AUTH_DENIED"
}
```

---

## Security Middleware (VS3 + VS4)

### Prompt Injection Defense (VS3)

Routes with AI enabled (`/score`, `/outreach`, `/pipeline`) are protected by:
- Input sanitization (25+ attack patterns)
- Risk scoring (0-100)
- Auto-block for CRITICAL patterns

### Sales Context Enforcement (VS4)

Active context validation:
- Vertical: `banking` only (others: "Coming Soon")
- Sub-verticals: `employee_banking`, `corporate_banking`, `sme_banking`
- Region: `UAE` only

---

## Resilience (VS6)

### Circuit Breaker States

| State | Behavior |
|-------|----------|
| CLOSED | Normal operation |
| OPEN | Fail fast, use fallback |
| HALF_OPEN | Testing recovery |

### Fallback Behavior

All endpoints return fallback responses when OS is unavailable:
- Score: Returns `50` (FAIR) for all dimensions
- Discovery: Returns empty array
- Outreach: Returns placeholder message

### Retry Configuration

| Endpoint | Retries | Timeout |
|----------|---------|---------|
| Score | 2 | 15s |
| Discovery | 2 | 30s |
| Outreach | 2 | 20s |
| Pipeline | 1 | varies |

---

## OS Profiles

| Profile | Use Case |
|---------|----------|
| `default` | General scoring |
| `banking_employee` | Employee banking salespeople |
| `banking_corporate` | Corporate banking salespeople |
| `banking_sme` | SME banking salespeople |
| `insurance_individual` | Individual insurance (Coming Soon) |
| `recruitment_hiring` | Recruitment (Coming Soon) |
| `saas_b2b` | SaaS sales (Coming Soon) |

---

## Deprecations

### Deprecated Fields

| Field | Replacement | Removal Date |
|-------|-------------|--------------|
| `entity_ids` | `entity_id` | Q1 2026 |
| `channel_preference` | `options.channel` | Q1 2026 |
| `UPR_OS_API_KEY` | `PR_OS_TOKEN` | Q2 2026 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-13 | Initial VS1-VS9 certified release |

---

*Generated by Claude (TC) - 2025-12-13*
*Authorization: VS1-VS9-APPROVED-20251213*
