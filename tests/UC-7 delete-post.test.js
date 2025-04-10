// tests/delete-post.test.js
const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const baseUrl = 'http://localhost:3000';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

async function login(page) {
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[name="username"]', 'Test2');
  await page.fill('input[name="password"]', '123123');
  await page.click('button[type="submit"]');
}

test('UC-7 Normal Flow', async ({ page }) => {
  await login(page);

  const title = 'UC7_Delete';
  const content = 'This post will be deleted';

  await page.goto(`${baseUrl}/post/new`);
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="content"]', content);
  await page.click('button[type="submit"]');

  const postItem = page.locator('article.post-preview').filter({
    has: page.locator(`text=${title}`)
  }).first();

  await expect(postItem).toBeVisible();

  await postItem.locator('form[action^="/post/delete"] button').first().click();

  await expect(page.locator('article.post-preview').filter({
    has: page.locator(`text=${title}`)
  })).toHaveCount(0);
});


test('UC-7 Exception', async ({ page }) => {
  await login(page);

  const title = 'DB_ERROR_DELETE';

  await page.goto(baseUrl);

  const postCard = page.locator(`article:has-text("${title}")`);
  await expect(postCard).toBeVisible();

  const deleteBtn = postCard.locator('form[action^="/post/delete"] >> button');
  await deleteBtn.click();

  await page.waitForLoadState('domcontentloaded');

  const bodyText = await page.textContent('body');
  expect(bodyText).toContain('Failed to delete post');
});
