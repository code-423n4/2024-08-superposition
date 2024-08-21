const path = require("path");
const childProcess = require("child_process");
const { withSentryConfig } = require("@sentry/nextjs");

const gitHash = childProcess
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();

module.exports = withSentryConfig(
  /** @type {import("next").NextConfig} */
  {
    output: "export",
    images: { unoptimized: true },
    env: {
      GIT_HASH: gitHash,
    },
    webpack(config) {
      if (process.env.NODE_V8_COVERAGE) {
        Object.defineProperty(config, "devtool", {
          get() {
            return "source-map";
          },
          set() {},
        });
      }

      // Grab the existing rule that handles SVG imports
      const fileLoaderRule = config.module.rules.find((rule) =>
        rule.test?.test?.(".svg"),
      );

      config.module.rules.push(
        // Reapply the existing rule, but only for svg imports ending in ?url
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/, // *.svg?url
        },
        // Convert all other *.svg imports to React components
        {
          test: /\.svg$/i,
          issuer: fileLoaderRule.issuer,
          resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
          use: [{ loader: "@svgr/webpack", options: { icon: true } }],
        },
      );

      // Modify the file loader rule to ignore *.svg, since we have it handled now.
      fileLoaderRule.exclude = /\.svg$/i;

      config.externals.push("pino-pretty", "lokijs", "encoding");

      return config;
    },
    sassOptions: {
      includePaths: [path.join(__dirname, "src/styles")],
      prependData: `
        @use "@/styles/variables" as *;
        @use "@/styles/mixins" as *;
      `,
    },
  },
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "fluidity-money",
    project: "longtail-testnet",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
);
