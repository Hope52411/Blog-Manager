// tests/create-post.test.js
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

const baseUrl = 'http://localhost:3000';

// Helper function to log in
async function login(page, username = 'Test2', password = '123123') {
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/$/); // Redirected to home
}

test('UC-4 Normal Flow', async ({ page }) => {
  await login(page); // Step 1: Log in

  await page.click('text=+ New Post'); // Step 2: Click create

  // Step 3: Fill in form
  const timestamp = Date.now();
  const title = `Test Post ${timestamp}`;
  const content = 'This is a test post created by Playwright.';

  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="content"]', content);

  await page.click('button[type="submit"]'); // Step 4: Submit

  // Step 5: Should redirect to homepage
  await expect(page).toHaveURL(`${baseUrl}/`);

  // Step 6: Check post appears
  const firstPost = page.locator('article.post-preview').first();
  await expect(firstPost.locator('a')).toHaveText(title);

  const conn = await mysql.createConnection(dbConfig);
  await conn.execute('DELETE FROM posts WHERE title = ?', [title]);
  await conn.end();
});

test('UC-4 A1', async ({ page }) => {
  await login(page);

  await page.click('text=+ New Post');

  // Case 1: Empty title
  await page.fill('input[name="title"]', '');
  await page.fill('textarea[name="content"]', 'Some content');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(`${baseUrl}/post/new`);

  // Case 2: Empty content
  await page.fill('input[name="title"]', 'Title only');
  await page.fill('textarea[name="content"]', '');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(`${baseUrl}/post/new`);

  // Case 2: All empty
  await page.fill('input[name="title"]', '');
  await page.fill('textarea[name="content"]', '');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(`${baseUrl}/post/new`);
});

test('UC-4 Exception', async ({ page }) => {
  await login(page);
  await page.click('text=+ New Post');

  await page.fill('input[name="title"]', 'DB_ERROR');
  await page.fill('textarea[name="content"]', '123123');

  await page.click('button[type="submit"]');

  await page.waitForLoadState('domcontentloaded');
  const bodyText = await page.textContent('body');
  expect(bodyText).toContain('Failed to create post');
});