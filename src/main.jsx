import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
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

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => console.log('Service Worker registered:', reg))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

// Initialize ethereum object
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
            <App />
          </ChakraProvider>
        </React.StrictMode>
      </HashRouter>
    </Provider>
  </AppErrorBoundary>
);