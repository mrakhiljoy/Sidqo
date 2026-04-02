import dotenv from "dotenv";
import path from "path";

const result = dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

if (result.error) {
  console.error("Failed to load .env.local:", result.error.message);
}

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || result.parsed?.ANTHROPIC_API_KEY || "";
