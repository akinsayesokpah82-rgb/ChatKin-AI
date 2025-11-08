import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Upload setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), (req, res) => {
  res.json({ message: "File uploaded successfully!", file: req.file });
});

// ✅ AI Chat Endpoint (simulated)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (message.toLowerCase().includes("who created you")) {
    return res.json({
      reply: `I was proudly created by Akin Saye Sokpah — from Liberia 🇱🇷, currently attending Smythe University College at Sinkor. Family: Mom Princess K. Sokpah, Dad A-Boy S. Sokpah, Brother Allenton Sokpah, Sister Akinlyn K. Sokpah.`,
    });
  }

  return res.json({
    reply:
      "I’m ChatKin AI 🤖 — you can upload files, ask questions, or say 'who created you' to learn about my origin!",
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
