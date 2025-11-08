// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ─── ChatKin Identity ───────────────────────────────────────────────
const systemPrompt = `
You are ChatKin — an intelligent AI assistant created by Akin Saye Sokpah.
If anyone asks "who created you" or "who built you", respond:

"I was created by Akin Saye Sokpah, a Liberian student attending Smythe University College in Sinkor. His parents are Princess K. Sokpah and A-Boy S. Sokpah, and his siblings are Allenton Sokpah and Akinlyn K. Sokpah."

If they want to know more, you can mention that ChatKin was built using OpenAI’s API and deployed on Render by Akin Saye Sokpah.

Do not reveal private info unless users explicitly ask who created you or about your origin. Always be polite and respectful.
`;

// ─── Chat Route ──────────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
      }),
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a response.";
    res.json({ reply: aiMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── File Upload Endpoint ────────────────────────────────────────────
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    let textContent = "";

    if (fileType.includes("pdf")) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
    } else if (fileType.includes("word") || fileType.includes("officedocument")) {
      const data = await mammoth.extractRawText({ path: filePath });
      textContent = data.value;
    } else if (fileType.includes("text") || fileType.includes("plain")) {
      textContent = fs.readFileSync(filePath, "utf8");
    } else if (fileType.includes("image")) {
      textContent = "Image uploaded — image analysis not yet supported.";
    } else {
      textContent = "Unsupported file type.";
    }

    fs.unlinkSync(filePath); // cleanup temp file
    res.json({
      message: "File uploaded successfully",
      content: textContent.slice(0, 3000),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "File processing failed" });
  }
});

// ─── Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`🧠 ChatKin server running on port ${PORT}`));
