import { defineConfig, devices } from "@playwright/test";

import { CoverageReportOptions } from "monocart-reporter";

const coverageReportOptions: CoverageReportOptions = {
  // logging: 'debug',
  name: "Next.js V8 Coverage Report",

  entryFilter: (entry) => {
    // both client side and server side
    return (
      (entry.url.includes("next/static/chunks") &&
        // add localhost condition to exclude walletconnect injected scripts from client chunks
        entry.url.includes("localhost")) ||
      entry.url.includes("next/server/app")
    );
  },
  outputDir: "./playwright-coverage",

  sourceFilter: (sourcePath) => {
    if (sourcePath.includes("node_modules")) return false;
    return (
      sourcePath.includes("src/app") || sourcePath.includes("src/components")
    );
  },
  assetsPath: "../test-results/assets",
  sourcePath: (fileSource) => {
    //_N_E is used by Next.js to identify the Webpack runtime.
    // web here is referred for the next.js app package.json name
    const list = ["_N_E/", "web/"];
    for (const pre of list) {
      if (fileSource.startsWith(pre)) {
        return fileSource.slice(pre.length);
      }
    }
    return fileSource;
  },

  reports: ["v8", "codecov", "console-details"],
};

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT || 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${PORT}`;

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Timeout per test
  timeout: 90 * 1000,
  // Test directory
  testDir: "./e2e",
  // If a test fails, retry it additional 2 times
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: "./test-results",

  // Run your local dev server before starting the tests:
  // https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests
  webServer: {
    command: "pnpm test:command",
    url: baseURL,
    timeout: 120 * 1000,
    stdout: "pipe",
    stderr: "pipe",
    reuseExistingServer: !process.env.CI,
  },

  globalTeardown: "./playwright.teardown.js",

  reporter: [
    ["list"],
    [
      "monocart-reporter",
      {
        coverage: coverageReportOptions,
      },
    ],
  ],

  use: {
    // Use baseURL so to make navigations relative.
    // More information: https://playwright.dev/docs/api/class-testoptions#test-options-base-url
    baseURL,

    // Retry a test if its failing with enabled tracing. This allows you to analyze the DOM, console logs, network traffic etc.
    // More information: https://playwright.dev/docs/trace-viewer
    trace: "retry-with-trace",

    // All available context options: https://playwright.dev/docs/api/class-browser#browser-new-context
    // contextOptions: {
    //   ignoreHTTPSErrors: true,
    // },

    testIdAttribute: "data-test",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // {
    //   name: 'Desktop Firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },
    // {
    //   name: 'Desktop Safari',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },
    // Test against mobile viewports.
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: devices['iPhone 12'],
    // },
  ],
});
