// tests/create-log.test.js
const { test, expect } = require('@playwright/test');

const baseUrl = 'http://localhost:3000';

// Helper: login as admin
async function loginAsAdmin(page) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
}

// UC-9 Normal Flow: Admin logs out successfully
test('UC-9 Normal Flow', async ({ page }) => {
    await loginAsAdmin(page);

    // Access the dashboard
    await page.goto(`${baseUrl}/admin/dashboard`);
    await expect(page.locator('h2')).toHaveText('Admin Dashboard');

    // Click the logout link
    await page.click('text=Logout');
    await expect(page).toHaveURL(/.*login/);

    // Try to access dashboard again after logout
    await page.goto(`${baseUrl}/admin/dashboard`);
    await expect(page.locator('body')).toContainText('Unauthorized. Please log in.');
});

// UC-9 Exception: Simulated logger failure (e.g. logger user test)
test('UC-9 Exception', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);

    await page.fill('input[name="username"]', 'simulateLogger');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');

    // Should still log in and see welcome message
    await expect(page.locator('text=Welcome')).toBeVisible();
});
  