// tests/logout.test.js
const { test, expect } = require('@playwright/test');

const baseUrl = 'http://localhost:3000';

async function loginAsAdmin(page) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
}

test('UC-9 Normal Flow', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${baseUrl}/admin/dashboard`);
    await expect(page.locator('h2')).toHaveText('Admin Dashboard');

    await page.click('text=Logout');
    await expect(page).toHaveURL(/.*login/);

    await page.goto(`${baseUrl}/admin/dashboard`);
    await expect(page.locator('body')).toContainText('Unauthorized. Please log in.');
});

test('UC-9 Exception', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);

    await page.fill('input[name="username"]', 'simulateLogger');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Welcome')).toBeVisible();
});
