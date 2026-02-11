import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { buildTree, filterTree } from '../../services/treeBuilder';
import { downloadProject } from '../../services/exportImport';
import SitemapTree from './SitemapTree';
import NodeDetailsPanel from './NodeDetailsPanel';
import SearchFilter from './SearchFilter';

export default function SitemapScreen() {
  const navigate = useNavigate();
  const { state, setTreeExpanded, setSelectedNode, saveNow, isSaving, lastSaved } = useProject();
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSave = async () => {
    const success = await saveNow();
    if (success) {
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [tree, setTree] = useState(buildTree(state.nodes));
  const [matchedNodeIds, setMatchedNodeIds] = useState<string[]>([]);

  // Update tree when nodes change
  useEffect(() => {
    setTree(buildTree(state.nodes));
  }, [state.nodes]);

  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const { matchedNodeIds: matched, expandedIds } = filterTree(state.nodes, searchTerm);
      setMatchedNodeIds(matched);
      setTreeExpanded(expandedIds);
    } else {
      setMatchedNodeIds([]);
    }
  }, [searchTerm, state.nodes]);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleToggleExpand = (nodeId: string) => {
    if (state.tree_expanded_ids.includes(nodeId)) {
      setTreeExpanded(state.tree_expanded_ids.filter(id => id !== nodeId));
    } else {
      setTreeExpanded([...state.tree_expanded_ids, nodeId]);
    }
  };

  const handleExport = () => {
    downloadProject(state);
  };

  const handleGoToGBPMatching = () => {
    navigate('/gbp-matching');
  };

  const handleGoToChecklist = () => {
    navigate('/checklist');
  };

  if (state.nodes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Site Data</h2>
          <p className="text-gray-600 mb-4">Please scan a WordPress site first</p>
          <button onClick={() => navigate('/scanner')} className="btn-primary">
            Go to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900"
              title="Back to Home"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {state.config.project_name || 'Site Map'}
              </h1>
              <p className="text-sm text-gray-500">
                {state.config.wordpress_site_url} • {state.nodes.length} pages
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
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
            <button
              onClick={handleGoToGBPMatching}
              className="btn-secondary"
            >
              GMB Locations
            </button>
            <button
              onClick={handleGoToChecklist}
              className="btn-secondary"
            >
              Checklist
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Panel - Sitemap Tree */}
        <div className="col-span-5 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Site Structure</h2>
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              resultCount={matchedNodeIds.length}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SitemapTree
              tree={tree}
              expandedIds={state.tree_expanded_ids}
              onNodeSelect={handleNodeSelect}
              onToggleExpand={handleToggleExpand}
              matchedNodeIds={matchedNodeIds}
            />
          </div>
        </div>

        {/* Middle Panel - Node Details */}
        <div className="col-span-4 border-r border-gray-200 bg-white overflow-hidden">
          <NodeDetailsPanel />
        </div>

        {/* Right Panel - Quick Info */}
        <div className="col-span-3 bg-gray-50 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>

          <div className="space-y-4">
            {/* Total Pages */}
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Total Pages</div>
              <div className="text-2xl font-bold text-gray-900">{state.nodes.length}</div>
            </div>

            {/* Content Types */}
            <div className="card">
              <div className="text-sm text-gray-500 mb-2">Content Types</div>
              <div className="space-y-1">
                {Array.from(new Set(state.nodes.map(n => n.type))).map(type => {
                  const count = state.nodes.filter(n => n.type === type).length;
                  return (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-700">{type}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location Hubs */}
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Location Hubs</div>
              <div className="text-2xl font-bold text-gray-900">
                {state.nodes.filter(n => n.manual_tags.includes('Location Hub')).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tagged as location hubs
              </p>
            </div>

            {/* GBP Locations */}
            {state.gbp_locations.length > 0 && (
              <div className="card">
                <div className="text-sm text-gray-500 mb-1">GBP Locations</div>
                <div className="text-2xl font-bold text-gray-900">
                  {state.gbp_locations.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {state.gbp_locations.filter(l => l.matched_hub_id).length} matched
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="card bg-primary-50 border-primary-200">
              <div className="text-sm font-medium text-primary-900 mb-2">Next Steps</div>
              <ol className="text-xs text-primary-800 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Click "GMB Locations" to enter your locations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Generate checklist for all locations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Manually match pages in the checklist</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
