import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginScreen from './components/auth/LoginScreen';
import SignupScreen from './components/auth/SignupScreen';
import HomeScreen from './components/home/HomeScreen';
import WordPressScannerScreen from './components/scanner/WordPressScannerScreen';
import SitemapScreen from './components/sitemap/SitemapScreen';
import GBPMatchingScreen from './components/gbp/GBPMatchingScreen';
import ChecklistScreen from './components/checklist/ChecklistScreen';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />

          {/* Protected routes (layout wraps with ProjectProvider) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/scanner" element={<WordPressScannerScreen />} />
            <Route path="/sitemap" element={<SitemapScreen />} />
            <Route path="/gbp-matching" element={<GBPMatchingScreen />} />
            <Route path="/checklist" element={<ChecklistScreen />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
