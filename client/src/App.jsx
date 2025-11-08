import React, { useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const API_URL = "https://chatkin-ai.onrender.com"; // change to your Render backend URL

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, history: messages }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.content) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `📄 Uploaded: ${file.name}` },
        { role: "assistant", content: data.content },
      ]);
    }
  };

  return (
    <div className="app">
      <h1 className="title">🤖 ChatKin AI</h1>
      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>
            <b>{m.role === "user" ? "You" : "ChatKin"}:</b> {m.content}
          </div>
        ))}
      </div>

      <div className="controls">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={sendMessage}>Send</button>

        <label htmlFor="fileInput" className="upload-btn">📎 Upload</label>
        <input id="fileInput" type="file" onChange={handleFileUpload} hidden />
      </div>
    </div>
  );
}

export default App;
