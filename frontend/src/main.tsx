import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { BrandingProvider } from "./BrandingContext";
import { AppRenewalGate } from "./AppRenewalGate";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrandingProvider>
      <AppRenewalGate>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppRenewalGate>
    </BrandingProvider>
  </React.StrictMode>
);
