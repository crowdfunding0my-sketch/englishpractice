// Vercel Serverless Function: GET /api/words/:grade
// server/src/routes/words.js のVercelデプロイ用版(同じ単語データを配信する)
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data", "words");

export default function handler(req, res) {
  const grade = req.query.grade;
  if (!["1", "2", "3"].includes(grade)) {
    res.status(400).json({ error: "grade must be 1, 2, or 3" });
    return;
  }

  try {
    const filePath = path.join(dataDir, `grade${grade}.json`);
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "単語データの読み込みに失敗しました" });
  }
}
