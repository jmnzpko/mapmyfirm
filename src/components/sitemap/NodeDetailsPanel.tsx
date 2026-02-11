import { useProject } from '../../context/ProjectContext';
import { findNodeInList } from '../../services/treeBuilder';

const AVAILABLE_TAGS = ['Location Hub', 'Practice Page', 'Ignore'];

export default function NodeDetailsPanel() {
  const { state, addManualTag, removeManualTag } = useProject();

  const selectedNode = state.selected_node_id
    ? findNodeInList(state.nodes, state.selected_node_id)
    : null;

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Select a node to view details</p>
        </div>
      </div>
    );
  }

  const handleToggleTag = (tag: string) => {
    if (selectedNode.manual_tags.includes(tag)) {
      removeManualTag(selectedNode.id, tag);
    } else {
      addManualTag(selectedNode.id, tag);
    }
  };

  // Count children
  const childrenCount = state.nodes.filter(n => n.parent_id === selectedNode.id).length;

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Page Details</h2>

      {/* Title */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500 block mb-1">Title</label>
        <p className="text-lg font-semibold text-gray-900">{selectedNode.title}</p>
      </div>

      {/* URL */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500 block mb-1">URL</label>
        <a
          href={selectedNode.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 text-sm break-all flex items-center"
        >
          {selectedNode.url}
          <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-500 block mb-1">Type</label>
          <span className="badge badge-blue">{selectedNode.type}</span>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500 block mb-1">Status</label>
          <span className={`badge ${
            selectedNode.status === 'publish' ? 'badge-green' :
            selectedNode.status === 'draft' ? 'badge-yellow' :
            'badge-gray'
          }`}>
            {selectedNode.status}
          </span>
        </div>
      </div>

      {/* Slug */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500 block mb-1">Slug</label>
        <p className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">
          {selectedNode.slug}
        </p>
      </div>

      {/* Children Count */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500 block mb-1">Child Pages</label>
        <p className="text-sm text-gray-700">{childrenCount}</p>
      </div>

      {/* Manual Tags */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500 block mb-2">Manual Tags</label>
        <div className="space-y-2">
          {AVAILABLE_TAGS.map(tag => {
            const isActive = selectedNode.manual_tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => handleToggleTag(tag)}
                className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tag}</span>
                  {isActive && (
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Tags help identify location hubs and practice pages for matching
        </p>
      </div>

      {/* Modified Date */}
      {selectedNode.date_modified && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500 block mb-1">Last Modified</label>
          <p className="text-sm text-gray-700">
            {new Date(selectedNode.date_modified).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
