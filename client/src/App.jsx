import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./styles.css";
import ChatMessage from "./ChatMessage";
import Login from "./Login";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
};
initializeApp(firebaseConfig);

const App = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const auth = getAuth();

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post("/api/chat", { message: input });
      const reply = { role: "assistant", content: res.data.reply };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to AI." }]);
    }
    setLoading(false);
  };

  const uploadFile = (e) => {
    const file = e.target.files[0];
    if (file) setMessages((prev) => [...prev, { role: "user", content: `Uploaded: ${file.name}` }]);
  };

  if (!user) return <Login />;

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <h2>ChatKin</h2>
        <button onClick={() => signOut(auth)}>Sign out</button>
        <button onClick={() => { setMessages([]); }}>+ New</button>
      </aside>

      <main className="chat-main">
        <div className="messages">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && <p className="loading">Thinking...</p>}
        </div>
        <div className="input-bar">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
          />
          <input type="file" ref={fileInputRef} onChange={uploadFile} style={{ display: "none" }} />
          <button onClick={() => fileInputRef.current.click()}>📎</button>
          <button onClick={sendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
};

export default App;
