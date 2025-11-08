// Minimal Express server for ChatKin (proxy to OpenAI)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 5173;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not set. Set it in .env before starting the server.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }
    const body = {
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    };
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'OpenAI error', detail: errText });
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message || { role: 'assistant', content: 'No response' };
    return res.json({ reply });
  } catch (err) {
    console.error('Server error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Serve client build if exists
const clientBuild = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 ChatKin server listening on port ${PORT}`);
});
