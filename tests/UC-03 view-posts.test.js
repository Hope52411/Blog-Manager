const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();
const baseUrl = 'http://localhost:3000';

// Replace with your actual DB config
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

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

// Normal Flow: visitor sees blog post list
test('UC-3 Normal Flow', async ({ page }) => {
    await page.goto(baseUrl);

    await expect(page.locator('h2.page-title')).toHaveText('All Blog Posts');

    const postCount = await page.locator('article.post-preview').count();
    expect(postCount).toBeGreaterThan(0); // Playwright does not support toHaveCountGreaterThan
});

// Alternate Flow: if no posts, show empty message, then restore data
test('UC-3 A1', async ({ page }) => {
    const originalPosts = await backupPosts(); // backup original posts
    const originalComments = await backupComments(); // backup original comments
    await clearPosts();                        // clear posts and comments

    await page.goto(baseUrl);

    await expect(page.locator('h2.page-title')).toHaveText('All Blog Posts');
    await expect(page.locator('article.post-preview')).toHaveCount(0);
    await expect(page.locator('.empty-message')).toBeVisible();
    await expect(page.locator('.empty-message')).toContainText('No posts found');
    await expect(page.locator('.empty-message')).toContainText('Be the first to create one!');
    await expect(page.locator('.empty-message .icon')).toHaveText('📭');

    await restorePosts(originalPosts); // restore posts after test
    await restoreComments(originalComments); // restore comments after test
});

// Extension Flow: clicking a post title should open the detail page and show correct title
test('UC-3 Extension', async ({ page }) => {
    await page.goto(baseUrl);

    const firstPostLink = page.locator('article.post-preview a').first();
    const postTitle = await firstPostLink.innerText();

    await firstPostLink.click();

    await expect(page.locator('h1.post-title')).toHaveText(postTitle);
});
