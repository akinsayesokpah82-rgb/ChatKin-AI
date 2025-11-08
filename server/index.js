// server/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 📁 Setup file uploads (stores in /uploads)
const upload = multer({ dest: "uploads/" });

// Get directory path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 Simple AI response endpoint (mock)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) return res.json({ reply: "Please type a message!" });

  // Custom personal answer
  const msg = message.toLowerCase();
  if (msg.includes("who created you") || msg.includes("your creator")) {
    return res.json({
      reply: `I was created by **Akin Saye Sokpah**, a Liberian student currently attending Smythe University College at Sinkor.  
My family: Mom – Princess K. Sokpah, Dad – A-Boy S. Sokpah, Brother – Allenton Sokpah, Sister – Akinlyn K. Sokpah. 🇱🇷`
    });
  }

  // You can integrate OpenAI API here later
  return res.json({ reply: `You said: ${message}` });
});

// 📂 Upload endpoint (image, docs, etc.)
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  res.json({
    message: "File uploaded successfully!",
    filename: req.file.originalname,
    path: req.file.path
  });
});

// 🧱 Serve static files from React
app.use(express.static(path.join(__dirname, "../client/dist")));

// 🧠 Catch-all to React index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ ChatKin AI running on port ${PORT}`));
