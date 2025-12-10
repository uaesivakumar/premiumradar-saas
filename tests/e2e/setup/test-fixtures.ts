/**
 * Test Fixtures for E2E Tests
 * S150: E2E Testing
 *
 * Custom fixtures and test data factories for PremiumRadar
 */

import { test as base, Page, expect } from '@playwright/test';

// ============================================================
// CUSTOM FIXTURES
// ============================================================

export interface TestUser {
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  vertical: string;
  subVertical: string;
  region: string;
}

export interface TestCompany {
  name: string;
  domain: string;
  industry: string;
  headcount: number;
  location: string;
  signals: string[];
}

// Extended test with custom fixtures
export const test = base.extend<{
  testUser: TestUser;
  testCompany: TestCompany;
  dashboardPage: Page;
  discoveryPage: Page;
  adminPage: Page;
}>({
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: 'test@premiumradar.com',
      name: 'Test User',
      role: 'analyst',
      vertical: 'banking',
      subVertical: 'employee-banking',
      region: 'UAE',
    };
    await use(user);
  },

  testCompany: async ({}, use) => {
    const company: TestCompany = {
      name: 'Acme Corp',
      domain: 'acme.com',
      industry: 'Technology',
      headcount: 500,
      location: 'Dubai, UAE',
      signals: ['hiring-expansion', 'office-opening'],
    };
    await use(company);
  },

  dashboardPage: async ({ page }, use) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  discoveryPage: async ({ page }, use) => {
    await page.goto('/dashboard/discovery');
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export { expect };

// ============================================================
// TEST DATA FACTORIES
// ============================================================

export const TestDataFactory = {
  /**
   * Generate test company data
   */
  company(overrides?: Partial<TestCompany>): TestCompany {
    return {
      name: `Test Company ${Date.now()}`,
      domain: `test-${Date.now()}.com`,
      industry: 'Technology',
      headcount: Math.floor(Math.random() * 1000) + 50,
      location: 'Dubai, UAE',
      signals: ['hiring-expansion'],
      ...overrides,
    };
  },

  /**
   * Generate test user data
   */
  user(overrides?: Partial<TestUser>): TestUser {
    const timestamp = Date.now();
    return {
      email: `test-${timestamp}@premiumradar.com`,
      name: `Test User ${timestamp}`,
      role: 'analyst',
      vertical: 'banking',
      subVertical: 'employee-banking',
      region: 'UAE',
      ...overrides,
    };
  },

  /**
   * Generate test invitation data
   */
  invitation(email?: string, role?: TestUser['role']) {
    return {
      email: email || `invite-${Date.now()}@test.com`,
      role: role || 'analyst',
      workspaceId: 'ws-default',
    };
  },
};

// ============================================================
// PAGE HELPERS
// ============================================================

export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for API response
   */
  async waitForAPI(urlPattern: string | RegExp) {
    return this.page.waitForResponse((response) => {
      if (typeof urlPattern === 'string') {
        return response.url().includes(urlPattern);
      }
      return urlPattern.test(response.url());
    });
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fill form field
   */
  async fillField(label: string, value: string) {
    const field = this.page.getByLabel(label);
    await field.fill(value);
  }

  /**
   * Click button by text
   */
  async clickButton(text: string) {
    await this.page.getByRole('button', { name: text }).click();
  }

  /**
   * Select from dropdown
   */
  async selectOption(label: string, value: string) {
    const select = this.page.getByLabel(label);
    await select.selectOption(value);
  }

  /**
   * Check for toast/notification
   */
  async expectToast(message: string | RegExp) {
    const toast = this.page.locator('[role="alert"], .toast, .notification');
    if (typeof message === 'string') {
      await expect(toast).toContainText(message);
    } else {
      await expect(toast).toHaveText(message);
    }
  }

  /**
   * Take screenshot with descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }
}

// ============================================================
// ASSERTION HELPERS
// ============================================================

export const CustomAssertions = {
  /**
   * Assert URL matches pattern
   */
  async assertUrl(page: Page, pattern: string | RegExp) {
    const url = page.url();
    if (typeof pattern === 'string') {
      expect(url).toContain(pattern);
    } else {
      expect(url).toMatch(pattern);
    }
  },

  /**
   * Assert element count
   */
  async assertCount(page: Page, selector: string, count: number) {
    const elements = page.locator(selector);
    await expect(elements).toHaveCount(count);
  },

  /**
   * Assert table has rows
   */
  async assertTableRows(page: Page, tableSelector: string, minRows: number) {
    const rows = page.locator(`${tableSelector} tbody tr`);
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(minRows);
  },

  /**
   * Assert form error
   */
  async assertFormError(page: Page, fieldName: string, errorMessage: string) {
    const error = page.locator(`[data-field="${fieldName}"] .error, #${fieldName}-error`);
    await expect(error).toContainText(errorMessage);
  },
};
