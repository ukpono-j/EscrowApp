import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
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

function App() {
  useEffect(() => {
    let deferredPrompt;
    const handleBeforeInstallPrompt = (event) => {
      // Prevent the default prompt
      event.preventDefault();
      console.log('beforeinstallprompt event triggered');
      // Stash the event so it can be triggered later
      deferredPrompt = event;

      // Show custom install button
      const installButton = document.getElementById('install-btn');
      if (installButton) {
        installButton.style.display = 'block';

        installButton.addEventListener('click', () => {
          // Show the prompt
          deferredPrompt.prompt();

          // Wait for the user's response
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
            } else {
              console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
          });
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<PublicRoute element={Home} />} />
        <Route path="/login" element={<PublicRoute element={LogIn} />} />
        <Route path="/register" element={<PublicRoute element={Register} />} />
        <Route path="/dashboard" element={<PrivateRoute element={UserDashboard} />} />
        <Route path="/create-transaction" element={<PrivateRoute element={CreateTransaction} />} />
        <Route path="/profile" element={<PrivateRoute element={MainProfile} />} />
        <Route path="/transactions" element={<PrivateRoute element={Transaction} />} />
        <Route path="/transactions/tab" element={<PrivateRoute element={DisplayTransaction} />} />
        <Route path="/join-transaction" element={<PrivateRoute element={JoinTransaction} />} />
        <Route path="/contact" element={<PrivateRoute element={ContactUs} />} />
        <Route path="/notifications" element={<PrivateRoute element={Notification} />} />
        <Route path="/setAvatar" element={<PrivateRoute element={SetAvatar} />} />
        <Route path="/security-settings/kyc" element={<PrivateRoute element={Kyc} />} />
        <Route path="/security-settings" element={<PrivateRoute element={Settings} />} />
        {/* <Route path="/admin" element={<PrivateRoute element={Admin} />} /> */}
        <Route path="/chat/:chatroomId" element={<PrivateRoute element={MessageBox} />} />
      </Routes>

      <button
        id="install-btn"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          fontFamily: 'Bricolage Grotesque", sans-serif',
          backgroundColor: '#FF5000',
          color: '#fff',
          borderRadius: '30px',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Install App
      </button>
    </>
  );
}

export default App;
