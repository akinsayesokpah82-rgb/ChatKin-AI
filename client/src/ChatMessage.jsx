import React from "react";

const ChatMessage = ({ role, content }) => {
  return (
    <div className={`message ${role}`}>
      <div className="bubble">{content}</div>
    </div>
  );
};

export default ChatMessage;
