import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/avatars": "http://localhost:3001",
      "/covers": "http://localhost:3001",
    },
  },
});
