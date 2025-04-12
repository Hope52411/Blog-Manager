// tests/manage-posts.test.js
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

test('UC-8 Normal Flow', async ({ page }) => {
    const postTitle = 'Manage Test Post';
    const commentText = 'Manage Test comment';

    // Sign in as a regular user and post + comment
    await login(page, 'Test2', '123123');
    await page.click('text=+ New Post');
    await page.fill('input[name="title"]', postTitle);
    await page.fill('textarea[name="content"]', 'This is a test post');
    await page.click('button[type="submit"]');

    const postLink = page.locator('article.post-preview a', { hasText: postTitle }).first();
    await expect(postLink).toBeVisible();
    const postHref = await postLink.getAttribute('href');
    await postLink.click();

    await page.fill('textarea[name="content"]', commentText);
    await page.click('button[type="submit"]');

    // Switch to admin account
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
    await page.goto(`${baseUrl}/admin/dashboard`);
    await expect(page.locator('h2')).toContainText('Admin Dashboard');

    // Delete comment
    const commentListItem = page.locator('ul li').filter({ hasText: commentText });
    await expect(commentListItem).toBeVisible();
    await commentListItem.locator('form[action^="/admin/delete-comment"] button').click();
    await expect(
        page.locator('ul li').filter({ hasText: commentText })
    ).toHaveCount(0);

    // Delete post
    const postListItem = page.locator('ul li').filter({ hasText: postTitle });
    await expect(postListItem).toBeVisible();
    await postListItem.locator('form[action^="/admin/delete-post"] button').click();
    await expect(
        page.locator('ul li').filter({ hasText: postTitle })
    ).toHaveCount(0);

});

