import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import.meta.env.VITE_API_URL;
import.meta.env.VITE_API_TOKEN;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
