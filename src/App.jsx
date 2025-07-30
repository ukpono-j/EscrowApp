import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LogIn from './pages/LogIn';
import UserDashboard from './pages/UserDashboard';
import Register from './pages/Register';
import CreateTransaction from './components/dashboard/CreateTransaction';
import MainProfile from './components/dashboard/MainProfile';
import Transaction from './components/dashboard/Transactions';
import JoinTransaction from './components/dashboard/JoinTransaction';
import DisplayTransaction from './components/dashboard/DisplayTransaction';
import ContactUs from './pages/ContactUs';
import Notification from './components/dashboard/Notification';
import MessageBox from './components/dashboard/MessageBox';
import SetAvatar from './pages/SetAvatar';
import Kyc from './components/dashboard/Kyc';
import Settings from './components/dashboard/Settings';
import Admin from './components/admin/Admin';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  useEffect(() => {
    let deferredPrompt;
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      console.log('beforeinstallprompt event triggered');
      deferredPrompt = event;

      const installButton = document.getElementById('install-btn');
      if (installButton) {
        installButton.style.display = 'block';

        installButton.addEventListener('click', () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
            } else {
              console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
          });
        });
      } else {
        console.warn('Install button not found in DOM');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LogIn /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
      <Route path="/create-transaction" element={<PrivateRoute><CreateTransaction /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><MainProfile /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Transaction /></PrivateRoute>} />
      <Route path="/transactions/tab" element={<PrivateRoute><DisplayTransaction /></PrivateRoute>} />
      <Route path="/join-transaction" element={<PrivateRoute><JoinTransaction /></PrivateRoute>} />
      <Route path="/contact" element={<PrivateRoute><ContactUs /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notification /></PrivateRoute>} />
      <Route path="/setAvatar" element={<PrivateRoute><SetAvatar /></PrivateRoute>} />
      <Route path="/security-settings/kyc" element={<PrivateRoute><Kyc /></PrivateRoute>} />
      <Route path="/security-settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      {/* <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} /> */}
      <Route path="/chat/:chatroomId" element={<PrivateRoute><MessageBox /></PrivateRoute>} />
    </Routes>
  );
}

export default App;