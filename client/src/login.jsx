import React from "react";

const Login = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    // Mock Google login (since Render free plan can’t use full OAuth easily)
    const mockUser = { name: "Google User", email: "user@example.com" };
    onLogin(mockUser);
  };

  return (
    <div className="login-container">
      <h1>Welcome to ChatKin AI 🤖</h1>
      <p>Created by Akin Saye Sokpah 🇱🇷</p>
      <button onClick={handleGoogleLogin}>Continue with Google</button>
      <button onClick={() => onLogin({ name: "Guest" })}>Continue as Guest</button>
    </div>
  );
};

export default Login;
