import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: ".",
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
    },
  },
});
