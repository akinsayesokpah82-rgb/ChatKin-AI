import React, { useState } from "react";
import ChatMessage from "./ChatMessage";
import Login from "./Login";
import "./index.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const sendMessage = async () => {
    if (!input && !file) return;

    const userMessage = { role: "user", content: input || file.name };
    setMessages([...messages, userMessage]);
    setInput("");

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      await fetch("/api/upload", { method: "POST", body: formData });
      setFile(null);
    }

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
  };

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return (
    <div className="chat-container">
      <h2>💬 ChatKin AI</h2>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
