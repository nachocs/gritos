import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

// Google Analytics + AdSense, as carried by the deployed shell. Injected only
// for `vite build`: in the static index.html they would also fire from
// localhost:3001 on every dev reload, polluting the real UA property with
// developer traffic. The deployed HTML is a build artifact, so this is where
// they belong.
const analyticsPlugin = () => ({
  name: "gritos-analytics",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler: () => [
      {
        tag: "script",
        attrs: {
          async: true,
          "data-ad-client": "ca-pub-5436524166740759",
          src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        },
        injectTo: "head",
      },
      {
        tag: "script",
        attrs: {
          async: true,
          src: "https://www.googletagmanager.com/gtag/js?id=UA-108283891-1",
        },
        injectTo: "head",
      },
      {
        tag: "script",
        children:
          'function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","UA-108283891-1");',
        injectTo: "head",
      },
    ],
  },
});

// Legacy's webpack build stamped manifest.json's `version` field from
// package.json at build time (WebpackAssetsManifest in webpack.prod.config.js:
// `version: JSON.stringify(require('../package.json').version)`). manifest.json
// here is a static file copied verbatim by publicDir, so there's nothing to
// stamp it during a plain copy — patch it back in once the copy has happened
// (closeBundle fires after publicDir's contents land in outDir).
const manifestVersionPlugin = () => ({
  name: "gritos-manifest-version",
  apply: "build",
  closeBundle() {
    const manifestPath = path.resolve(__dirname, "dist/manifest.json");
    if (!fs.existsSync(manifestPath)) {
      return;
    }
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    manifest.version = pkg.version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  },
});

export default defineConfig({
  plugins: [react(), analyticsPlugin(), manifestVersionPlugin()],
  root: ".",
  // The icon set, manifest.json and logogritos.jpg are static files the shell
  // references by absolute path; Vite serves publicDir at the site root and
  // copies it into dist/ verbatim. Root-relative is also what manifest.json's
  // own icon entries already assume ("/android-icon-36x36.png") — on the
  // deployed site those 404, since the icons live under /assets/ there.
  publicDir: "src/assets",
  resolve: {
    alias: [
      { find: "underscore", replacement: "lodash" },
      // Allows resolving imports starting with '../../' etc more easily if needed
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // Bare `moment` resolves to dist/moment.js (English-only, no locales),
      // while `moment/locale/<x>` resolves relatively to the root moment.js
      // — two separate module instances, so registering a locale never
      // reaches the one the app actually uses. Force the bare specifier
      // onto the same file `moment/locale/<x>` already resolves to; the
      // `$` anchors this to an exact match so `moment/locale/es` etc. are
      // left alone (they resolve fine on their own).
      {
        find: /^moment$/,
        replacement: path.resolve(__dirname, "node_modules/moment/moment.js"),
      },
    ],
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  define: {
    // Shimming process.env for compatibility with legacy code
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
    "process.env.ENDPOINTS_ROOT_DOMAIN": JSON.stringify("gritos.com"),
  },
  server: {
    port: 3001,
    proxy: {
      "/indices": {
        target: "https://gritos.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/indices/, "/indices"),
      },
      // Old message bodies embed root-relative asset paths (the classic
      // minidreamy smilies, e.g. `/imagenes/mrdreamy/smilies/adlo.gif`). Those
      // resolve against gritos.com in production — legacy never rewrote them
      // either — but against localhost in dev, where nothing serves them, so
      // every legacy smiley rendered as a broken image.
      "/imagenes": {
        target: "https://gritos.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
