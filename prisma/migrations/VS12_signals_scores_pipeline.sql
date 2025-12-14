-- VS12: Create signals, scores, and pipeline tables
-- These tables power the dashboard intelligence data

-- ============================================================
-- SIGNALS TABLE
-- Stores detected signals from various sources (Apollo, SERP, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID,
    company_name VARCHAR(255) NOT NULL,
    signal_type VARCHAR(100) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    confidence DECIMAL(3,2) DEFAULT 0.5,
    relevance DECIMAL(3,2) DEFAULT 0.5,
    source VARCHAR(100),
    source_url TEXT,
    region VARCHAR(100) DEFAULT 'UAE',
    vertical VARCHAR(100) DEFAULT 'banking',
    sub_vertical VARCHAR(100) DEFAULT 'employee-banking',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'processed', 'expired', 'dismissed')),
    metadata JSONB DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for signals
CREATE INDEX IF NOT EXISTS idx_signals_tenant ON signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signals_company ON signals(company_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_region ON signals(region);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_signals_vertical ON signals(vertical, sub_vertical);

-- ============================================================
-- SCORES TABLE
-- Stores QTLE scores for companies
-- ============================================================

CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    company_name VARCHAR(255) NOT NULL,

    -- QTLE Scores (0-100)
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    timing_score INTEGER DEFAULT 0 CHECK (timing_score >= 0 AND timing_score <= 100),
    likelihood_score INTEGER DEFAULT 0 CHECK (likelihood_score >= 0 AND likelihood_score <= 100),
    engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    composite_score INTEGER DEFAULT 0 CHECK (composite_score >= 0 AND composite_score <= 100),

    -- Score breakdown (factors that contributed)
    score_breakdown JSONB DEFAULT '{}',
    reasoning_chain JSONB DEFAULT '[]',

    -- Context
    vertical VARCHAR(100) DEFAULT 'banking',
    sub_vertical VARCHAR(100) DEFAULT 'employee-banking',
    region VARCHAR(100) DEFAULT 'UAE',

    -- Metadata
    signal_count INTEGER DEFAULT 0,
    last_signal_date TIMESTAMP WITH TIME ZONE,
    scoring_version VARCHAR(20) DEFAULT 'v1',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, company_id)
);

-- Indexes for scores
CREATE INDEX IF NOT EXISTS idx_scores_tenant ON scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scores_company ON scores(company_id);
CREATE INDEX IF NOT EXISTS idx_scores_composite ON scores(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_vertical ON scores(vertical, sub_vertical, region);
CREATE INDEX IF NOT EXISTS idx_scores_created ON scores(created_at);

-- ============================================================
-- PIPELINE TABLE
-- Stores sales pipeline/opportunity data
-- ============================================================

CREATE TABLE IF NOT EXISTS pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID NOT NULL,
    company_name VARCHAR(255) NOT NULL,

    -- Pipeline stage
    stage VARCHAR(50) DEFAULT 'prospect' CHECK (stage IN ('prospect', 'qualified', 'meeting', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'converted', 'lost', 'stale')),

    -- Value
    projected_value DECIMAL(15,2) DEFAULT 0,
    actual_value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'AED',

    -- Context
    vertical VARCHAR(100) DEFAULT 'banking',
    sub_vertical VARCHAR(100) DEFAULT 'employee-banking',
    region VARCHAR(100) DEFAULT 'UAE',

    -- Tracking
    source VARCHAR(100),
    notes TEXT,
    next_action VARCHAR(255),
    next_action_date TIMESTAMP WITH TIME ZONE,

    -- Dates
    first_contact_date TIMESTAMP WITH TIME ZONE,
    qualified_date TIMESTAMP WITH TIME ZONE,
    closed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pipeline
CREATE INDEX IF NOT EXISTS idx_pipeline_tenant ON pipeline(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_user ON pipeline(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_company ON pipeline(company_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_vertical ON pipeline(vertical, sub_vertical, region);
CREATE INDEX IF NOT EXISTS idx_pipeline_created ON pipeline(created_at);

-- ============================================================
-- COMPANIES TABLE (Reference table)
-- Stores discovered/enriched company data
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Basic info
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    website VARCHAR(500),

    -- Firmographics
    industry VARCHAR(100),
    size VARCHAR(50),
    headcount INTEGER,
    headcount_growth DECIMAL(5,2),
    founded_year INTEGER,

    -- Location
    headquarters VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'UAE',
    region VARCHAR(100) DEFAULT 'UAE',

    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    linkedin VARCHAR(500),

    -- Enrichment
    description TEXT,
    tech_stack JSONB DEFAULT '[]',
    funding_info JSONB DEFAULT '{}',

    -- Decision maker
    decision_maker_name VARCHAR(255),
    decision_maker_title VARCHAR(255),
    decision_maker_email VARCHAR(255),
    decision_maker_linkedin VARCHAR(500),

    -- Data sources
    data_sources JSONB DEFAULT '[]',
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    enrichment_quality VARCHAR(20) DEFAULT 'low',

    -- Context
    vertical VARCHAR(100) DEFAULT 'banking',
    sub_vertical VARCHAR(100) DEFAULT 'employee-banking',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, domain)
);

-- Indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_region ON companies(region);
CREATE INDEX IF NOT EXISTS idx_companies_vertical ON companies(vertical, sub_vertical);
CREATE INDEX IF NOT EXISTS idx_companies_headcount ON companies(headcount);

-- ============================================================
-- UPDATE TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_signals_updated_at ON signals;
CREATE TRIGGER update_signals_updated_at
    BEFORE UPDATE ON signals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scores_updated_at ON scores;
CREATE TRIGGER update_scores_updated_at
    BEFORE UPDATE ON scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_updated_at ON pipeline;
CREATE TRIGGER update_pipeline_updated_at
    BEFORE UPDATE ON pipeline
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
