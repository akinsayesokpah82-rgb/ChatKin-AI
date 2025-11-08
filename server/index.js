// server/index.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Make uploads folder if missing
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// serve uploads so images/docs are accessible at /uploads/...
app.use("/uploads", express.static(uploadsDir));

// Serve static built client (client/dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../client/dist")));

// Multer for file uploads
const upload = multer({ dest: uploadsDir });

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt with your creator info
const systemPrompt = `
You are ChatKin — a helpful assistant created by Akin Saye Sokpah.
If asked who created you, answer clearly:

"I was created by Akin Saye Sokpah, a Liberian student attending Smythe University College at Sinkor. His parents are Princess K. Sokpah and A-Boy S. Sokpah, and his siblings are Allenton Sokpah and Akinlyn K. Sokpah."

Only provide that creator info when asked about your origin. Always be polite.
`;

// Simple in-memory session memory per userId (keeps small context)
const userMemories = {}; // { userId: [{role, content}, ...] }

/**
 * Helper: record to memory (keeps last N messages)
 */
function recordMemory(userId, role, content) {
  if (!userId) return;
  if (!userMemories[userId]) userMemories[userId] = [];
  userMemories[userId].push({ role, content });
  if (userMemories[userId].length > 20) userMemories[userId].shift(); // keep small
}

/**
 * POST /api/chat
 * body: { userId?: string, message: string, includeUploads?: boolean }
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { userId = "anonymous", message = "" } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const lower = message.toLowerCase();
    // If user asks about creator
    if (lower.includes("who created you") || lower.includes("your creator") || lower.includes("who made you")) {
      const creatorReply = `I was created by Akin Saye Sokpah, a Liberian student attending Smythe University College at Sinkor. His parents are Princess K. Sokpah and A-Boy S. Sokpah, and his siblings are Allenton Sokpah and Akinlyn K. Sokpah.`;
      recordMemory(userId, "assistant", creatorReply);
      return res.json({ reply: creatorReply });
    }

    // Build messages for OpenAI
    const history = userMemories[userId] ? [...userMemories[userId]] : [];
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    // Call OpenAI Chat Completions
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 800,
    });

    const reply = completion.choices?.[0]?.message?.content || "Sorry — I couldn't generate an answer.";
    // record
    recordMemory(userId, "user", message);
    recordMemory(userId, "assistant", reply);

    res.json({ reply });
  } catch (err) {
    console.error("API Chat error:", err?.message || err);
    res.status(500).json({ error: "Chat failed" });
  }
});

/**
 * POST /api/upload
 * multipart: file
 * returns { message, url, contentSnippet? }
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const savedPath = path.join(uploadsDir, req.file.filename);
    const publicUrl = `/uploads/${req.file.filename}`;
    let contentSnippet = "";

    // Try to extract text for documents
    const mimetype = req.file.mimetype || "";
    if (mimetype.includes("pdf")) {
      const data = fs.readFileSync(savedPath);
      const pdf = await pdfParse(data);
      contentSnippet = pdf.text?.slice(0, 3000) || "";
    } else if (mimetype.includes("officedocument") || mimetype.includes("word")) {
      const result = await mammoth.extractRawText({ path: savedPath });
      contentSnippet = result.value?.slice(0, 3000) || "";
    } else if (mimetype.startsWith("text/")) {
      contentSnippet = fs.readFileSync(savedPath, "utf8").slice(0, 3000);
    } else if (mimetype.startsWith("image/")) {
      // For images: we just expose the public URL; image analysis can be invoked by user asking about the uploaded image
      contentSnippet = "Image uploaded. Use the chat to ask questions about the image.";
    } else {
      contentSnippet = "Uploaded file saved, but type not parsed for text.";
    }

    res.json({
      message: "File uploaded",
      url: publicUrl,
      filename: req.file.originalname,
      contentSnippet,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Fallback: serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`✅ ChatKin server listening on port ${PORT}`));
