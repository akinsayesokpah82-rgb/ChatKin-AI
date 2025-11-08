// client/src/App.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  setDoc
} from "firebase/firestore";

const API_BASE = ""; // leave blank so same origin works (Render serves client+server)

function AuthForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState("login"); // "login" or "signup"

  async function submit(e) {
    e.preventDefault();
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        onLogin(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        onLogin(cred.user);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="auth-card">
      <h2>{mode === "signup" ? "Sign up" : "Log in"}</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">{mode === "signup" ? "Sign up" : "Log in"}</button>
          <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Switch to login" : "Switch to signup"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [convos, setConvos] = useState([]); // list of conversation docs
  const [activeConv, setActiveConv] = useState(null); // id
  const [messages, setMessages] = useState([]); // messages of active conv
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setConvos([]);
        setActiveConv(null);
        setMessages([]);
      } else {
        loadConversations(u.uid);
      }
    });
    return unsub;
  }, []);

  // Load conversations list from Firestore for current user
  async function loadConversations(uid) {
    try {
      const q = query(collection(db, "users", uid, "conversations"), orderBy("createdAt", "desc"));
      // realtime
      onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setConvos(list);
        if (list.length && !activeConv) {
          setActiveConv(list[0].id);
          loadMessages(uid, list[0].id);
        }
      });
    } catch (err) {
      console.error("loadConversations", err);
    }
  }

  // Load messages for conv in realtime
  function loadMessages(uid, convId) {
    if (!uid || !convId) return;
    const messagesRef = collection(db, "users", uid, "conversations", convId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMessages(list);
    });
  }

  // Create new conversation
  async function newConversation() {
    if (!user) return;
    const convRef = await addDoc(collection(db, "users", user.uid, "conversations"), {
      title: "New conversation",
      createdAt: new Date()
    });
    setActiveConv(convRef.id);
    setMessages([]);
  }

  // send message to server (and store in Firestore)
  async function sendMessage() {
    if (!text.trim() || !user || !activeConv) return;
    const uid = user.uid;
    const convId = activeConv;
    const userMsg = { role: "user", content: text, createdAt: new Date() };

    // add to Firestore
    await addDoc(collection(db, "users", uid, "conversations", convId, "messages"), userMsg);

    setText("");
    setLoading(true);
    try {
      // Call server with userId for memory
      const resp = await axios.post(`${API_BASE}/api/chat`, { userId: uid, message: text });
      const aiReply = resp.data.reply || "No reply";
      const assistantMsg = { role: "assistant", content: aiReply, createdAt: new Date() };
      // store assistant message
      await addDoc(collection(db, "users", uid, "conversations", convId, "messages"), assistantMsg);
    } catch (err) {
      console.error("sendMessage error", err);
      await addDoc(collection(db, "users", uid, "conversations", convId, "messages"), {
        role: "assistant", content: "Sorry — could not get a reply.", createdAt: new Date()
      });
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile() {
    if (!file || !user || !activeConv) return setUploadStatus("Choose a file and conversation first.");
    const fd = new FormData();
    fd.append("file", file);
    setUploadStatus("Uploading...");
    try {
      const r = await axios.post(`${API_BASE}/api/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const { url, filename, contentSnippet } = r.data;
      // store a message referring to uploaded file
      await addDoc(collection(db, "users", user.uid, "conversations", activeConv, "messages"), {
        role: "user",
        content: `Uploaded file: ${filename} — ${url}`,
        fileUrl: url,
        createdAt: new Date()
      });
      if (contentSnippet) {
        await addDoc(collection(db, "users", user.uid, "conversations", activeConv, "messages"), {
          role: "assistant",
          content: `I extracted some text from the file:\n\n${contentSnippet}`,
          createdAt: new Date()
        });
      }
      setUploadStatus("Uploaded");
      setFile(null);
    } catch (err) {
      console.error("uploadFile", err);
      setUploadStatus("Upload failed");
    }
  }

  if (!user) {
    return <AuthForm onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="container">
      <header>
        <h1>ChatKin AI</h1>
        <div>
          <button onClick={() => { signOut(auth); }}>Sign out</button>
        </div>
      </header>

      <main>
        <aside className="sidebar">
          <button onClick={newConversation}>+ New</button>
          <div className="convo-list">
            {convos.map(c => (
              <div key={c.id} className={`convo ${c.id === activeConv ? "active":""}`}
                onClick={() => { setActiveConv(c.id); loadMessages(user.uid, c.id); }}>
                <div className="title">{c.title || "Untitled"}</div>
                <div className="time">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : ""}</div>
              </div>
            ))}
          </div>
        </aside>

        <section className="chat">
          <div className="messages">
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="bubble">
                  {m.content}
                  {m.fileUrl && <div><a href={m.fileUrl} target="_blank" rel="noreferrer">Open file</a></div>}
                </div>
              </div>
            ))}
          </div>

          <div className="composer">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." />
            <button onClick={sendMessage} disabled={loading}>{loading ? "..." : "Send"}</button>

            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={uploadFile}>Upload</button>
            <div>{uploadStatus}</div>
          </div>
        </section>
      </main>

      <style>{`
        .container { display:flex; flex-direction:column; height:100vh; }
        header { padding:12px; background:#2563eb; color:white; display:flex; justify-content:space-between; align-items:center; }
        main { display:flex; flex:1; }
        .sidebar { width:260px; border-right:1px solid #eee; padding:12px; background:#fafafa; }
        .chat { flex:1; display:flex; flex-direction:column; }
        .messages { flex:1; padding:12px; overflow:auto; background:#f6f8fa; }
        .composer { padding:12px; display:flex; gap:8px; align-items:center; border-top:1px solid #eee; }
        .msg.user { display:flex; justify-content:flex-end; margin-bottom:8px; }
        .msg.assistant { display:flex; justify-content:flex-start; margin-bottom:8px; }
        .bubble { max-width:70%; padding:10px; border-radius:10px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
        .msg.user .bubble { background:#0369a1; color:#fff; }
        .convo { padding:8px; border-radius:8px; cursor:pointer; margin-bottom:6px; }
        .convo.active { background:#e6f0ff; }
      `}</style>
    </div>
  );
}
