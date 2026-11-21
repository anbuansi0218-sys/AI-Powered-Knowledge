import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App.jsx';
import './styles.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6558d9', dark: '#5246c4', light: '#f0efff' },
    secondary: { main: '#4388bf' },
    background: { default: '#f7f8fa', paper: '#fff' },
    text: { primary: '#292837', secondary: '#858493' },
    divider: '#ececf1'
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    button: { fontWeight: 600, textTransform: 'none' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, minHeight: 38, boxShadow: 'none' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: 'none' }
      }
    }
  }
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
