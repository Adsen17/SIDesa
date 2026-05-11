const fs = require("fs");
const path = require("path");

const backupDir = path.join(process.cwd(), "backups");
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 30);

if (!fs.existsSync(backupDir)) {
  console.log("Folder backups belum ada");
  process.exit(0);
}

const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

const files = fs.readdirSync(backupDir);
let deleted = 0;

for (const file of files) {
  const filepath = path.join(backupDir, file);
  const stat = fs.statSync(filepath);

  if (!stat.isFile()) continue;

  if (stat.mtimeMs < cutoff) {
    fs.unlinkSync(filepath);
    deleted++;
    console.log(`Deleted: ${file}`);
  }
}

console.log(`Selesai. Backup lama yang dihapus: ${deleted}`);