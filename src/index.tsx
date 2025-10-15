import "./index.css";
import React from "react";
import { render } from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { setEnvironmentBasedCSP } from "./utils/csp";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";

// Initialize environment-based CSP before rendering the app
setEnvironmentBasedCSP();

render(
  <FeatureFlagsProvider>
    <AuthProvider>
      <SubscriptionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SubscriptionProvider>
    </AuthProvider>
  </FeatureFlagsProvider>,
  document.getElementById("root")
);
