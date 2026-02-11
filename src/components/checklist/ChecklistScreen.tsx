import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import {
  calculateChecklistStats,
  PRACTICE_AREA_NAMES,
  PracticeAreaType
} from '../../services/checklistGenerator';
import { exportChecklistToCSV, downloadProject } from '../../services/exportImport';
import PracticeAreaCell from './PracticeAreaCell';
import { v4 as uuidv4 } from 'uuid';

const PRACTICE_AREAS: PracticeAreaType[] = [
  'personal_injury',
  'car_accident',
  'motorcycle_accident',
  'pedestrian_accident',
  'slip_and_fall',
  'truck_accident',
  'rideshare_accident',
  'wrongful_death'
];

export default function ChecklistScreen() {
  const navigate = useNavigate();
  const { state, updateChecklistItem, updatePracticeAreaPage, addChecklistItem, toggleOptimized, saveNow, isSaving, lastSaved } = useProject();

  const [filter, setFilter] = useState<'all' | 'incomplete' | 'complete'>('all');
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSave = async () => {
    const success = await saveNow();
    if (success) {
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }
  };

  if (state.checklist_items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Checklist Generated</h2>
          <p className="text-gray-600 mb-4">Please match GBP locations first</p>
          <button onClick={() => navigate('/gbp-matching')} className="btn-primary">
            Go to GBP Matching
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateChecklistStats(state.checklist_items);

  const filteredItems = state.checklist_items.filter(item => {
    if (filter === 'complete') return item.completed;
    if (filter === 'incomplete') return !item.completed;
    return true;
  });

  const handleToggleComplete = (itemId: string, completed: boolean) => {
    updateChecklistItem(itemId, { completed });
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    updateChecklistItem(itemId, { notes });
  };

  const handleExportCSV = () => {
    exportChecklistToCSV(state.checklist_items);
  };

  const handleExportJSON = () => {
    downloadProject(state);
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      alert('Please enter a location name');
      return;
    }

    const newItem = {
      id: uuidv4(),
      location: newLocationName,
      hub_id: null,
      hub_exists: false,
      practice_areas: {
        personal_injury: { exists: false },
        car_accident: { exists: false },
        motorcycle_accident: { exists: false },
        pedestrian_accident: { exists: false },
        slip_and_fall: { exists: false },
        truck_accident: { exists: false },
        rideshare_accident: { exists: false },
        wrongful_death: { exists: false }
      },
      notes: '',
      completed: false,
      last_updated: new Date().toISOString()
    };

    addChecklistItem(newItem);
    setNewLocationName('');
    setIsAddingLocation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full mx-auto px-4">
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
              <h1 className="text-3xl font-bold text-gray-900">Practice Area Checklist</h1>
              <p className="text-gray-600 mt-2">
                Click on any ✗ to match pages manually • Green ✓ links to the page
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
              <button onClick={handleExportCSV} className="btn-secondary">
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button onClick={handleExportJSON} className="btn-secondary">
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Export Project
              </button>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Overall Progress</div>
            <div className="text-3xl font-bold text-gray-900">{stats.overallPercentage}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalExists} of {stats.totalRequired} pages
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.overallPercentage}%` }}
              />
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-500 mb-1">GMB Locations</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              Total locations
            </div>
          </div>

          {/* Show top 3 practice area stats */}
          {PRACTICE_AREAS.slice(0, 3).map(area => (
            <div key={area} className="card">
              <div className="text-sm text-gray-500 mb-1">{PRACTICE_AREA_NAMES[area]}</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.practiceAreaCounts[area]}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of {stats.total} locations
              </div>
            </div>
          ))}
        </div>

        {/* Add Location */}
        <div className="card mb-6">
          {!isAddingLocation ? (
            <button
              onClick={() => setIsAddingLocation(true)}
              className="btn-primary w-full"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Location
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name
                </label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="input-field w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddLocation();
                    } else if (e.key === 'Escape') {
                      setIsAddingLocation(false);
                      setNewLocationName('');
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <button onClick={handleAddLocation} className="btn-primary flex-1">
                  Add Location
                </button>
                <button
                  onClick={() => {
                    setIsAddingLocation(false);
                    setNewLocationName('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({state.checklist_items.length})
            </button>
            <button
              onClick={() => setFilter('incomplete')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === 'incomplete'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Incomplete ({state.checklist_items.filter(i => !i.completed).length})
            </button>
            <button
              onClick={() => setFilter('complete')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === 'complete'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Complete ({stats.completed})
            </button>
          </div>
        </div>

        {/* Checklist Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="sticky left-0 bg-gray-50 z-10 text-left py-3 px-3 text-xs font-semibold text-gray-700 border-r border-gray-200">
                    GMB Location
                  </th>
                  {PRACTICE_AREAS.map(area => (
                    <th
                      key={area}
                      className="text-center py-3 px-2 text-xs font-semibold text-gray-700 border-r border-gray-200"
                      style={{ minWidth: '90px' }}
                    >
                      <div className="flex flex-col items-center">
                        <span>{PRACTICE_AREA_NAMES[area].split(' ')[0]}</span>
                        <span>{PRACTICE_AREA_NAMES[area].split(' ').slice(1).join(' ')}</span>
                      </div>
                    </th>
                  ))}
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700 border-r border-gray-200" style={{ minWidth: '200px' }}>
                    Notes
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700">
                    Done
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  // Count how many practice areas exist
                  const existCount = PRACTICE_AREAS.filter(area =>
                    item.practice_areas[area].exists
                  ).length;

                  return (
                    <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                      {/* Location - Sticky */}
                      <td className="sticky left-0 bg-white hover:bg-gray-50 py-3 px-3 border-r border-gray-200 z-10">
                        <div className="font-medium text-gray-900">{item.location}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {existCount} of {PRACTICE_AREAS.length} pages
                        </div>
                      </td>

                      {/* Practice Areas - Editable Cells */}
                      {PRACTICE_AREAS.map(area => {
                        const areaData = item.practice_areas[area];
                        return (
                          <PracticeAreaCell
                            key={area}
                            areaData={areaData}
                            areaName={PRACTICE_AREA_NAMES[area]}
                            nodes={state.nodes}
                            onUpdate={(pageId, manualUrl, comment, optimized) => {
                              updatePracticeAreaPage(item.id, area, pageId, manualUrl, comment, optimized);
                            }}
                            onToggleOptimized={() => {
                              toggleOptimized(item.id, area);
                            }}
                          />
                        );
                      })}

                      {/* Notes */}
                      <td className="py-3 px-3 border-r border-gray-200">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                          placeholder="Add notes..."
                          className="input-field text-xs w-full"
                        />
                      </td>

                      {/* Complete Checkbox */}
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => handleToggleComplete(item.id, e.target.checked)}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredItems.length}</span> of{' '}
              <span className="font-medium">{state.checklist_items.length}</span> locations •{' '}
              <span className="text-primary-600">Click any ✗ to add a page</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">How to Use</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Click on any red ✗</strong> to add or edit a page for that practice area</p>
            <p>• <strong>Select from dropdown</strong> to choose from pages scanned from your WordPress site</p>
            <p>• <strong>Use manual URL</strong> if the page wasn't scanned or doesn't exist yet</p>
            <p>• <strong>Green ✓ with link icon</strong> means the page is matched - click to view it</p>
            <p>• Pages are auto-detected based on keywords, but you can override any match manually</p>
          </div>
        </div>
      </div>
    </div>
  );
}
