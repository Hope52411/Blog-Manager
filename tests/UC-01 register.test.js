// tests/register.test.js
const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// Load DB config from .env
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

// UC-1 Normal Flow: Successful registration
test('UC-1 Normal Flow', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const password = 'password123';

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    // Expect to be redirected to login page
    await expect(page).toHaveURL(/.*login/);

    // Cleanup: delete the test user from database
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM users WHERE username = ?', [username]);
    await conn.end();
});

// UC-1 A1: Username already exists
test('UC-1 A1', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    const existingUsername = 'Test1'; // Make sure this user exists in your DB
    const password = '123123';

    await page.fill('input[name="username"]', existingUsername);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    // Expect to see an error about username duplication
    await expect(page.locator('text=Username already exists')).toBeVisible();
});

// UC-1 A2: Password and confirm password do not match
test('UC-1 A2', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    const username = 'user_' + Date.now();

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', '123123');
    await page.fill('input[name="confirmPassword"]', '123123123'); // Mismatch
    await page.click('button[type="submit"]');

    // Expect password mismatch message
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
});

// UC-1 A3: Password too weak or short (based on future validation rule)
test('UC-1 A3', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    const username = 'user_' + Date.now();

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', '123'); // Weak password
    await page.fill('input[name="confirmPassword"]', '123');
    await page.click('button[type="submit"]');

    // Assuming weak password handling redirects or stays on page
    await expect(page).toHaveURL(/.*register/);
});
