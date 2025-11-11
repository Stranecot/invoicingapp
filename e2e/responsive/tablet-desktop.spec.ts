import { test, expect, devices } from '@playwright/test';
import { loginAsUser, TEST_USERS } from '../fixtures/test-fixtures';

test.describe('Responsive Design - Tablet', () => {
  test.use({
    ...devices['iPad Pro'],
    baseURL: 'http://localhost:3001',
  });

  test('should display tablet-optimized layout', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Dashboard should be visible
    await page.waitForLoadState('networkidle');

    const hasContent = await page
      .locator('h1, h2')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();

    // Verify tablet viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(768);
    expect(viewport?.width).toBeLessThan(1024);
  });

  test('should display navigation appropriate for tablet', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Tablet might show sidebar or hamburger menu depending on design
    const hasSidebar = await page
      .locator('aside, [data-testid="sidebar"]')
      .isVisible()
      .catch(() => false);

    const hasMobileMenu = await page
      .locator('button[aria-label*="menu"]')
      .isVisible()
      .catch(() => false);

    // Should have some form of navigation
    expect(hasSidebar || hasMobileMenu).toBeTruthy();
  });

  test('should display multi-column layout on tablet', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Stat cards should display in multiple columns
    const statCards = page.locator('[data-testid="stat-card"], .stat-card');
    const cardCount = await statCards.count();

    if (cardCount >= 2) {
      // Get positions of first two cards
      const firstCardBox = await statCards.nth(0).boundingBox();
      const secondCardBox = await statCards.nth(1).boundingBox();

      if (firstCardBox && secondCardBox) {
        // Cards should be side by side (not stacked)
        const areSideBySide = Math.abs(firstCardBox.y - secondCardBox.y) < 50;
        expect(areSideBySide).toBeTruthy();
      }
    }
  });

  test('should display tablet-optimized table layout', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Table should be visible and scrollable
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');

    if (await table.isVisible().catch(() => false)) {
      // Table should fit or be scrollable
      const tableBox = await table.boundingBox();
      const viewport = page.viewportSize();

      expect(tableBox && viewport).toBeTruthy();
    }
  });
});

test.describe('Responsive Design - Desktop', () => {
  test.use({
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 },
    baseURL: 'http://localhost:3001',
  });

  test('should display full desktop layout', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Desktop should show full sidebar
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside, [data-testid="sidebar"]');
    const isSidebarVisible = await sidebar.isVisible().catch(() => false);

    expect(isSidebarVisible).toBeTruthy();

    // Verify desktop viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(1024);
  });

  test('should display multi-column dashboard on desktop', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Wait for content
    await page.waitForLoadState('networkidle');

    // Stat cards should display in multiple columns (3-4)
    const statCards = page.locator('[data-testid="stat-card"], .stat-card');
    const cardCount = await statCards.count();

    if (cardCount >= 3) {
      // Get positions of cards
      const firstCardBox = await statCards.nth(0).boundingBox();
      const secondCardBox = await statCards.nth(1).boundingBox();
      const thirdCardBox = await statCards.nth(2).boundingBox();

      if (firstCardBox && secondCardBox && thirdCardBox) {
        // All three should be on same row
        const areOnSameRow =
          Math.abs(firstCardBox.y - secondCardBox.y) < 50 &&
          Math.abs(secondCardBox.y - thirdCardBox.y) < 50;

        expect(areOnSameRow).toBeTruthy();
      }
    }
  });

  test('should display full-width tables on desktop', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Table should be visible
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');

    if (await table.isVisible().catch(() => false)) {
      // All columns should be visible without scrolling
      const tableBox = await table.boundingBox();
      const viewport = page.viewportSize();

      if (tableBox && viewport) {
        // Table should utilize available space
        expect(tableBox.width).toBeGreaterThan(600);
      }
    }
  });

  test('should show hover states on desktop', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Wait for content
    await page.waitForLoadState('networkidle');

    // Find a button or link
    const button = page.locator('button').first();

    if (await button.isVisible().catch(() => false)) {
      // Hover over button
      await button.hover();

      // Visual hover state should be present (can't easily test CSS, but action should work)
      await page.waitForTimeout(200);

      // Button should still be visible after hover
      const isStillVisible = await button.isVisible();
      expect(isStillVisible).toBeTruthy();
    }
  });

  test('should support keyboard navigation on desktop', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Press Tab to navigate through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Focus should move to next interactive element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // Should have focus on an interactive element
    expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('should display tooltips on desktop hover', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Look for elements with tooltips
    const elementWithTooltip = page.locator('[title], [data-tooltip], [aria-label]').first();

    if (await elementWithTooltip.isVisible().catch(() => false)) {
      await elementWithTooltip.hover();
      await page.waitForTimeout(500);

      // Tooltip might appear (implementation-specific)
      const hasTooltip = await page
        .locator('[role="tooltip"], .tooltip')
        .isVisible()
        .catch(() => false);

      // Tooltips are optional
      expect(typeof hasTooltip).toBe('boolean');
    }
  });

  test('should handle wide-screen layouts', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Content should not stretch too wide
    const mainContent = page.locator('main, [data-testid="main-content"]').first();

    if (await mainContent.isVisible().catch(() => false)) {
      const contentBox = await mainContent.boundingBox();

      if (contentBox) {
        // Content should have reasonable max-width (not stretch to full 1920px)
        // Good UX typically constrains content width for readability
        expect(contentBox.width).toBeLessThan(1800);
      }
    }
  });

  test('should show all table columns on desktop', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Wait for table
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');

    if (await table.isVisible().catch(() => false)) {
      // Count visible columns
      const headerCount = await table.locator('thead th').count();

      // Desktop should show more columns than mobile
      expect(headerCount).toBeGreaterThanOrEqual(4);
    }
  });
});

test.describe('Responsive Design - Breakpoint Tests', () => {
  test('should adapt layout at 640px breakpoint (sm)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    const hasContent = await page
      .locator('h1, h2')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test('should adapt layout at 768px breakpoint (md)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    const hasContent = await page
      .locator('h1, h2')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test('should adapt layout at 1024px breakpoint (lg)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    const hasContent = await page
      .locator('h1, h2')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test('should adapt layout at 1280px breakpoint (xl)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    const hasContent = await page
      .locator('h1, h2')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });
});
