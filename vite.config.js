import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      underscore: "lodash",
      // Allows resolving imports starting with '../../' etc more easily if needed
      "@": path.resolve(__dirname, "./src"),
    },
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
