import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// File upload setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  res.json({ message: "✅ File uploaded successfully!", file: req.file });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const text = message?.toLowerCase() || "";

  if (text.includes("who created you")) {
    return res.json({
      reply:
        "I was created by **Akin Saye Sokpah** 🇱🇷 — a Liberian student currently at Smythe University College, Sinkor. My family includes Mom Princess K. Sokpah, Dad A-Boy S. Sokpah, Brother Allenton Sokpah, and Sister Akinlyn K. Sokpah.",
    });
  }

  res.json({
    reply:
      "I'm ChatKin AI 🤖 — built in Liberia by Akin Saye Sokpah! You can upload files, images, or just chat with me.",
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => console.log(`✅ ChatKin server running on port ${port}`));
