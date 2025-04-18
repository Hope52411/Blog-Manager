// tests/edit-post.test.js
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

// Helper to log in as Test2
async function login(page) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', 'Test2');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(baseUrl);
}

// Backup all posts
async function backupPosts() {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM posts');
    await conn.end();
    return rows;
}

// Backup all comments
async function backupComments() {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM comments');
    await conn.end();
    return rows;
}

// Delete all posts and comments
async function clearPosts() {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM comments'); // Delete comments first
    await conn.execute('DELETE FROM posts');
    await conn.end();
}

// Restore posts using original data
async function restorePosts(posts) {
    if (!posts || posts.length === 0) return;

    const conn = await mysql.createConnection(dbConfig);
    const insertQuery = `
        INSERT INTO posts (id, title, content, user_id)
        VALUES (?, ?, ?, ?)
    `;

    for (const post of posts) {
        await conn.execute(insertQuery, [
            post.id ?? null,
            post.title ?? 'Untitled',
            post.content ?? '',
            post.user_id ?? 1,
        ]);
    }

    await conn.end();
}

// Restore comments using original data
async function restoreComments(comments) {
    if (!comments || comments.length === 0) return;

    const conn = await mysql.createConnection(dbConfig);
    const insertQuery = `
        INSERT INTO comments (id, content, post_id, user_id)
        VALUES (?, ?, ?, ?)
    `;

    for (const comment of comments) {
        await conn.execute(insertQuery, [
            comment.id ?? null,
            comment.content ?? '',
            comment.post_id ?? null,
            comment.user_id ?? 1
        ]);
    }

    await conn.end();
}

const updatedTitle = 'Updated Title';
const updatedContent = 'Updated content from Playwright';

// UC-6 Normal Flow: Edit post successfully
test('UC-6 Normal Flow', async ({ page }) => {
    await login(page);
    await page.goto(baseUrl);

    const firstEditBtn = page.locator('form[action^="/post/edit"] button').first();
    await firstEditBtn.click();

    const originalPosts = await backupPosts();
    const originalComments = await backupComments();

    await page.waitForSelector('input[name="title"]');
    await page.fill('input[name="title"]', updatedTitle);
    await page.fill('textarea[name="content"]', updatedContent);
    await page.click('button[type="submit"]');

    await expect(page.locator('h1.post-title')).toHaveText(updatedTitle);

    await clearPosts();
    await restorePosts(originalPosts);
    await restoreComments(originalComments);
});

// UC-6 A1: Title or content is empty
test('UC-6 A1', async ({ page }) => {
    await login(page);
    await page.goto(baseUrl);

    const editBtn = page.locator('form[action^="/post/edit"] button').first();
    await editBtn.click();

    await page.waitForSelector('input[name="title"]');

    await page.fill('input[name="title"]', '');
    await page.fill('textarea[name="content"]', updatedContent);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/post\/edit\//);

    await page.fill('input[name="title"]', updatedTitle);
    await page.fill('textarea[name="content"]', '');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/post\/edit\//);
});

// UC-6 Exception Flow: Simulate database error
test('UC-6 Exception', async ({ page }) => {
    await login(page);
    await page.goto(baseUrl);

    const editBtn = page.locator('form[action^="/post/edit"] button').first();
    await editBtn.click();

    await page.waitForSelector('input[name="title"]');
    await page.fill('input[name="title"]', 'DB_ERROR_EDIT');
    await page.fill('textarea[name="content"]', 'This should trigger DB error');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Failed to edit post');
});
