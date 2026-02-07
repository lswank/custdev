import { test, expect } from './fixtures';

test.describe('Search', () => {
  test('search page loads with search input', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('h1')).toHaveText('Search');
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search the wiki...');
  });

  test('search page shows fallback message when index is not built', async ({ page }) => {
    // In dev mode, the Pagefind index may not exist. The search script catches
    // the error and shows a fallback message. We verify either the input is
    // usable or the fallback appears.
    await page.goto('/search');
    const container = page.locator('#search-container');
    await expect(container).toBeVisible();
    // Wait a moment for the script to run and potentially show the fallback
    await page.waitForTimeout(1000);
    // Either the search input is still present (index loaded) or the fallback text appears
    const hasInput = await page.locator('#search-input').isVisible().catch(() => false);
    const hasFallback = await container.locator('text=Search index not yet built').isVisible().catch(() => false);
    expect(hasInput || hasFallback).toBeTruthy();
  });

  test('API endpoint /api/terms/activation.json returns correct JSON', async ({ page }) => {
    const response = await page.request.get('/api/terms/activation.json');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Verify term structure
    expect(body.term).toBeDefined();
    expect(body.term.slug).toBe('activation');
    expect(body.term.name).toBe('Activation');
    expect(body.term.aliases).toContain('user activation');
    expect(body.term.aliases).toContain('first value moment');
    expect(body.term.phase).toBe('validation');
    expect(body.term.status).toBe('published');
    // Verify definitions array
    expect(body.definitions).toBeDefined();
    expect(Array.isArray(body.definitions)).toBe(true);
    expect(body.definitions.length).toBeGreaterThanOrEqual(2);
    const globalDef = body.definitions.find(
      (d: { product: string }) => d.product === 'global'
    );
    expect(globalDef).toBeDefined();
    expect(globalDef.confidence).toBe('tested');
    const quickbiteDef = body.definitions.find(
      (d: { product: string }) => d.product === 'quickbite'
    );
    expect(quickbiteDef).toBeDefined();
    expect(quickbiteDef.override_reason).toContain('first order within 7 days');
    // Verify versions array
    expect(body.versions).toBeDefined();
    expect(Array.isArray(body.versions)).toBe(true);
    expect(body.versions.length).toBeGreaterThanOrEqual(2);
  });

  test('API endpoint /api/terms/nonexistent.json returns 404', async ({ page }) => {
    const response = await page.request.get('/api/terms/nonexistent.json');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Term not found');
  });

  test('/api/health endpoint returns JSON with content counts', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.content).toBeDefined();
    expect(body.content.terms).toBe(10);
    expect(body.content.definitions).toBeGreaterThanOrEqual(10);
    expect(body.content.products).toBe(1);
    expect(body.auth_provider).toBe('local');
  });
});
