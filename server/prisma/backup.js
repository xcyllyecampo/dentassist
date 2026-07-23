const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const backupsDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = "dental_assist_backup_" + timestamp + ".sql";
  const filepath = path.join(backupsDir, filename);

  const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dental_assist?schema=public";
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/([^?]+)/);
  if (!match) {
    console.error("ERROR: Could not parse DATABASE_URL.");
    console.error("Expected: postgresql://user:password@host:port/database");
    rl.close();
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  console.log("=== DentAssist Database Backup ===\n");
  console.log("  Host:     " + host + ":" + port);
  console.log("  Database: " + database);
  console.log("  User:     " + user);
  console.log("  Output:   " + path.relative(process.cwd(), filepath) + "\n");

  const answer = await ask("Proceed with backup? (yes/no): ");
  if (answer.trim().toLowerCase() !== "yes") {
    console.log("Backup cancelled.");
    rl.close();
    return;
  }

  console.log("\nCreating backup...");

  try {
    const env = Object.assign({}, process.env, { PGPASSWORD: password });
    execSync(
      "pg_dump -h " + host + " -p " + port + " -U " + user + " -d " + database + " --no-owner --no-privileges -f \"" + filepath + "\"",
      { env: env, stdio: "pipe" }
    );

    const stats = fs.statSync(filepath);
    const sizeKB = (stats.size / 1024).toFixed(1);

    console.log("Backup completed successfully!");
    console.log("  File:     " + filename);
    console.log("  Size:     " + sizeKB + " KB");
    console.log("  Location: " + path.relative(process.cwd(), filepath) + "\n");

    const backups = fs.readdirSync(backupsDir)
      .filter(function(f) { return f.endsWith(".sql"); })
      .sort()
      .reverse();

    if (backups.length > 10) {
      const toDelete = backups.slice(10);
      for (const old of toDelete) {
        fs.unlinkSync(path.join(backupsDir, old));
        console.log("  Cleaned up old backup: " + old);
      }
    }
  } catch (err) {
    console.error("\nBackup FAILED: " + err.message);
    console.error("Make sure pg_dump is installed and in your PATH.");
    console.error("PostgreSQL bin path example: C:\\Program Files\\PostgreSQL\\17\\bin");
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main();
