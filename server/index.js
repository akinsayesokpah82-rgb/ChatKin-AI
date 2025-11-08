// server/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI (you'll set OPENAI_API_KEY in Render)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Handle file uploads
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ reply: "Please type a message!" });

  const lower = message.toLowerCase();

  // Custom responses
  if (lower.includes("who created you") || lower.includes("your creator")) {
    return res.json({
      reply: `I was created by **Akin Saye Sokpah**, a Liberian student currently attending Smythe University College at Sinkor.  
My family: Mom – Princess K. Sokpah, Dad – A-Boy S. Sokpah, Brother – Allenton Sokpah, Sister – Akinlyn K. Sokpah. 🇱🇷`,
    });
  }

  try {
    // Use OpenAI for intelligent replies
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are ChatKin, an AI assistant created by Akin Saye Sokpah." },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.json({ reply: "Sorry, I couldn’t connect to my brain right now 😅" });
  }
});

// 📂 Upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  res.json({
    message: "File uploaded successfully!",
    filename: req.file.originalname,
  });
});

// Serve React frontend
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ ChatKin AI running on port ${PORT}`));
