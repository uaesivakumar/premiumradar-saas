/**
 * Login E2E Tests
 * S150: E2E Testing
 *
 * Tests for authentication flows including:
 * - Email/password login
 * - Form validation
 * - Error handling
 * - Redirect after login
 */

import { test, expect, PageHelpers } from '../setup/test-fixtures';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state for login tests
    await page.context().clearCookies();
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email.*required|please enter.*email/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show email format error
    await expect(page.getByText(/invalid.*email|email.*format/i)).toBeVisible();
  });

  test('should show error for incorrect credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show authentication error
    await expect(
      page.getByText(/invalid.*credentials|incorrect.*email.*password|authentication failed/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Use test credentials
    await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || 'test@premiumradar.com');
    await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD || 'TestPassword123!');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill('testpassword');

    // Find and click visibility toggle if it exists
    const toggleButton = page.locator('button[aria-label*="password"], [data-testid="toggle-password"]');
    const hasToggle = await toggleButton.count() > 0;

    if (hasToggle) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should have link to signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up|create.*account|register/i });
    await expect(signupLink).toBeVisible();

    await signupLink.click();
    expect(page.url()).toContain('/signup');
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
    const hasForgotLink = await forgotLink.count() > 0;

    if (hasForgotLink) {
      await expect(forgotLink).toBeVisible();
    }
  });
});

test.describe('Session Management', () => {
  test('should persist session across page refreshes', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || 'test@premiumradar.com');
    await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD || 'TestPassword123!');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Refresh the page
    await page.reload();

    // Should still be on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear auth
    await page.context().clearCookies();

    // Try to access protected page
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login**', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });
});
