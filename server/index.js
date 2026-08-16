import "dotenv/config";
import express from "express";
import cors from "cors";
import wordsRouter from "./src/routes/words.js";
import imagesRouter from "./src/routes/images.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/words", wordsRouter);
app.use("/api/images", imagesRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Englishword server listening on http://localhost:${PORT}`);
});
