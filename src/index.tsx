import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";
import "./utils/secureLogger";
import { setEnvironmentBasedCSP } from "./utils/csp";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { RazorpayScriptLoader } from "./components/RazorpayScriptLoader";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { initializePalette, watchThemeChanges } from "./utils/generatePalette";
import { redirectFromLinkedInIOS } from "./utils/inAppBrowserRedirect";

// Redirect from LinkedIn iOS in-app browser to Safari (for Google OAuth support)
redirectFromLinkedInIOS();

// Initialize environment-based CSP before rendering the app
setEnvironmentBasedCSP();

// Initialize color palette generation
initializePalette();
watchThemeChanges();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(
  <BrowserRouter>
    <FeatureFlagsProvider>
      <RazorpayScriptLoader />
      <AuthProvider>
        <SubscriptionProvider>
          <App />
        </SubscriptionProvider>
      </AuthProvider>
    </FeatureFlagsProvider>
  </BrowserRouter>
);
