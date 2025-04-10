// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    workers: 1,

    timeout: 30 * 1000,

    use: {
        headless: true,
        baseURL: 'http://localhost:3000',
    },

    testDir: './tests',
});
