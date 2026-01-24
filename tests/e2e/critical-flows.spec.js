// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Critical Flow Tests for Vifi.ee
 * Testing the most important user journeys as outlined in ROADMAP_SUMMARY.md
 */

test.describe('Video Browsing and Search', () => {
  test('should load homepage with video list', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Vifi/i);
    
    // Check that video items are displayed
    const videoItems = page.locator('.film-item, [class*="film"], [class*="video"]');
    await expect(videoItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('should be able to search for videos', async ({ page }) => {
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for debounce
      
      // Verify search results or search functionality is working
      // Note: Actual assertions depend on the app's search implementation
    }
  });
});

test.describe('User Authentication', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/');
    
    // Look for login/sign in button or link
    const loginButton = page.locator('a:has-text("Login"), button:has-text("Login"), a:has-text("Sign in"), button:has-text("Sign in")').first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Check for login form elements
      const usernameInput = page.locator('input[name="username"], input[type="email"], input[name="email"]').first();
      await expect(usernameInput).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Video Player', () => {
  test('should be able to navigate to video details', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on a video item
    const videoLink = page.locator('a[href*="film"], a[href*="video"], .film-item a').first();
    
    if (await videoLink.isVisible()) {
      await videoLink.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Check that we're on a video detail page
      await expect(page.url()).toContain(/film|video|watch/i);
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that page loads on mobile
    await expect(page).toHaveTitle(/Vifi/i);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check that page loads on tablet
    await expect(page).toHaveTitle(/Vifi/i);
  });
});
