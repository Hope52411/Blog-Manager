// tests/register.test.js
const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// Replace with your actual DB config
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

test('UC-1 Normal Flow', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const password = 'password123';
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*login/);
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM users WHERE username = ?', [username]);
    await conn.end();
});

test('UC-1 A1', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    const existingUsername = 'Test1';
    const password = '123123';

    await page.fill('input[name="username"]', existingUsername);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Username already exists')).toBeVisible();
});

test('UC-1 A2', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    const username = 'user_' + Date.now();

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', '123123');
    await page.fill('input[name="confirmPassword"]', '123123123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
});

test('UC-1 A3', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    const username = 'user_' + Date.now();

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*register/);
});

