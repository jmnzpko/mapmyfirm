import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import {
  getContentTypes,
  scanWordPressSite,
  testWordPressAPI
} from '../../services/wordpressApi';
import { WordPressType } from '../../types';
import ContentTypeSelector from './ContentTypeSelector';

export default function WordPressScannerScreen() {
  const navigate = useNavigate();
  const { state, initProject, addNodes } = useProject();

  const [siteUrl, setSiteUrl] = useState(state.config.wordpress_site_url || '');
  const [projectName, setProjectName] = useState(state.config.project_name || '');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentTypes, setContentTypes] = useState<WordPressType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['pages']);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, type: '' });

  const handleDetectContentTypes = async () => {
    if (!siteUrl.trim()) {
      setError('Please enter a WordPress site URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test if API is accessible
      const isAccessible = await testWordPressAPI(siteUrl);
      if (!isAccessible) {
        throw new Error('WordPress REST API is not accessible. Please check the URL or enable CORS.');
      }

      // Fetch content types
      const types = await getContentTypes(siteUrl);
      setContentTypes(types);

      // Auto-select 'pages' if available
      const pageType = types.find(t => t.slug === 'page' || t.rest_base === 'pages');
      if (pageType) {
        setSelectedTypes([pageType.rest_base || pageType.slug]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to WordPress site');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (selectedTypes.length === 0) {
      setError('Please select at least one content type');
      return;
    }

    setScanning(true);
    setError(null);

    try {
      // Initialize project config
      initProject({
        project_name: projectName || `${siteUrl} Project`,
        wordpress_site_url: siteUrl,
        selected_content_types: selectedTypes,
        location_structure: null,
        scan_date: new Date().toISOString(),
        version: '1.0.0'
      });

      // Scan site
      const nodes = await scanWordPressSite(
        siteUrl,
        selectedTypes,
        (current, total, currentType) => {
          setScanProgress({ current, total, type: currentType });
        }
      );

      addNodes(nodes);

      // Navigate to sitemap
      navigate('/sitemap');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan WordPress site');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Scan WordPress Site</h1>
          <p className="text-gray-600 mt-2">
            Connect to your WordPress site and select content to import
          </p>
        </div>

        {/* Project Name */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name (Optional)
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Law Firm SEO Audit"
            className="input-field w-full"
          />
        </div>

        {/* Site URL Input */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WordPress Site URL *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="input-field flex-1"
              disabled={loading || scanning}
            />
            <button
              onClick={handleDetectContentTypes}
              disabled={loading || scanning || !siteUrl.trim()}
              className="btn-primary px-6"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter your WordPress site URL. The site must have the REST API enabled.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
                {error.includes('CORS') && (
                  <p className="text-sm mt-2">
                    💡 Tip: Install a CORS plugin on your WordPress site or use a browser CORS extension.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Types Selector */}
        {contentTypes.length > 0 && !scanning && (
          <div className="mb-6">
            <ContentTypeSelector
              contentTypes={contentTypes}
              selectedTypes={selectedTypes}
              onSelectionChange={setSelectedTypes}
            />
          </div>
        )}

        {/* Scan Button */}
        {contentTypes.length > 0 && !scanning && (
          <button
            onClick={handleScan}
            disabled={selectedTypes.length === 0}
            className="btn-primary w-full py-4 text-lg"
          >
            Start Scanning
          </button>
        )}

        {/* Scan Progress */}
        {scanning && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scanning...</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Fetching {scanProgress.type}</span>
                <span>{scanProgress.current} / {scanProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: scanProgress.total > 0
                      ? `${(scanProgress.current / scanProgress.total) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Please wait while we fetch your site content...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
