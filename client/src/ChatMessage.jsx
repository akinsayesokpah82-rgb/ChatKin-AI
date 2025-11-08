import React from "react";

const ChatMessage = ({ role, content }) => {
  return (
    <div className={`message ${role}`}>
      <div className="bubble">
        {role === "bot" ? "🤖 " : "🧑 "} {content}
      </div>
    </div>
  );
};

export default ChatMessage;
