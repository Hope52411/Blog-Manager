// tests/comment.test.js
const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

// Base URL and database config
const baseUrl = 'http://localhost:3000';
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

// Helper function: log in as Test2
async function login(page) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', 'Test2');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(baseUrl + '/');
}

// UC-5 Normal Flow: Add a comment successfully
test('UC-5 Normal Flow', async ({ page }) => {
    await login(page);

    // Open the first post
    const postLink = page.locator('article.post-preview a').first();
    const postHref = await postLink.getAttribute('href');
    await postLink.click();

    // Write and submit a comment
    const commentText = `Test comment ${Date.now()}`;
    await page.fill('textarea[name="content"]', commentText);
    await page.click('button[type="submit"]');

    // Check if the comment appears
    const latestComment = page.locator('.comment-box').last();
    await expect(latestComment).toContainText(commentText);

    // Clean up: delete the test comment
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM comments WHERE content = ?', [commentText]);
    await conn.end();
});

// UC-5 A1: Submit empty comment
test('UC-5 A1', async ({ page }) => {
    await login(page);

    // Open a post
    const postLink = page.locator('article.post-preview a').first();
    await postLink.click();

    // Submit without typing anything
    await page.click('button[type="submit"]');

    // Should stay on the same post page
    await expect(page).toHaveURL(/\/post\/\d+$/);
});

// UC-5 Exception Flow: Simulated DB error
test('UC-5 Exception', async ({ page }) => {
    await login(page);

    // Open a post
    const postLink = page.locator('article.post-preview a').first();
    await postLink.click();

    // Submit comment that triggers error
    await page.fill('textarea[name="content"]', 'DB_ERROR_COMMENT');
    await page.click('button[type="submit"]');

    // Wait for response and check error message
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Failed to add comment');
});
