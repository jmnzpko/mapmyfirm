import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import HomeScreen from './components/home/HomeScreen';
import WordPressScannerScreen from './components/scanner/WordPressScannerScreen';
import SitemapScreen from './components/sitemap/SitemapScreen';
import GBPMatchingScreen from './components/gbp/GBPMatchingScreen';
import ChecklistScreen from './components/checklist/ChecklistScreen';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/scanner" element={<WordPressScannerScreen />} />
            <Route path="/sitemap" element={<SitemapScreen />} />
            <Route path="/gbp-matching" element={<GBPMatchingScreen />} />
            <Route path="/checklist" element={<ChecklistScreen />} />
          </Routes>
        </div>
      </Router>
    </ProjectProvider>
  );
}

export default App;
