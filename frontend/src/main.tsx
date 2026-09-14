import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { BrandingProvider } from "./BrandingContext";
import { RenewalGate } from "./RenewalGate";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrandingProvider>
      <RenewalGate>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RenewalGate>
    </BrandingProvider>
  </React.StrictMode>
);
