import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import store from "./stores/index.js";
import { Provider } from "react-redux";

window.store = store;

const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <Provider store ={store} >
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>
)
