import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// User ID (Omniscience)
const USER_ID = 1;

// Read document content
const documents = {
  channel_analysis: fs.readFileSync(path.join(__dirname, "../upload/channel_analysis.txt"), "utf-8"),
  title_guide: fs.readFileSync(path.join(__dirname, "../upload/title_guide.txt"), "utf-8"),
  description_guide: fs.readFileSync(path.join(__dirname, "../upload/description_guide.txt"), "utf-8"),
  script_analysis: fs.readFileSync(path.join(__dirname, "../upload/script_analysis.txt"), "utf-8"),
  thumbnail_mechanics: fs.readFileSync(path.join(__dirname, "../upload/thumbnail_mechanics.txt"), "utf-8"),
  midjourney_prompts: fs.readFileSync(path.join(__dirname, "../upload/midjourney_prompts.txt"), "utf-8"),
};

async function importScripts() {
  console.log("Starting import of initial instruction scripts...");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  for (const [scriptType, content] of Object.entries(documents)) {
    try {
      await connection.execute(
        `INSERT INTO instructionScripts (userId, scriptType, version, content, createdAt) VALUES (?, ?, ?, ?, NOW())`,
        [USER_ID, scriptType, 1, content]
      );
      console.log(`✓ Imported ${scriptType} (version 1)`);
    } catch (error) {
      console.error(`✗ Failed to import ${scriptType}:`, error.message);
    }
  }

  await connection.end();
  console.log("Import completed!");
  process.exit(0);
}

importScripts();
