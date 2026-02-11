import { useState } from 'react';
import { SiteNode, PracticeAreaPage } from '../../types';
import { findNodeInList } from '../../services/treeBuilder';

interface PracticeAreaCellProps {
  areaData: PracticeAreaPage;
  areaName: string;
  nodes: SiteNode[];
  onUpdate: (pageId?: string, manualUrl?: string, comment?: string, optimized?: boolean) => void;
  onToggleOptimized: () => void;
}

export default function PracticeAreaCell({
  areaData,
  areaName,
  nodes,
  onUpdate,
  onToggleOptimized
}: PracticeAreaCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(areaData.page_id || '');
  const [manualUrl, setManualUrl] = useState(areaData.manual_url || '');
  const [useManualUrl, setUseManualUrl] = useState(!!areaData.manual_url);
  const [comment, setComment] = useState(areaData.comment || '');
  const [optimized, setOptimized] = useState(areaData.optimized || false);

  const matchedPage = areaData.page_id ? findNodeInList(nodes, areaData.page_id) : null;
  const displayUrl = areaData.manual_url || matchedPage?.url;

  const handleSave = () => {
    if (useManualUrl && manualUrl) {
      onUpdate(undefined, manualUrl, comment, optimized);
    } else if (selectedPageId) {
      onUpdate(selectedPageId, undefined, comment, optimized);
    } else {
      onUpdate(undefined, undefined, comment, optimized);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedPageId(areaData.page_id || '');
    setManualUrl(areaData.manual_url || '');
    setUseManualUrl(!!areaData.manual_url);
    setComment(areaData.comment || '');
    setOptimized(areaData.optimized || false);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <td className="py-3 px-2 border-r border-gray-200">
        <div className="min-w-[250px]">
          <div className="space-y-2">
            {/* Page Selector */}
            <div>
              <label className="flex items-center space-x-2 mb-1">
                <input
                  type="radio"
                  checked={!useManualUrl}
                  onChange={() => setUseManualUrl(false)}
                  className="text-primary-600"
                />
                <span className="text-xs font-medium text-gray-700">Select from site</span>
              </label>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                disabled={useManualUrl}
                className="input-field text-xs w-full"
              >
                <option value="">-- No page --</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.title} ({node.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Manual URL */}
            <div>
              <label className="flex items-center space-x-2 mb-1">
                <input
                  type="radio"
                  checked={useManualUrl}
                  onChange={() => setUseManualUrl(true)}
                  className="text-primary-600"
                />
                <span className="text-xs font-medium text-gray-700">Manual URL</span>
              </label>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                disabled={!useManualUrl}
                placeholder="https://example.com/page"
                className="input-field text-xs w-full"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="input-field text-xs w-full"
              />
            </div>

            {/* Optimized Checkbox */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={optimized}
                  onChange={(e) => setOptimized(e.target.checked)}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-xs font-medium text-gray-700">Content Optimized</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-1">
              <button
                onClick={handleSave}
                className="btn-primary text-xs py-1 px-2 flex-1"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary text-xs py-1 px-2 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </td>
    );
  }

  return (
    <td className="py-3 px-2 text-center border-r border-gray-200">
      {areaData.exists && displayUrl ? (
        <div className="flex flex-col items-center space-y-1">
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center justify-center px-3 py-2 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors group"
            title={`${areaName} page: ${displayUrl}`}
          >
            <span className="text-2xl leading-none mb-1">✓</span>
            <svg className="w-4 h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Optimized Toggle */}
          <label className="flex items-center space-x-1 cursor-pointer group/opt" title="Mark as optimized">
            <input
              type="checkbox"
              checked={areaData.optimized || false}
              onChange={onToggleOptimized}
              className="w-4 h-4 rounded text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <span className="text-xs text-gray-600 group-hover/opt:text-green-600">
              {areaData.optimized ? '✨ Optimized' : 'Optimize'}
            </span>
          </label>

          {areaData.comment && (
            <div className="relative group/tooltip">
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-help hover:bg-blue-200 transition-colors">
                💬
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50 w-48">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                  {areaData.comment}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-500 hover:text-primary-600"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-red-600 hover:text-red-700 text-2xl px-3 py-2 hover:bg-red-50 rounded transition-colors"
            title={`Click to add ${areaName} page`}
          >
            ✗
          </button>
          {areaData.comment && (
            <div className="relative group/tooltip">
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-help hover:bg-blue-200 transition-colors">
                💬
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50 w-48">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                  {areaData.comment}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </td>
  );
}
