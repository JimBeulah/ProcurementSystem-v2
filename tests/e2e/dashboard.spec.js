import { test, expect } from '@playwright/test';

test.describe('Project Manager Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input#username', 'admin');
        await page.fill('input#password', 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard*');
    });

    test('should load the dashboard without errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err));

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*dashboard/);
        expect(errors).toHaveLength(0);
    });

    test('should not render the removed Budget Utilization card', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=Budget Utilization')).toHaveCount(0);
    });

    test('should render primary stat cards', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=Projects').first()).toBeVisible();
    });

    test('should render correctly on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/dashboard');
        await expect(page.locator('body')).toBeVisible();
    });
});
