import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app calls /api/*; Vite forwards those to the Python server so the key never reaches the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8000" },
  },
});
