import { test, expect } from './fixtures';

test.describe('Term Resolution', () => {
  test('global definition shows on term page', async ({ page }) => {
    await page.goto('/terms/activation');
    const globalSection = page.locator('.definition-section').filter({ hasText: 'Global Definition' });
    await expect(globalSection).toBeVisible();
    // The global definition should contain content about activation
    await expect(globalSection.locator('.definition-card')).toContainText(
      'Activation is the moment'
    );
  });

  test('product-specific override shows "Overrides global" badge', async ({ page }) => {
    await page.goto('/terms/activation');
    const productSection = page.locator('.definition-section').filter({
      hasText: 'Product-Specific Definitions',
    });
    await expect(productSection).toBeVisible();
    const overrideBadge = productSection.locator('.override-badge');
    await expect(overrideBadge).toBeVisible();
    await expect(overrideBadge).toHaveText('Overrides global');
    // The product name should appear in the override card
    await expect(productSection.locator('.def-header h3')).toContainText('quickbite');
  });

  test('term aliases are displayed', async ({ page }) => {
    await page.goto('/terms/activation');
    const aliases = page.locator('.aliases');
    await expect(aliases).toBeVisible();
    await expect(aliases).toContainText('Also known as:');
    await expect(aliases).toContainText('user activation');
    await expect(aliases).toContainText('first value moment');
  });

  test('confidence level indicator renders', async ({ page }) => {
    await page.goto('/terms/activation');
    // The global definition for activation has confidence "tested"
    const confidenceBadge = page.locator('.confidence-badge').first();
    await expect(confidenceBadge).toBeVisible();
    await expect(confidenceBadge).toHaveText('Tested');
  });

  test('CustDev phase badge shows correct phase', async ({ page }) => {
    await page.goto('/terms/activation');
    // activation is in the "validation" phase
    const phaseIndicator = page.locator('.term-header .phase-indicator');
    await expect(phaseIndicator).toBeVisible();
    await expect(phaseIndicator).toHaveText('Customer Validation');
    await expect(phaseIndicator).toHaveClass(/phase--validation/);
  });

  test('version history displays on term page', async ({ page }) => {
    await page.goto('/terms/activation');
    const versionSection = page.locator('.version-history');
    await expect(versionSection).toBeVisible();
    await expect(versionSection.locator('h2')).toHaveText('Version History');
    // Activation has v1.0 and v2.0
    const entries = versionSection.locator('.timeline-entry');
    await expect(entries).toHaveCount(2);
    // Most recent version (v2.0) should appear first
    await expect(entries.first()).toContainText('v2.0.0');
    await expect(entries.last()).toContainText('v1.0.0');
    // Change summaries should be visible
    await expect(entries.first().locator('.change-summary')).toContainText(
      'Redefined activation as completing first order'
    );
  });

  test('definition method is shown in global definition metadata', async ({ page }) => {
    // The global definition for activation uses method "analytics"
    // The method is part of the definition data; verify via the API endpoint
    const response = await page.request.get('/api/terms/activation.json');
    expect(response.status()).toBe(200);
    const body = await response.json();
    const globalDef = body.definitions.find(
      (d: { product: string }) => d.product === 'global'
    );
    expect(globalDef).toBeDefined();
    expect(globalDef.method).toBe('analytics');
  });
});
