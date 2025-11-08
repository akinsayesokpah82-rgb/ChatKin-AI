import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are ChatKin — a friendly web assistant.' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => scrollToBottom(), [messages]);
  function scrollToBottom(){ messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }

  async function sendMessage(e){
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Server error');
      }
      const data = await res.json();
      const reply = data.reply || { role: 'assistant', content: '...' };
      setMessages(prev => [...prev, reply]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{fontFamily: 'Inter, system-ui, Arial', padding:20, display:'flex', justifyContent:'center'}}>
      <div style={{width:800, borderRadius:16, boxShadow:'0 6px 24px rgba(0,0,0,0.08)', overflow:'hidden', background:'#fff'}}>
        <header style={{padding:16, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 style={{margin:0}}>ChatKin</h1>
          <div style={{color:'#666'}}>Web • OpenAI API</div>
        </header>
        <main style={{padding:16, height:400, overflow:'auto', background:'#fafafa'}}>
          {messages.filter(m=>m.role!=='system').map((m,i)=>(
            <div key={i} style={{display:'flex', justifyContent: m.role==='user' ? 'flex-end':'flex-start', marginBottom:12}}>
              <div style={{maxWidth:'80%', padding:12, borderRadius:12, background: m.role==='user' ? '#0369a1' : '#f3f4f6', color: m.role==='user' ? '#fff':'#111'}}>
                <div style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>
        <form onSubmit={sendMessage} style={{display:'flex', gap:8, padding:12, borderTop:'1px solid #eee'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder={loading ? 'Waiting for reply...' : 'Type your message...'} style={{flex:1, padding:10, borderRadius:10, border:'1px solid #ddd'}} disabled={loading}/>
          <button type="submit" style={{padding:'10px 16px', borderRadius:10, background:'#0369a1', color:'#fff', border:'none'}} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
        </form>
      </div>
    </div>
  );
}
