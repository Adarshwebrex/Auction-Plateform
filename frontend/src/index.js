import React, { Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { PageLoader } from "./components/ui/LoadingSpinner";
import { registerServiceWorker, setupNetworkMonitoring, setupInstallPrompt } from "./utils/pwa";

// Register service worker for PWA functionality
registerServiceWorker();

// Setup PWA features
const AppWithPWA = () => {
  useEffect(() => {
    // Monitor network status
    const cleanupNetwork = setupNetworkMonitoring((isOnline) => {
      console.log(`Network status: ${isOnline ? 'online' : 'offline'}`);
      // You could update context or show UI indicators here
    });
    
    // Setup app install prompt
    const { installApp } = setupInstallPrompt();
    
    // Make install function available globally for UI components
    window.installPWA = installApp;
    
    return cleanupNetwork;
  }, []);
  
  return <App />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <Suspense fallback={<PageLoader message="Loading AntiqueXX..." />}>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <AppWithPWA />
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </Suspense>
  </ErrorBoundary>
);
