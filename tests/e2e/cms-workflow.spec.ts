import { test, expect } from './fixtures';

test.describe('CMS Workflow', () => {
  test('CMS API root returns repo info for admin user', async ({ adminPage }) => {
    const response = await adminPage.request.get('/api/cms');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.repo).toBe('local');
    expect(body.type).toBe('local');
  });

  test('CMS API is not accessible for contributor (non-admin/editor)', async ({ contributorPage }) => {
    const response = await contributorPage.request.get('/api/cms');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('CMS API is accessible for editor user', async ({ editorPage }) => {
    const response = await editorPage.request.get('/api/cms');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.repo).toBe('local');
  });

  test('CMS API requires authentication', async ({ anonPage }) => {
    // The middleware redirects unauthenticated requests to /admin and /api/cms
    // to /login. For API requests via page.request, this results in a redirect.
    const response = await anonPage.request.get('/api/cms', {
      maxRedirects: 0,
    });
    // Middleware redirects to /login — should be a 302
    expect(response.status()).toBe(302);
  });

  test('/admin route redirects unauthenticated users to login', async ({ anonPage }) => {
    await anonPage.goto('/admin');
    await anonPage.waitForURL('/login');
    await expect(anonPage).toHaveURL('/login');
  });
});
