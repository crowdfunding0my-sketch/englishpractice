// Vercel Serverless Function: GET /api/images?query=...
// server/src/routes/images.js のVercelデプロイ用版(Pixabay APIキーはVercelダッシュボードの環境変数で管理する)

// query -> { url, expiresAt } のメモリキャッシュ(同一関数インスタンス内でのみ有効)
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1時間

export default async function handler(req, res) {
  const query = (req.query.query || "").toString().trim();
  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  const cached = cache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    res.status(200).json({ url: cached.url });
    return;
  }

  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    res.status(200).json({ url: null });
    return;
  }

  try {
    const url = `https://pixabay.com/api/?key=${encodeURIComponent(
      apiKey
    )}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=3`;
    const response = await fetch(url);
    if (!response.ok) {
      res.status(200).json({ url: null });
      return;
    }
    const data = await response.json();
    const hit = data.hits && data.hits[0];
    const imageUrl = hit ? hit.webformatURL : null;
    cache.set(query, { url: imageUrl, expiresAt: Date.now() + CACHE_TTL_MS });
    res.status(200).json({ url: imageUrl });
  } catch {
    res.status(200).json({ url: null });
  }
}
