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

async function login(page) {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', 'Test2');
    await page.fill('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(baseUrl);
}

// Backup original posts
async function backupPosts() {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM posts');
    await conn.end();
    return rows;
}

// Backup original comments
async function backupComments() {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM comments');
    await conn.end();
    return rows;
}

// Clear all posts and comments
async function clearPosts() {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM comments'); // must delete comments first
    await conn.execute('DELETE FROM posts');
    await conn.end();
}

// Restore posts (keep original time and ID)
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

// Restore comments
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

test('UC-6 Normal Flow', async ({ page }) => {
    await login(page);
    await page.goto(baseUrl);

    const firstEditBtn = page.locator('form[action^="/post/edit"] button').first();
    await firstEditBtn.click();

    const originalPosts = await backupPosts(); // backup original posts
    const originalComments = await backupComments(); // backup original comments
    
    await page.waitForSelector('input[name="title"]');
    await page.fill('input[name="title"]', updatedTitle);
    await page.fill('textarea[name="content"]', updatedContent);
    await page.click('button[type="submit"]');
    await expect(page.locator('h1.post-title')).toHaveText(updatedTitle);
    await clearPosts(); 

    await restorePosts(originalPosts); // restore posts after test
    await restoreComments(originalComments); // restore comments after test
});

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
