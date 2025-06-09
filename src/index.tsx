import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { setEnvironmentBasedCSP } from "./utils/csp";

// Initialize environment-based CSP before rendering the app
setEnvironmentBasedCSP();

render(<App />, document.getElementById("root"));