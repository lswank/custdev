import { test, expect } from './fixtures';

test.describe('Config-Driven Behavior', () => {
  test('homepage shows wiki title from site config', async ({ page }) => {
    await page.goto('/');
    // site.yaml: wiki.title = "Product Wiki"
    await expect(page.locator('.hero h1')).toHaveText('Product Wiki');
  });

  test('homepage shows company tagline from site config', async ({ page }) => {
    await page.goto('/');
    // site.yaml: company.tagline
    await expect(page.locator('.hero .tagline')).toHaveText(
      'What we know, how we know it, and why it matters'
    );
  });

  test('page title includes company name from config', async ({ page }) => {
    await page.goto('/');
    // index.astro sets title to `${config.wiki.title} — ${config.company.name}`
    await expect(page).toHaveTitle('Product Wiki — Your Company');
  });

  test('products page shows products from config/products.yaml', async ({ page }) => {
    await page.goto('/products');
    // products.yaml defines one product: QuickBite
    await expect(page.locator('.product-grid')).toContainText('QuickBite');
    // The description from config should appear on the detail page
    await page.goto('/products/quickbite');
    await expect(page.locator('.product-header .description')).toContainText(
      'fictional food delivery app'
    );
  });

  test('CustDev phase pages use labels from config', async ({ page }) => {
    // site.yaml defines 4 phases with labels
    await page.goto('/framework/discovery');
    await expect(page.locator('.phase-header h1')).toHaveText('Customer Discovery');

    await page.goto('/framework/validation');
    await expect(page.locator('.phase-header h1')).toHaveText('Customer Validation');

    await page.goto('/framework/creation');
    await expect(page.locator('.phase-header h1')).toHaveText('Customer Creation');

    await page.goto('/framework/building');
    await expect(page.locator('.phase-header h1')).toHaveText('Company Building');
  });

  test('phase cards on homepage use colors from config', async ({ page }) => {
    await page.goto('/');
    const phaseCards = page.locator('.phase-grid .phase-card');
    // site.yaml: discovery color = "#4A90D9", validation = "#7B68EE",
    //            creation = "#50C878", building = "#FF8C00"
    await expect(phaseCards.nth(0)).toHaveAttribute(
      'style',
      /--phase-color:\s*#4A90D9/
    );
    await expect(phaseCards.nth(1)).toHaveAttribute(
      'style',
      /--phase-color:\s*#7B68EE/
    );
    await expect(phaseCards.nth(2)).toHaveAttribute(
      'style',
      /--phase-color:\s*#50C878/
    );
    await expect(phaseCards.nth(3)).toHaveAttribute(
      'style',
      /--phase-color:\s*#FF8C00/
    );
  });

  test('framework overview shows default confidence levels from config', async ({ page }) => {
    await page.goto('/framework');
    const phaseCards = page.locator('.phase-grid .phase-card');
    // Each phase card shows its default_confidence
    await expect(phaseCards.nth(0)).toContainText('hypothesis');
    await expect(phaseCards.nth(1)).toContainText('tested');
    await expect(phaseCards.nth(2)).toContainText('proven');
    await expect(phaseCards.nth(3)).toContainText('canonical');
  });

  test('/api/health shows auth provider type from config', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // auth.yaml: auth.provider = "local"
    expect(body.auth_provider).toBe('local');
  });
});
