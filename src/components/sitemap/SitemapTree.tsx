import { TreeView, TreeItem } from '@mui/x-tree-view';
import { SiteNode } from '../../types';
import { useProject } from '../../context/ProjectContext';

interface SitemapTreeProps {
  tree: SiteNode[];
  expandedIds: string[];
  onNodeSelect: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  matchedNodeIds?: string[];
}

export default function SitemapTree({
  tree,
  expandedIds,
  onNodeSelect,
  onToggleExpand,
  matchedNodeIds = []
}: SitemapTreeProps) {
  const { state } = useProject();

  const renderTree = (nodes: SiteNode[]) => {
    return nodes.map(node => {
      const isMatched = matchedNodeIds.includes(node.id);
      const isSelected = state.selected_node_id === node.id;

      return (
        <TreeItem
          key={node.id}
          nodeId={node.id}
          label={
            <div
              className={`py-2 px-2 rounded flex items-center justify-between group ${
                isSelected ? 'bg-primary-100' : 'hover:bg-gray-100'
              } ${isMatched ? 'bg-yellow-50' : ''}`}
              onClick={() => onNodeSelect(node.id)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className={`font-medium truncate ${
                  isSelected ? 'text-primary-900' : 'text-gray-900'
                }`}>
                  {node.title}
                </span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                {/* Type Badge */}
                <span className="badge badge-gray text-xs">
                  {node.type}
                </span>

                {/* Status Badge */}
                {node.status !== 'publish' && (
                  <span className={`badge text-xs ${
                    node.status === 'draft' ? 'badge-yellow' :
                    node.status === 'private' ? 'badge-red' :
                    'badge-gray'
                  }`}>
                    {node.status}
                  </span>
                )}

                {/* Manual Tags */}
                {node.manual_tags.map(tag => (
                  <span
                    key={tag}
                    className="badge badge-blue text-xs"
                    title={tag}
                  >
                    {tag === 'Location Hub' ? '📍' :
                     tag === 'Practice Page' ? '⚖️' :
                     tag === 'Ignore' ? '🚫' : tag}
                  </span>
                ))}
              </div>
            </div>
          }
        >
          {node.children && node.children.length > 0 && renderTree(node.children)}
        </TreeItem>
      );
    });
  };

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p>No pages found</p>
        </div>
      </div>
    );
  }

  return (
    <TreeView
      expanded={expandedIds}
      selected={state.selected_node_id || undefined}
      onNodeToggle={(_, nodeIds) => {
        // Find which node was toggled
        const toggledId = nodeIds.find(id => !expandedIds.includes(id)) ||
                         expandedIds.find(id => !nodeIds.includes(id));
        if (toggledId) {
          onToggleExpand(toggledId);
        }
      }}
      className="text-sm"
      defaultCollapseIcon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      }
      defaultExpandIcon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      }
      defaultEndIcon={
        <div className="w-5" /> // Empty space for alignment
      }
    >
      {renderTree(tree)}
    </TreeView>
  );
}
