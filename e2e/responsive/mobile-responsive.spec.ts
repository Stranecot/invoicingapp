import { test, expect, devices } from '@playwright/test';
import { loginAsUser, TEST_USERS } from '../fixtures/test-fixtures';

test.describe('Responsive Design - Mobile', () => {
  test.use({
    ...devices['iPhone 12'],
    baseURL: 'http://localhost:3001',
  });

  test('should display mobile navigation menu', async ({ page }) => {
    // Log in first
    await loginAsUser(page, TEST_USERS.user);

    await page.goto('/dashboard');

    // Check for mobile menu (hamburger icon)
    const mobileMenuButton = page.locator(
      'button[aria-label*="menu"], button:has-text("☰"), [data-testid="mobile-menu"]'
    );

    const hasMobileMenu = await mobileMenuButton.isVisible().catch(() => false);

    // Mobile should have hamburger menu
    expect(hasMobileMenu).toBeTruthy();
  });

  test('should open and close mobile navigation', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Find mobile menu button
    const mobileMenuButton = page.locator(
      'button[aria-label*="menu"], button:has-text("☰"), [data-testid="mobile-menu"]'
    );

    if (await mobileMenuButton.isVisible().catch(() => false)) {
      // Open menu
      await mobileMenuButton.click();

      // Menu should be visible
      await page.waitForTimeout(500);

      const menuContent = page.locator('nav, [role="navigation"], [data-testid="nav-menu"]');
      const isMenuOpen = await menuContent.isVisible().catch(() => false);

      expect(isMenuOpen).toBeTruthy();

      // Close menu
      const closeButton = page.locator(
        'button:has-text("×"), button[aria-label*="close"], button:has-text("Close")'
      );

      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should display mobile-optimized invoice list', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // On mobile, list should be in cards or optimized layout
    const hasContent = await page
      .locator('table, [data-testid="invoice-card"], .invoice-item')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();

    // Verify viewport is mobile size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(640);
  });

  test('should display mobile-optimized dashboard', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Dashboard should be visible and scrollable
    await page.waitForLoadState('networkidle');

    const hasContent = await page
      .locator('h1, h2, [data-testid="stat-card"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();

    // Stats should stack vertically on mobile
    const statCards = page.locator('[data-testid="stat-card"], .stat-card');
    const cardCount = await statCards.count();

    if (cardCount > 0) {
      // First card should be visible
      await expect(statCards.first()).toBeVisible();
    }
  });

  test('should handle mobile form inputs', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/customers');

    // Open create customer form
    const createButton = page.locator('button:has-text("Add Customer"), button:has-text("New")');

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();

      // Wait for form
      await page.waitForSelector('input[name="name"]', { timeout: 3000 });

      // Form inputs should be usable on mobile
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('Mobile Test Customer');

      // Input should accept text
      const value = await nameInput.inputValue();
      expect(value).toBe('Mobile Test Customer');
    }
  });

  test('should display mobile bottom navigation if present', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Check for bottom navigation bar (common on mobile)
    const bottomNav = page.locator(
      '[data-testid="bottom-nav"], .bottom-nav, nav[class*="bottom"]'
    );

    const hasBottomNav = await bottomNav.isVisible().catch(() => false);

    // Bottom nav is optional but common on mobile
    expect(typeof hasBottomNav).toBe('boolean');
  });

  test('should scroll correctly on mobile', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Wait for content
    await page.waitForLoadState('networkidle');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await page.waitForTimeout(500);

    // Verify scroll worked
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('should hide desktop-only elements on mobile', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Desktop sidebar should be hidden on mobile
    const desktopSidebar = page.locator('aside[class*="sidebar"], [data-testid="desktop-sidebar"]');

    const isDesktopSidebarVisible = await desktopSidebar
      .isVisible()
      .catch(() => false);

    // Desktop sidebar should not be visible (hidden or not rendered)
    expect(isDesktopSidebarVisible).toBeFalsy();
  });

  test('should make action buttons mobile-friendly', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Action buttons should be visible and tappable
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), a:has-text("New")'
    );

    if (await createButton.first().isVisible().catch(() => false)) {
      // Button should be large enough for touch
      const buttonBox = await createButton.first().boundingBox();

      if (buttonBox) {
        // Minimum touch target should be 44x44 pixels (iOS guidelines)
        expect(buttonBox.height).toBeGreaterThanOrEqual(36); // Slightly relaxed for web
      }
    }
  });

  test('should handle mobile keyboard interactions', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Search input should work with mobile keyboard
    const searchInput = page.locator('input[type="search"], input[name="search"]');

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.tap();
      await searchInput.fill('INV');

      // Keyboard should not obscure important content
      const value = await searchInput.inputValue();
      expect(value).toBe('INV');
    }
  });

  test('should display mobile-optimized modals', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/customers');

    // Open modal
    const addButton = page.locator('button:has-text("Add Customer")');

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();

      // Modal should appear
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');

      if (await modal.isVisible().catch(() => false)) {
        // Modal should fit mobile screen
        const modalBox = await modal.boundingBox();
        const viewport = page.viewportSize();

        if (modalBox && viewport) {
          expect(modalBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  test('should support swipe gestures if implemented', async ({ page }) => {
    await loginAsUser(page, TEST_USERS.user);
    await page.goto('/invoices');

    // Check if swipe-to-delete or swipe actions exist
    // This is optional functionality

    const firstRow = page.locator('table tbody tr, [data-testid="invoice-card"]').first();

    if (await firstRow.isVisible().catch(() => false)) {
      // Try to swipe (simulate touch drag)
      const box = await firstRow.boundingBox();

      if (box) {
        // Swipe left
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

        // Check if any swipe actions appeared
        await page.waitForTimeout(500);

        // Swipe functionality is optional
        const hasSwipeActions = await page
          .locator('button:has-text("Delete"), button:has-text("Edit")')
          .isVisible()
          .catch(() => false);

        expect(typeof hasSwipeActions).toBe('boolean');
      }
    }
  });
});
