import "dotenv/config";
import express from "express";
import cors from "cors";
import wordsRouter from "./src/routes/words.js";
import imagesRouter from "./src/routes/images.js";
import articlesRouter from "./src/routes/articles.js";
import stripeRouter from "./src/routes/stripe.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Stripeのwebhookは署名検証に生のリクエストボディが必要なため、
// express.json()より前にマウントする(stripe.js内のwebhookルートがexpress.raw()を個別に使う)
app.use("/api/stripe", stripeRouter);

app.use(express.json());

app.use("/api/words", wordsRouter);
app.use("/api/images", imagesRouter);
app.use("/api/articles", articlesRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Englishword server listening on http://localhost:${PORT}`);
});
