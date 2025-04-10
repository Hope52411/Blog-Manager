// tests/login.test.js
const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

async function resetLoginAttempts(username) {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(`
    UPDATE users SET login_attempts = 0, locked_until = NULL WHERE username = ?
  `, [username]);
    await conn.end();
}

// Manual Account Lock (Test A4)
async function lockUserAccount(username) {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(`
      UPDATE users 
      SET login_attempts = 5, locked_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE) 
      WHERE username = ?
    `, [username]);
    await conn.end();
}

const baseUrl = 'http://localhost:3000';
const username = 'Test1';
const correctPassword = '123123';
const wrongPassword = 'wrongpass';

// UC-2: The login succeeds with the correct user name and password
test('UC-2 Normal Flow', async ({ page }) => {
    await resetLoginAttempts(username);
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', correctPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/(\/|\/dashboard)$/);
    await expect(page.locator('text=Welcome')).toBeVisible();
});

// UC-2 A2: non-existent username
test('UC-2 A1', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    const fakeUsername = 'nonexistentuser_' + Date.now();
    await page.fill('input[name="username"]', fakeUsername);
    await page.fill('input[name="password"]', 'anypassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Login failed')).toBeVisible();
});

// UC-2 A1: Password error. Try counting
test('UC-2 A2', async ({ page }) => {
    await resetLoginAttempts(username);
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Login failed')).toBeVisible();
});

// UC-2 A3: The account is locked after five consecutive incorrect input attempts
test('UC-2 A3', async ({ page }) => {
    await resetLoginAttempts(username);

    for (let i = 1; i <= 5; i++) {
        await page.goto(`${baseUrl}/login`);
        await page.fill('input[name="username"]', username);
        await page.fill('input[name="password"]', wrongPassword);
        await page.click('button[type="submit"]');

        if (i < 5) {
            await expect(page.locator(`text=Login failed. Attempt ${i}/5`)).toBeVisible();
        } else {
            await expect(page.locator('text=Too many failed attempts. Account locked')).toBeVisible();
        }
    }
});

// UC-2 A4: cannot log in after being locked
test('UC-2 A4', async ({ page }) => {
    await lockUserAccount(username);
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', correctPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Account locked')).toBeVisible();
});