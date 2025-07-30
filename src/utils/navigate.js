// utils/navigate.js
import { createBrowserHistory } from 'history';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';

const history = createBrowserHistory();

export const navigate = (to) => {
  history.push(to);
};

// Wrap your app with HistoryRouter in App.jsx
export { HistoryRouter, history };