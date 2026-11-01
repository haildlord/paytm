import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// One dev server for both halves: Vite serves the React app, and the Cloudflare plugin
// runs the Hono API (src/worker) inside workerd, the same runtime as production,
// with a local D1 database.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
});
