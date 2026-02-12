import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { readProjectFile } from '../../services/exportImport';
import ProjectManager from './ProjectManager';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { importProject } = useProject();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const projectState = await readProjectFile(file);
      importProject(projectState);

      // Navigate to sitemap if project has nodes, otherwise to scanner
      if (projectState.nodes.length > 0) {
        navigate('/sitemap');
      } else {
        navigate('/scanner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MapMyFirm</h1>
          <p className="text-gray-600">
            SEO Planning Tool for Personal Injury Law Firms
          </p>
        </div>

        {/* Project Manager */}
        <ProjectManager />

        {/* Import from File Option */}
        <div className="mt-8 card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Import from File</h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload a previously exported JSON file
              </p>
            </div>
            <label className="btn-secondary cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                disabled={importing}
              />
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {importing ? 'Importing...' : 'Import from File'}
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <div className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Import Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Made with care by WEBRIS • All projects are securely saved to your account
        </p>
      </div>
    </div>
  );
}
