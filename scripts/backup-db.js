const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const databaseUrl = process.env.DATABASE_URL;
const pgDumpPath = process.env.PG_DUMP_PATH || "pg_dump";

if (!databaseUrl) {
  console.error("DATABASE_URL tidak ditemukan di environment");
  process.exit(1);
}

const backupDir = path.join(process.cwd(), "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const filename = `backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
  now.getDate()
)}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(
  now.getSeconds()
)}.sql`;

const filepath = path.join(backupDir, filename);

const command = `"${pgDumpPath}" "${databaseUrl}" > "${filepath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error("Backup gagal:", error.message);
    process.exit(1);
  }

  if (stderr) {
    console.log(stderr);
  }

  console.log(`Backup berhasil: ${filepath}`);
});