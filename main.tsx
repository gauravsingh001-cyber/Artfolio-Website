import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";


import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./index.css";


const container = document.getElementById("root");
if (!container) throw new Error("Root container not found in index.html");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
