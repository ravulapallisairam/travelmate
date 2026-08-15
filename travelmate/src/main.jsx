import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { CompareProvider } from "./context/CompareContext";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);