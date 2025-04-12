// tests/login.test.js

const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// Load DB credentials from .env
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

// Reset login attempts and unlock account
async function resetLoginAttempts(username) {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(`
        UPDATE users SET login_attempts = 0, locked_until = NULL WHERE username = ?
    `, [username]);
    await conn.end();
}

// Simulate account lock by setting login_attempts = 5
async function lockUserAccount(username) {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(`
        UPDATE users 
        SET login_attempts = 5, locked_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE) 
        WHERE username = ?
    `, [username]);
    await conn.end();
}

// --- Test Data ---
const baseUrl = 'http://localhost:3000';
const username = 'Test1';           // Make sure this user exists in DB
const correctPassword = '123123';
const wrongPassword = 'wrongpass';

// UC-2 Normal Flow: Successful login with correct credentials
test('UC-2 Normal Flow', async ({ page }) => {
    await resetLoginAttempts(username);

    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', correctPassword);
    await page.click('button[type="submit"]');

    // Check if redirected to home or dashboard
    await expect(page).toHaveURL(/(\/|\/dashboard)$/);
    await expect(page.locator('text=Welcome')).toBeVisible();
});

// UC-2 A1: Login fails with non-existent username
test('UC-2 A1', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    
    const fakeUsername = 'nonexistentuser_' + Date.now();
    await page.fill('input[name="username"]', fakeUsername);
    await page.fill('input[name="password"]', 'anypassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Login failed')).toBeVisible();
});

// UC-2 A2: Wrong password, one attempt
test('UC-2 A2', async ({ page }) => {
    await resetLoginAttempts(username);

    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Login failed')).toBeVisible();
});

// UC-2 A3: Account locks after 5 failed attempts
test('UC-2 A3', async ({ page }) => {
    await resetLoginAttempts(username);

    for (let i = 1; i <= 5; i++) {
        await page.goto(`${baseUrl}/login`);
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', wrongPassword);
        await page.click('button[type="submit"]');

        if (i < 5) {
            // Show current attempt number
            await expect(page.locator(`text=Login failed. Attempt ${i}/5`)).toBeVisible();
        } else {
            // On 5th fail, show lock message
            await expect(page.locator('text=Too many failed attempts. Account locked')).toBeVisible();
        }
    }
});

// UC-2 A4: Cannot log in while account is locked
test('UC-2 A4', async ({ page }) => {
    await lockUserAccount(username);

    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', correctPassword);
    await page.click('button[type="submit"]');

    // Should see account lock message
    await expect(page.locator('text=Account locked')).toBeVisible();
});
