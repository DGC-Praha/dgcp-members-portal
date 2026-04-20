import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import AccountPage from './pages/AccountPage';
import TournamentsPage from './pages/TournamentsPage';
import MemberDetailPage from './pages/MemberDetailPage';
import AdminMembersPage from './pages/AdminMembersPage';
import AdminMemberDetailPage from './pages/AdminMemberDetailPage';
import WatchedRegistrationsPage from './pages/WatchedRegistrationsPage';
import './i18n';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    background: { default: '#f5f7fa' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/turnaje" element={<TournamentsPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/clenove/:id" element={<MemberDetailPage />} />
              <Route path="/hlidane-registrace" element={<WatchedRegistrationsPage />} />
              <Route path="/admin/members" element={<AdminMembersPage />} />
              <Route path="/admin/members/:iDiscGolfId" element={<AdminMemberDetailPage />} />
              <Route path="/ucet" element={<AccountPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
