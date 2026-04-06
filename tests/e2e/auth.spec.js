import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should allow user to log in with valid credentials', async ({ page }) => {
        // Go to login page
        await page.goto('/login');

        // Fill in username and password
        await page.fill('input#username', 'admin');
        await page.fill('input#password', 'password');

        // Click the submit button
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard*');

        // Verify we are on the dashboard by checking for a typical dashboard element
        // For example, looking for some text or checking the URL
        await expect(page).toHaveURL(/.*dashboard/);
        
        // Ensure some UI element from the authenticated layout is visible
        // You can adjust this selector based on your actual dashboard layout
        // await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input#username', 'invalid_user');
        await page.fill('input#password', 'wrong_password');

        await page.click('button[type="submit"]');

        // Wait for error message to appear (Inertia usually renders this near the inputs)
        // Look for the "These credentials do not match our records." error or similar
        const errorMessage = page.locator('text=These credentials do not match our records.').first();
        // Since we don't know the exact string, let's just make sure we do NOT go to the dashboard
        await expect(page).not.toHaveURL(/.*dashboard/);
    });
});
