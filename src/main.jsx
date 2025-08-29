import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { NotificationProvider } from './components/NotificationProvider'; // Add this import
import theme from './ThemeContext.jsx';
import './index.css';

// Enhanced Error Boundary for App
class AppErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#051E2F' }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#BB954D',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register service worker with update handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none', // Ensure fresh service worker updates
      });
      console.log('Service Worker registered:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed and waiting
            console.log('New Service Worker available, prompting for update');
            // Optionally notify user or auto-activate
            newWorker.postMessage({ action: 'skipWaiting' });
          }
        });
      });

      // Ensure service worker is activated
      await navigator.serviceWorker.ready;
      console.log('Service Worker is active');
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  });
}

// Initialize ethereum object (unchanged)
if (typeof window !== 'undefined' && !window.ethereum) {
  try {
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: async ({ method, params }) => {
          console.warn(`Ethereum request (${method}) not handled by mock`);
          return null;
        },
        on: (eventName, callback) => {
          console.warn(`Ethereum event (${eventName}) not handled by mock`);
          return null;
        },
        isConnected: () => false,
      },
      writable: true,
      configurable: true,
    });
    console.log('Mock ethereum object defined');
  } catch (error) {
    console.error('Failed to define ethereum:', error);
  }
}

// Create root and render app
const root = createRoot(document.getElementById('root'));
root.render(
  <AppErrorBoundary>
    <Provider store={store}>
      <HashRouter>
        <React.StrictMode>
          <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <NotificationProvider> {/* Wrap App with NotificationProvider */}
              <App />
            </NotificationProvider>
          </ChakraProvider>
        </React.StrictMode>
      </HashRouter>
    </Provider>
  </AppErrorBoundary>
);