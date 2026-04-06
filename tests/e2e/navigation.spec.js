import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
    // Authenticate before each test in this block
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input#username', 'admin');
        await page.fill('input#password', 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard*');
    });

    test('should navigate to projects page', async ({ page }) => {
        // Look for the link to projects in the sidebar/navigation
        // Inertia apps usually trigger navigations without full page reloads
        await page.goto('/projects');
        await expect(page).toHaveURL(/.*projects/);
    });

    test('should navigate to clients page', async ({ page }) => {
        await page.goto('/clients');
        await expect(page).toHaveURL(/.*clients/);
    });

    test('should navigate to inventory page', async ({ page }) => {
        await page.goto('/inventory');
        await expect(page).toHaveURL(/.*inventory/);
    });
});
