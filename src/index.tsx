import './index.css';
import React from "react";
import { render } from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { setEnvironmentBasedCSP } from "./utils/csp";

// Initialize environment-based CSP before rendering the app
setEnvironmentBasedCSP();

render(
 <BrowserRouter>
  <App />
 </BrowserRouter>, 
 document.getElementById("root")
);