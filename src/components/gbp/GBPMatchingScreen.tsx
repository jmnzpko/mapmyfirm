import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { normalizeLocationString } from '../../services/locationMatcher';
import { generateChecklist } from '../../services/checklistGenerator';
import { v4 as uuidv4 } from 'uuid';

export default function GBPMatchingScreen() {
  const navigate = useNavigate();
  const { state, setGBPLocations, generateChecklist: saveChecklist, saveNow, isSaving, lastSaved } = useProject();

  const [locationInput, setLocationInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSave = async () => {
    const success = await saveNow();
    if (success) {
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }
  };

  const handleGenerateChecklist = () => {
    if (!locationInput.trim()) {
      alert('Please enter at least one GMB location');
      return;
    }

    setProcessing(true);

    // Parse locations (one per line)
    const locationStrings = locationInput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Create GBP locations without matching (all unmatched)
    const gbpLocations = locationStrings.map(locString => ({
      id: uuidv4(),
      location_string: normalizeLocationString(locString),
      matched_hub_id: null,
      confidence_score: 0,
      manual_override: false
    }));

    setGBPLocations(gbpLocations);

    // Generate checklist with all locations
    const checklist = generateChecklist(gbpLocations, state.nodes);
    saveChecklist(checklist);

    setProcessing(false);
    navigate('/checklist');
  };

  const exampleLocations = `San Francisco, CA
Los Angeles, CA
San Diego, CA
Sacramento, CA`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 flex items-center"
              title="All Projects"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Projects
            </button>
            <button
              onClick={() => navigate('/sitemap')}
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sitemap
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GMB Locations Setup</h1>
              <p className="text-gray-600 mt-2">
                Enter your Google Business Profile locations to track practice area pages
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {showSavedMsg && (
                <span className="text-sm text-green-600 font-medium animate-pulse">Saved!</span>
              )}
              {lastSaved && !showSavedMsg && (
                <span className="text-xs text-gray-400">
                  Last saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">How it works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter your GMB locations below (one per line)</li>
                <li>Click "Generate Checklist" to create your tracking sheet</li>
                <li>In the checklist, manually match pages for each location and practice area</li>
                <li>Track progress and identify missing pages</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Location Input Card */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">GMB Locations</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your Google Business Profile locations (one per line)
              </label>
              <textarea
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder={exampleLocations}
                rows={12}
                className="input-field w-full font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Format: City, State (e.g., "San Francisco, CA")
              </p>
            </div>

            {/* Location count */}
            {locationInput.trim() && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="font-medium text-gray-900">
                  {locationInput.split('\n').filter(l => l.trim().length > 0).length}
                </span>
                <span className="text-gray-600"> location(s) entered</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateChecklist}
              disabled={!locationInput.trim() || processing}
              className="btn-primary w-full py-4 text-lg"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Checklist...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Generate Checklist →
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tips Card */}
        <div className="card bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">Tips for Best Results</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Use consistent formatting: "City, State" or "City, ST"</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>One location per line</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Include state abbreviations for clarity</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>You can edit, add, or remove locations later by regenerating the checklist</span>
            </div>
          </div>
        </div>

        {/* Preview if locations exist */}
        {state.gbp_locations.length > 0 && (
          <div className="card mt-6 border-yellow-200 bg-yellow-50">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-yellow-900 mb-1">Existing Checklist Found</p>
                <p className="text-sm text-yellow-800 mb-3">
                  You already have {state.gbp_locations.length} location(s) in your checklist.
                  Generating a new checklist will replace the existing one.
                </p>
                <button
                  onClick={() => navigate('/checklist')}
                  className="text-sm text-yellow-900 font-medium hover:text-yellow-700 underline"
                >
                  View Existing Checklist →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
