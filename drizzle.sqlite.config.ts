import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  out: "./migrations-sqlite",
  schema: "./shared/schema.sqlite.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:" + path.join(process.cwd(), "data", "chatbot.db")
  },
});