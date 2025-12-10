/**
 * Global Setup for E2E Tests
 * S150: E2E Testing
 *
 * Handles authentication state setup for all test projects
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Ensure auth directory exists
const authDir = path.join(__dirname, '../.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';

  console.log('Starting global setup...');
  console.log(`Base URL: ${baseURL}`);

  // Create browser for setup
  const browser = await chromium.launch();

  try {
    // Setup regular user authentication
    await setupUserAuth(browser, baseURL);

    // Setup admin authentication
    await setupAdminAuth(browser, baseURL);

    console.log('Global setup completed successfully');
  } finally {
    await browser.close();
  }
}

async function setupUserAuth(browser: ReturnType<typeof chromium.launch> extends Promise<infer T> ? T : never, baseURL: string) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);

    // Check if already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('User already authenticated');
      await context.storageState({ path: path.join(authDir, 'user.json') });
      return;
    }

    // Fill in test user credentials
    // Using test credentials from environment or defaults
    const testEmail = process.env.E2E_USER_EMAIL || 'test@premiumradar.com';
    const testPassword = process.env.E2E_USER_PASSWORD || 'TestPassword123!';

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 }).catch(() => {
      console.log('Login form not found, may be using different auth flow');
    });

    // Fill credentials if form exists
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.fill(testEmail);
      await page.fill('input[type="password"], input[name="password"]', testPassword);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
        console.log('Did not redirect to dashboard, checking auth state...');
      });
    }

    // Save storage state
    await context.storageState({ path: path.join(authDir, 'user.json') });
    console.log('User auth state saved');
  } catch (error) {
    console.error('Error setting up user auth:', error);
    // Create empty auth state to prevent test failures
    await context.storageState({ path: path.join(authDir, 'user.json') });
  } finally {
    await context.close();
  }
}

async function setupAdminAuth(browser: ReturnType<typeof chromium.launch> extends Promise<infer T> ? T : never, baseURL: string) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);

    // Fill in admin credentials
    const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@premiumradar.com';
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'AdminPassword123!';

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 }).catch(() => {
      console.log('Admin login form not found');
    });

    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.fill(adminEmail);
      await page.fill('input[type="password"], input[name="password"]', adminPassword);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect
      await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
        console.log('Admin did not redirect to dashboard');
      });
    }

    // Save storage state
    await context.storageState({ path: path.join(authDir, 'admin.json') });
    console.log('Admin auth state saved');
  } catch (error) {
    console.error('Error setting up admin auth:', error);
    // Create empty auth state
    await context.storageState({ path: path.join(authDir, 'admin.json') });
  } finally {
    await context.close();
  }
}

export default globalSetup;
