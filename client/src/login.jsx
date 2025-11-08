import React from "react";

const Login = ({ onLogin }) => {
  return (
    <div className="login-container">
      <h1>Welcome to ChatKin AI 🤖</h1>
      <p>Your Liberian-built AI assistant by Akin Saye Sokpah 🇱🇷</p>
      <button onClick={onLogin}>Continue</button>
    </div>
  );
};

export default Login;
