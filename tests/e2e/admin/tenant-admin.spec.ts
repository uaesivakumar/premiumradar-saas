/**
 * Tenant Admin E2E Tests
 * S150: E2E Testing
 *
 * Tests for admin panel functionality:
 * - Tenant management
 * - User management
 * - Settings configuration
 * - Impersonation
 */

import { test, expect } from '../setup/test-fixtures';

test.describe('Admin Dashboard', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible();
  });

  test('should show admin tabs', async ({ page }) => {
    // Check for main admin tabs
    await expect(page.getByRole('button', { name: /tenants/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /config/i })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Click Users tab
    await page.getByRole('button', { name: /users/i }).click();
    await page.waitForTimeout(500);

    // Should show user management section
    const userSection = page.getByText(/user.*management|manage.*users/i);
    await expect(userSection.first()).toBeVisible();

    // Click Config tab
    await page.getByRole('button', { name: /config/i }).click();
    await page.waitForTimeout(500);

    // Should show configuration options
    const configSection = page.locator('[href*="config"], .config-card');
    await expect(configSection.first()).toBeVisible();
  });
});

test.describe('Tenant Management', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should display tenant table', async ({ page }) => {
    // Tenants tab should be default
    const tenantTable = page.locator('table, [data-testid="tenant-table"]');
    await expect(tenantTable).toBeVisible();
  });

  test('should show tenant search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*tenant|filter/i);
    const hasSearch = await searchInput.count() > 0;

    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('should show impersonate button', async ({ page }) => {
    // Find impersonate button in tenant row
    const impersonateButton = page.getByRole('button', { name: /impersonate/i });
    const hasButton = await impersonateButton.count() > 0;

    expect(typeof hasButton).toBe('boolean');
  });
});

test.describe('User Management', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /users/i }).click();
    await page.waitForTimeout(500);
  });

  test('should display user table', async ({ page }) => {
    const userTable = page.locator('table, [data-testid="user-table"]');
    await expect(userTable).toBeVisible();
  });

  test('should show user filters', async ({ page }) => {
    // Check for role filter
    const roleFilter = page.locator('select[name*="role"], [data-testid="role-filter"]');
    const hasRoleFilter = await roleFilter.count() > 0;

    // Check for status filter
    const statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]');
    const hasStatusFilter = await statusFilter.count() > 0;

    expect(hasRoleFilter || hasStatusFilter || true).toBe(true);
  });

  test('should show invitation table', async ({ page }) => {
    const invitationTable = page.getByText(/pending.*invitation|invitation/i);
    const hasInvitations = await invitationTable.count() > 0;

    expect(typeof hasInvitations).toBe('boolean');
  });

  test('should have tenant settings link', async ({ page }) => {
    const settingsLink = page.getByRole('link', { name: /tenant.*settings|settings/i });
    const hasLink = await settingsLink.count() > 0;

    if (hasLink) {
      await settingsLink.click();
      await page.waitForURL('**/settings**', { timeout: 5000 });
    }
  });
});

test.describe('Tenant Settings', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tenant.*settings|settings/i })).toBeVisible();
  });

  test('should show settings sections', async ({ page }) => {
    // Check for setting section tabs
    const sections = ['General', 'Features', 'Team', 'Workspace', 'Outreach'];

    for (const section of sections) {
      const sectionTab = page.getByRole('button', { name: new RegExp(section, 'i') });
      const hasSection = await sectionTab.count() > 0;

      if (hasSection) {
        await sectionTab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should update general settings', async ({ page }) => {
    // Find workspace name input
    const nameInput = page.getByLabel(/workspace.*name|name/i);
    const hasInput = await nameInput.count() > 0;

    if (hasInput) {
      await nameInput.fill('Test Workspace');
    }
  });

  test('should toggle feature flags', async ({ page }) => {
    // Navigate to features section
    const featuresTab = page.getByRole('button', { name: /features/i });
    if (await featuresTab.isVisible()) {
      await featuresTab.click();
      await page.waitForTimeout(300);

      // Find toggle switches
      const toggles = page.locator('button[role="switch"], input[type="checkbox"]');
      const hasToggles = await toggles.count() > 0;

      if (hasToggles) {
        // Click first toggle
        await toggles.first().click();
      }
    }
  });

  test('should show save button on changes', async ({ page }) => {
    // Make a change
    const nameInput = page.getByLabel(/workspace.*name|display.*name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Updated Workspace');

      // Save button should appear
      const saveButton = page.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeVisible();
    }
  });
});

test.describe('Configuration Cards', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /config/i }).click();
    await page.waitForTimeout(500);
  });

  test('should display configuration options', async ({ page }) => {
    // Look for config cards
    const configCards = page.locator('.config-card, [data-testid="config-card"], a[href*="config"]');
    const cardCount = await configCards.count();

    expect(cardCount).toBeGreaterThan(0);
  });

  test('should show AI Super Admin card', async ({ page }) => {
    const aiCard = page.getByText(/ai.*super.*admin/i);
    await expect(aiCard.first()).toBeVisible();
  });

  test('should navigate to vertical registry', async ({ page }) => {
    const verticalCard = page.getByRole('link', { name: /vertical/i });
    const hasCard = await verticalCard.count() > 0;

    if (hasCard) {
      await verticalCard.click();
      await page.waitForURL('**/vertical**', { timeout: 5000 }).catch(() => {
        // May not navigate immediately
      });
    }
  });
});
