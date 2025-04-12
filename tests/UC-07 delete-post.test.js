// tests/delete-post.test.js

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

// Helper: login as Test2 user
async function login(page) {
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[name="username"]', 'Test2');
  await page.fill('input[name="password"]', '123123');
  await page.click('button[type="submit"]');
}

// UC-7 Normal Flow: Delete a post successfully
test('UC-7 Normal Flow', async ({ page }) => {
  await login(page);

  // Create a new post to delete
  const title = 'UC7_Delete';
  const content = 'This post will be deleted';

  await page.goto(`${baseUrl}/post/new`);
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="content"]', content);
  await page.click('button[type="submit"]');

  // Find the post in the list
  const postItem = page.locator('article.post-preview').filter({
    has: page.locator(`text=${title}`)
  }).first();

  await expect(postItem).toBeVisible();

  // Click delete button
  await postItem.locator('form[action^="/post/delete"] button').first().click();

  // Confirm the post is no longer visible
  await expect(page.locator('article.post-preview').filter({
    has: page.locator(`text=${title}`)
  })).toHaveCount(0);
});

// UC-7 Exception: Simulate database error during delete
test('UC-7 Exception', async ({ page }) => {
  await login(page);

  // Go to the page where the target post is listed
  const title = 'DB_ERROR_DELETE';

  await page.goto(baseUrl);

  // Locate the post that will trigger DB error
  const postCard = page.locator(`article:has-text("${title}")`);
  await expect(postCard).toBeVisible();

  // Click the delete button
  const deleteBtn = postCard.locator('form[action^="/post/delete"] >> button');
  await deleteBtn.click();

  // Wait for response and check error message
  await page.waitForLoadState('domcontentloaded');
  const bodyText = await page.textContent('body');
  expect(bodyText).toContain('Failed to delete post');
});
