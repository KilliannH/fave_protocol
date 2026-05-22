import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
localStorage.removeItem('i18nextLng');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
