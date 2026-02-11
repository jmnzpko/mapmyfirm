import { WordPressType } from '../../types';

interface ContentTypeSelectorProps {
  contentTypes: WordPressType[];
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
}

export default function ContentTypeSelector({
  contentTypes,
  selectedTypes,
  onSelectionChange
}: ContentTypeSelectorProps) {
  const handleToggle = (typeSlug: string) => {
    if (selectedTypes.includes(typeSlug)) {
      onSelectionChange(selectedTypes.filter(t => t !== typeSlug));
    } else {
      onSelectionChange([...selectedTypes, typeSlug]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(contentTypes.map(t => t.rest_base || t.slug));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Content Types</h3>
        <div className="space-x-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={handleDeselectAll}
            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {contentTypes.map(type => {
          const typeSlug = type.rest_base || type.slug;
          const isSelected = selectedTypes.includes(typeSlug);

          return (
            <label
              key={typeSlug}
              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(typeSlug)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{type.name}</span>
                  <span className="badge badge-gray">{typeSlug}</span>
                </div>
                {type.description && (
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {selectedTypes.length === 0 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Please select at least one content type to scan
        </p>
      )}
    </div>
  );
}
