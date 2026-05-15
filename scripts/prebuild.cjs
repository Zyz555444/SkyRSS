/**
 * 在 `next build` 之前按需执行 Drizzle 迁移。
 *
 * - 已设置 DATABASE_URL：始终执行 `drizzle-kit migrate`（幂等，已应用过的迁移会跳过）。
 * - 未设置 DATABASE_URL 且 VERCEL=1：退出失败（避免部署到无库环境）。
 * - 未设置 DATABASE_URL 且非 Vercel：跳过迁移（便于本地无库时仅打包）。
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const drizzleKit = path.join(
  repoRoot,
  "node_modules",
  "drizzle-kit",
  "bin.cjs",
);

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  if (process.env.VERCEL) {
    console.error(
      "[prebuild] 在 Vercel 上部署需要配置 DATABASE_URL，并在 Environment Variables 中为 Production / Preview 勾选「在构建时可用」(Expose to Build)。",
    );
    process.exit(1);
  }
  console.log(
    "[prebuild] 未设置 DATABASE_URL，跳过数据库迁移（仅执行 next build）。",
  );
  process.exit(0);
}

if (!fs.existsSync(drizzleKit)) {
  console.error("[prebuild] 未找到 drizzle-kit，请先执行 npm install。");
  process.exit(1);
}

console.log("[prebuild] 正在执行 drizzle-kit migrate …");
try {
  execFileSync(process.execPath, [drizzleKit, "migrate"], {
    stdio: "inherit",
    cwd: repoRoot,
    env: process.env,
  });
} catch (e) {
  const code = e && typeof e === "object" && "status" in e ? e.status : 1;
  process.exit(typeof code === "number" ? code : 1);
}
