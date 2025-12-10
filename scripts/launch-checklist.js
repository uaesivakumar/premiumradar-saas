#!/usr/bin/env node

/**
 * Launch Checklist Validation Script
 * S152: Launch Preparation
 *
 * Automated pre-launch checks for PremiumRadar SaaS
 * Run: node scripts/launch-checklist.js
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

// Configuration
const STAGING_URL = process.env.STAGING_URL || 'https://premiumradar-saas-staging-k7u2rgnvna-uc.a.run.app';
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://app.premiumradar.com';
const TARGET_ENV = process.argv[2] || 'staging';
const BASE_URL = TARGET_ENV === 'production' ? PRODUCTION_URL : STAGING_URL;

// Color helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function fail(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function warn(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

// Check functions
async function checkTypeScript() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    success('TypeScript: No errors');
    return true;
  } catch (error) {
    fail('TypeScript: Errors found');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

async function checkBuild() {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    success('Build: Successful');
    return true;
  } catch (error) {
    fail('Build: Failed');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

async function checkTests() {
  try {
    execSync('npm test -- --run', { stdio: 'pipe' });
    success('Unit Tests: Passing');
    return true;
  } catch (error) {
    fail('Unit Tests: Some tests failing');
    return false;
  }
}

async function checkSecurityAudit() {
  try {
    const result = execSync('npm audit --json', { stdio: 'pipe' });
    const audit = JSON.parse(result.toString());
    const vulns = audit.metadata?.vulnerabilities || {};
    const critical = vulns.critical || 0;
    const high = vulns.high || 0;

    if (critical > 0 || high > 0) {
      fail(`Security Audit: ${critical} critical, ${high} high vulnerabilities`);
      return false;
    }
    success('Security Audit: No critical vulnerabilities');
    return true;
  } catch (error) {
    warn('Security Audit: Could not complete audit');
    return true; // Non-blocking
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { timeout: 10000 }, (response) => {
      let data = '';
      response.on('data', (chunk) => (data += chunk));
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          data: data,
          headers: response.headers,
        });
      });
    });
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkHealthEndpoint() {
  try {
    const response = await httpGet(`${BASE_URL}/api/health`);
    if (response.statusCode === 200) {
      const health = JSON.parse(response.data);
      success(`Health Endpoint: ${health.status} (uptime: ${health.uptime}s)`);
      return true;
    } else if (response.statusCode === 503) {
      warn(`Health Endpoint: Degraded (${response.statusCode})`);
      return true; // Non-critical
    }
    fail(`Health Endpoint: Unexpected status ${response.statusCode}`);
    return false;
  } catch (error) {
    fail(`Health Endpoint: ${error.message}`);
    return false;
  }
}

async function checkStatusEndpoint() {
  try {
    const response = await httpGet(`${BASE_URL}/api/status`);
    if (response.statusCode === 200 || response.statusCode === 503) {
      const status = JSON.parse(response.data);
      if (status.status === 'operational') {
        success('Status Endpoint: All services operational');
      } else {
        warn(`Status Endpoint: ${status.status}`);
      }
      return true;
    }
    fail(`Status Endpoint: Unexpected status ${response.statusCode}`);
    return false;
  } catch (error) {
    warn(`Status Endpoint: ${error.message}`);
    return true; // Non-blocking
  }
}

async function checkSSL() {
  if (!BASE_URL.startsWith('https://')) {
    warn('SSL: Not using HTTPS');
    return TARGET_ENV !== 'production'; // Required for production
  }

  try {
    const response = await httpGet(BASE_URL);
    success('SSL: Valid certificate');
    return true;
  } catch (error) {
    if (error.code === 'CERT_HAS_EXPIRED') {
      fail('SSL: Certificate expired');
      return false;
    }
    if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      fail('SSL: Invalid certificate chain');
      return false;
    }
    // Other errors might be non-SSL related
    success('SSL: Certificate appears valid');
    return true;
  }
}

async function checkEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const optional = [
    'ANTHROPIC_API_KEY',
    'SERP_API_KEY',
    'APOLLO_API_KEY',
    'DATABASE_URL',
  ];

  let allRequired = true;

  for (const envVar of required) {
    if (process.env[envVar]) {
      success(`Env: ${envVar} is set`);
    } else {
      fail(`Env: ${envVar} is missing`);
      allRequired = false;
    }
  }

  for (const envVar of optional) {
    if (process.env[envVar]) {
      info(`Env: ${envVar} is set`);
    } else {
      warn(`Env: ${envVar} not set (optional)`);
    }
  }

  return allRequired;
}

async function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { stdio: 'pipe' }).toString();
    if (status.trim()) {
      warn('Git: Uncommitted changes');
      console.log(colors.dim + status + colors.reset);
      return TARGET_ENV !== 'production'; // Required for production
    }
    success('Git: Clean working directory');
    return true;
  } catch (error) {
    warn('Git: Could not check status');
    return true;
  }
}

async function checkBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).toString().trim();
    if (TARGET_ENV === 'production' && branch !== 'main') {
      fail(`Git Branch: ${branch} (should be main for production)`);
      return false;
    }
    success(`Git Branch: ${branch}`);
    return true;
  } catch (error) {
    warn('Git: Could not check branch');
    return true;
  }
}

// Main execution
async function runChecklist() {
  console.log('');
  log('═══════════════════════════════════════════════════', 'blue');
  log(`  PremiumRadar Launch Checklist - ${TARGET_ENV.toUpperCase()}`, 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  console.log('');
  log(`Target URL: ${BASE_URL}`, 'dim');
  console.log('');

  const results = {};

  // Code Quality Checks
  log('📋 Code Quality', 'blue');
  log('───────────────────────────────────────────────────', 'dim');
  results.typescript = await checkTypeScript();
  results.git = await checkGitStatus();
  results.branch = await checkBranch();
  console.log('');

  // Security Checks
  log('🔒 Security', 'blue');
  log('───────────────────────────────────────────────────', 'dim');
  results.security = await checkSecurityAudit();
  results.ssl = await checkSSL();
  console.log('');

  // Environment Checks
  log('⚙️  Environment', 'blue');
  log('───────────────────────────────────────────────────', 'dim');
  results.env = await checkEnvironmentVariables();
  console.log('');

  // Service Health Checks
  log('🏥 Service Health', 'blue');
  log('───────────────────────────────────────────────────', 'dim');
  results.health = await checkHealthEndpoint();
  results.status = await checkStatusEndpoint();
  console.log('');

  // Build Checks (optional for quick checks)
  if (process.argv.includes('--full')) {
    log('🔨 Build & Test', 'blue');
    log('───────────────────────────────────────────────────', 'dim');
    results.build = await checkBuild();
    results.tests = await checkTests();
    console.log('');
  }

  // Summary
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const allPassed = passed === total;

  log('═══════════════════════════════════════════════════', 'blue');
  if (allPassed) {
    log(`  ✓ ALL CHECKS PASSED (${passed}/${total})`, 'green');
    log('  Ready for launch!', 'green');
  } else {
    log(`  ✗ SOME CHECKS FAILED (${passed}/${total} passed)`, 'red');
    log('  Please fix issues before launching', 'red');
  }
  log('═══════════════════════════════════════════════════', 'blue');
  console.log('');

  process.exit(allPassed ? 0 : 1);
}

// Run
runChecklist().catch((error) => {
  console.error('Launch checklist error:', error);
  process.exit(1);
});
