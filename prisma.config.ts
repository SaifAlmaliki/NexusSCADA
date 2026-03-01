import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
// Load .env manually (dotenv not installed)
if (existsSync(join(process.cwd(), ".env"))) {
  const content = readFileSync(join(process.cwd(), ".env"), "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1);
      process.env[match[1].trim()] = value;
    }
  }
}
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
