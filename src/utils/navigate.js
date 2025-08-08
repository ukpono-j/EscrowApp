import { useNavigate } from 'react-router-dom';

// Hook to be used in React components
export const useCustomNavigate = () => {
  const navigate = useNavigate();
  return (to) => navigate(to);
};

// Utility function for navigation in non-component contexts (e.g., Axios interceptors)
export const navigateTo = (path) => {
  window.location.hash = path; // Directly manipulate hash for HashRouter
};