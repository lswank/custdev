import { test, expect } from './fixtures';

test.describe('Wiki Navigation', () => {
  test('homepage loads with wiki title and phase grid', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero h1')).toHaveText('Product Wiki');
    await expect(page.locator('.hero .tagline')).toContainText(
      'What we know, how we know it, and why it matters'
    );
    const phaseCards = page.locator('.phase-grid .phase-card');
    await expect(phaseCards).toHaveCount(4);
    await expect(phaseCards.nth(0)).toContainText('Customer Discovery');
    await expect(phaseCards.nth(1)).toContainText('Customer Validation');
    await expect(phaseCards.nth(2)).toContainText('Customer Creation');
    await expect(phaseCards.nth(3)).toContainText('Company Building');
  });

  test('terms listing page shows all QuickBite terms', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toHaveText('Terms');
    const termCards = page.locator('.term-grid .term-card');
    await expect(termCards).toHaveCount(10);
    // Verify a few known term names are present
    await expect(page.locator('.term-grid')).toContainText('Activation');
    await expect(page.locator('.term-grid')).toContainText('Churn');
    await expect(page.locator('.term-grid')).toContainText('Delivery Radius');
  });

  test('term detail page shows name, phase, and content', async ({ page }) => {
    await page.goto('/terms/activation');
    await expect(page.locator('.term-header h1')).toHaveText('Activation');
    // Phase indicator should show Customer Validation
    await expect(page.locator('.term-header .meta')).toContainText('Customer Validation');
    // The term content should be rendered
    await expect(page.locator('.term-content')).toContainText('Activation is the moment');
  });

  test('products listing page shows QuickBite', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('h1')).toHaveText('Products');
    await expect(page.locator('.product-grid')).toContainText('QuickBite');
  });

  test('product detail page shows product info', async ({ page }) => {
    await page.goto('/products/quickbite');
    await expect(page.locator('.product-header h1')).toHaveText('QuickBite');
    await expect(page.locator('.product-header .description')).toContainText(
      'food delivery app'
    );
    // Phase indicator should be present
    await expect(page.locator('.product-header .meta')).toContainText('Customer Validation');
  });

  test('framework overview page loads with all phases', async ({ page }) => {
    await page.goto('/framework');
    await expect(page.locator('h1')).toHaveText('Customer Development Framework');
    const phaseCards = page.locator('.phase-grid .phase-card');
    await expect(phaseCards).toHaveCount(4);
    await expect(phaseCards.nth(0)).toContainText('Customer Discovery');
    await expect(phaseCards.nth(3)).toContainText('Company Building');
  });

  test('framework phase page loads for discovery', async ({ page }) => {
    await page.goto('/framework/discovery');
    await expect(page.locator('.phase-header h1')).toHaveText('Customer Discovery');
  });

  test('framework phase page loads for validation', async ({ page }) => {
    await page.goto('/framework/validation');
    await expect(page.locator('.phase-header h1')).toHaveText('Customer Validation');
  });

  test('breadcrumb navigation on term page', async ({ page }) => {
    await page.goto('/terms/activation');
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Terms');
    await expect(breadcrumb).toContainText('Activation');
    // The "Terms" breadcrumb link should navigate back to /terms
    const termsLink = breadcrumb.locator('a[href="/terms"]');
    await expect(termsLink).toBeVisible();
  });

  test('navigation links in header', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav.nav');
    await expect(nav.locator('a[href="/terms"]')).toBeVisible();
    await expect(nav.locator('a[href="/products"]')).toBeVisible();
    await expect(nav.locator('a[href="/framework"]')).toBeVisible();
    await expect(nav.locator('a[href="/search"]')).toBeVisible();
  });

  test('404 page for invalid URL', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    // Astro returns a 404 status for unknown routes
    expect(response?.status()).toBe(404);
  });

  test('mobile responsive hamburger menu', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto('/');
    // On mobile, nav-links should be hidden and hamburger visible
    const hamburger = page.locator('.hamburger');
    await expect(hamburger).toBeVisible();
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).not.toBeVisible();
    // Click hamburger to open menu
    await hamburger.click();
    await expect(navLinks).toBeVisible();
    await context.close();
  });
});
