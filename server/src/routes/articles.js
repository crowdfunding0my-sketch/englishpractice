import { Router } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data", "articles");

const router = Router();

router.get("/", async (req, res) => {
  const grade = (req.query.grade || "").toString();
  if (!["1", "2", "3"].includes(grade)) {
    return res.status(400).json({ error: "grade must be 1, 2, or 3" });
  }
  try {
    const filePath = path.join(dataDir, `grade${grade}.json`);
    const raw = await readFile(filePath, "utf-8");
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: "記事データの読み込みに失敗しました" });
  }
});

export default router;
