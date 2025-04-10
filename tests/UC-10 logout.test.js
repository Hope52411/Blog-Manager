// tests/logout.test.js
const { test, expect } = require('@playwright/test');

const baseUrl = 'http://localhost:3000';

async function login(page) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', 'Test2');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
}

test('UC-10 Normal Flow', async ({ page }) => {
    await login(page);

    // Step 2: Click logout
    await page.click('text=Logout');

    // Step 3: Should land on login page
    await expect(page).toHaveURL(/.*login/);
});
