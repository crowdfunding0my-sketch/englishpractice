import { Router } from "express";

const router = Router();

// query -> { url, expiresAt } のシンプルなメモリキャッシュ（同一単語の再検索を防ぐ）
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1時間

router.get("/", async (req, res) => {
  const query = (req.query.query || "").toString().trim();
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  const cached = cache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ url: cached.url });
  }

  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey || apiKey === "your_pixabay_api_key_here") {
    return res.json({ url: null });
  }

  try {
    const url = `https://pixabay.com/api/?key=${encodeURIComponent(
      apiKey
    )}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=3`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.json({ url: null });
    }
    const data = await response.json();
    const hit = data.hits && data.hits[0];
    const imageUrl = hit ? hit.webformatURL : null;
    cache.set(query, { url: imageUrl, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json({ url: imageUrl });
  } catch (err) {
    res.json({ url: null });
  }
});

export default router;
