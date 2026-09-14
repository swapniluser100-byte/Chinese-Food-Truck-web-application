import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { BrandingProvider } from "./BrandingContext";
import { LicenseGate } from "./LicenseGate";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrandingProvider>
      <LicenseGate>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LicenseGate>
    </BrandingProvider>
  </React.StrictMode>
);
