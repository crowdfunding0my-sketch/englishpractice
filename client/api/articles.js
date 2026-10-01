// Vercel Serverless Function: GET /api/articles?grade=1
// server/src/routes/articles.js のVercelデプロイ用版(同じ記事データを配信する)
// api/words.js と同じクエリパラメータ方式にすることで、動的ルート([grade].js)の
// 認識ゆれを避け、確実にFunctionとして呼び出されるようにしている
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data", "articles");

export default function handler(req, res) {
  const grade = (req.query.grade || "").toString();
  if (!["1", "2", "3"].includes(grade)) {
    res.status(400).json({ error: "grade must be 1, 2, or 3" });
    return;
  }

  try {
    const filePath = path.join(dataDir, `grade${grade}.json`);
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "記事データの読み込みに失敗しました" });
  }
}
