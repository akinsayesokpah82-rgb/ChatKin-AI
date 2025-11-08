import { useState } from "react";
import axios from "axios";

const API_URL = "";

export default function App() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  const sendMessage = async () => {
    if (!message) return;
    const res = await axios.post(`${API_URL}/api/chat`, { message });
    setReply(res.data.reply);
  };

  const handleUpload = async () => {
    if (!file) return setUploadMsg("Please choose a file!");
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUploadMsg(res.data.message);
  };

  return (
    <div style={{
      fontFamily: "Arial",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: "20px",
      background: "#f8f9fa"
    }}>
      <h1>🤖 ChatKin AI</h1>

      <textarea
        rows="3"
        placeholder="Ask me something..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: "300px", padding: "10px" }}
      />
      <button onClick={sendMessage} style={{ padding: "10px 20px" }}>Send</button>

      {reply && (
        <div style={{ background: "#fff", padding: "15px", borderRadius: "10px", width: "320px" }}>
          <b>ChatKin:</b> <p>{reply}</p>
        </div>
      )}

      <hr style={{ width: "80%" }} />

      <h3>📤 Upload a file or image</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} style={{ padding: "8px 16px" }}>Upload</button>
      {uploadMsg && <p>{uploadMsg}</p>}
    </div>
  );
}
