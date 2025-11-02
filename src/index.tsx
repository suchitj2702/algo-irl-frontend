import "./index.css";
import React from "react";
import { render } from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { setEnvironmentBasedCSP } from "./utils/csp";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { initializePalette, watchThemeChanges } from "./utils/generatePalette";

// Initialize environment-based CSP before rendering the app
setEnvironmentBasedCSP();

// Initialize color palette generation
initializePalette();
watchThemeChanges();

render(
  <BrowserRouter>
    <FeatureFlagsProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <App />
        </SubscriptionProvider>
      </AuthProvider>
    </FeatureFlagsProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
