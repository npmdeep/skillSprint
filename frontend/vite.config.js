import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    target: "es2020",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "@tanstack/react-query"],
          stellar: ["@stellar/stellar-sdk", "@stellar/freighter-api"]
        }
      }
    }
  }
});

// Note: posthog-js is intentionally imported both statically (main.jsx init) and
// dynamically (App.jsx capture calls). The static import wins and keeps it in the main bundle.
