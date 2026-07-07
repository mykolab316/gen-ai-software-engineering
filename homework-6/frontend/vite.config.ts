import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dashboard runs on :5173 and talks to the FastAPI backend on :8000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
