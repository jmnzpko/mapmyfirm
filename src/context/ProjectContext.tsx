import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import {
  ProjectState,
  ProjectAction,
  ProjectConfig,
  SiteNode,
  GBPLocation,
  ChecklistItem,
  LocationStructure
} from '../types';
import { saveProject, getCurrentProjectId, setCurrentProjectId } from '../services/indexedDB';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState: ProjectState = {
  config: {
    project_name: '',
    wordpress_site_url: '',
    selected_content_types: [],
    location_structure: null,
    scan_date: '',
    version: '1.0.0'
  },
  nodes: [],
  gbp_locations: [],
  checklist_items: [],
  tree_expanded_ids: [],
  selected_node_id: null
};

// Reducer
function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'INIT_PROJECT':
      return {
        ...initialState,
        config: action.payload
      };

    case 'ADD_NODES':
      return {
        ...state,
        nodes: action.payload
      };

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.id
            ? { ...node, ...action.payload.updates }
            : node
        )
      };

    case 'ADD_MANUAL_TAG':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.nodeId
            ? {
                ...node,
                manual_tags: [...new Set([...node.manual_tags, action.payload.tag])]
              }
            : node
        )
      };

    case 'REMOVE_MANUAL_TAG':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.nodeId
            ? {
                ...node,
                manual_tags: node.manual_tags.filter(tag => tag !== action.payload.tag)
              }
            : node
        )
      };

    case 'SET_GBP_LOCATIONS':
      return {
        ...state,
        gbp_locations: action.payload
      };

    case 'UPDATE_GBP_LOCATION':
      return {
        ...state,
        gbp_locations: state.gbp_locations.map(loc =>
          loc.id === action.payload.id
            ? { ...loc, ...action.payload.updates }
            : loc
        )
      };

    case 'GENERATE_CHECKLIST':
      return {
        ...state,
        checklist_items: action.payload
      };

    case 'UPDATE_CHECKLIST_ITEM':
      return {
        ...state,
        checklist_items: state.checklist_items.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates, last_updated: new Date().toISOString() }
            : item
        )
      };

    case 'UPDATE_PRACTICE_AREA':
      return {
        ...state,
        checklist_items: state.checklist_items.map(item => {
          if (item.id === action.payload.checklistItemId) {
            const updatedPracticeAreas = { ...item.practice_areas };
            const practiceArea = action.payload.practiceArea as keyof typeof updatedPracticeAreas;

            updatedPracticeAreas[practiceArea] = {
              exists: !!(action.payload.pageId || action.payload.manualUrl),
              page_id: action.payload.pageId,
              manual_url: action.payload.manualUrl,
              manual_override: true,
              comment: action.payload.comment,
              optimized: action.payload.optimized
            };

            return {
              ...item,
              practice_areas: updatedPracticeAreas,
              last_updated: new Date().toISOString()
            };
          }
          return item;
        })
      };

    case 'TOGGLE_OPTIMIZED':
      return {
        ...state,
        checklist_items: state.checklist_items.map(item => {
          if (item.id === action.payload.checklistItemId) {
            const updatedPracticeAreas = { ...item.practice_areas };
            const practiceArea = action.payload.practiceArea as keyof typeof updatedPracticeAreas;

            updatedPracticeAreas[practiceArea] = {
              ...updatedPracticeAreas[practiceArea],
              optimized: !updatedPracticeAreas[practiceArea].optimized
            };

            return {
              ...item,
              practice_areas: updatedPracticeAreas,
              last_updated: new Date().toISOString()
            };
          }
          return item;
        })
      };

    case 'ADD_CHECKLIST_ITEM':
      return {
        ...state,
        checklist_items: [...state.checklist_items, action.payload]
      };

    case 'IMPORT_PROJECT':
      return action.payload;

    case 'RESET_PROJECT':
      return initialState;

    case 'SET_TREE_EXPANDED':
      return {
        ...state,
        tree_expanded_ids: action.payload
      };

    case 'SET_SELECTED_NODE':
      return {
        ...state,
        selected_node_id: action.payload
      };

    case 'UPDATE_LOCATION_STRUCTURE':
      return {
        ...state,
        config: {
          ...state.config,
          location_structure: action.payload
        }
      };

    default:
      return state;
  }
}

// Context type
interface ProjectContextValue {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  currentProjectId: string | null;
  setProjectId: (id: string) => void;
  saveNow: () => Promise<boolean>;
  lastSaved: string | null;
  isSaving: boolean;

  // Helper functions
  initProject: (config: ProjectConfig) => void;
  addNodes: (nodes: SiteNode[]) => void;
  updateNode: (id: string, updates: Partial<SiteNode>) => void;
  addManualTag: (nodeId: string, tag: string) => void;
  removeManualTag: (nodeId: string, tag: string) => void;
  setGBPLocations: (locations: GBPLocation[]) => void;
  updateGBPLocation: (id: string, updates: Partial<GBPLocation>) => void;
  generateChecklist: (items: ChecklistItem[]) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  updatePracticeAreaPage: (checklistItemId: string, practiceArea: string, pageId?: string, manualUrl?: string, comment?: string, optimized?: boolean) => void;
  toggleOptimized: (checklistItemId: string, practiceArea: string) => void;
  addChecklistItem: (item: ChecklistItem) => void;
  importProject: (state: ProjectState) => void;
  resetProject: () => void;
  setTreeExpanded: (ids: string[]) => void;
  setSelectedNode: (id: string | null) => void;
  updateLocationStructure: (structure: LocationStructure) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

// Provider
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(() => getCurrentProjectId());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to ensure we have a project ID
  const ensureProjectId = useCallback((): string => {
    let projectId = currentProjectId;
    if (!projectId) {
      projectId = uuidv4();
      setCurrentProjectIdState(projectId);
      setCurrentProjectId(projectId); // Save to localStorage
    }
    return projectId;
  }, [currentProjectId]);

  // Auto-save to IndexedDB whenever state changes
  useEffect(() => {
    // Don't save if project is empty (initial state)
    if (!state.config.project_name && state.nodes.length === 0) {
      return;
    }

    const projectId = ensureProjectId();

    // Debounce save by 1 second
    const timeoutId = setTimeout(() => {
      saveProject(projectId, state).then(() => {
        setLastSaved(new Date().toISOString());
      }).catch(err => {
        console.error('Failed to auto-save project:', err);
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state, ensureProjectId]);

  // Manual save (immediate, no debounce)
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!state.config.project_name && state.nodes.length === 0) {
      return false;
    }
    const projectId = ensureProjectId();
    setIsSaving(true);
    try {
      await saveProject(projectId, state);
      setLastSaved(new Date().toISOString());
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Failed to save project:', err);
      setIsSaving(false);
      return false;
    }
  }, [state, ensureProjectId]);

  const setProjectId = (id: string) => {
    setCurrentProjectIdState(id);
    setCurrentProjectId(id); // Save to localStorage
  };

  const value: ProjectContextValue = {
    state,
    dispatch,
    currentProjectId,
    setProjectId,
    saveNow,
    lastSaved,
    isSaving,

    // Helper functions
    initProject: (config: ProjectConfig) =>
      dispatch({ type: 'INIT_PROJECT', payload: config }),

    addNodes: (nodes: SiteNode[]) =>
      dispatch({ type: 'ADD_NODES', payload: nodes }),

    updateNode: (id: string, updates: Partial<SiteNode>) =>
      dispatch({ type: 'UPDATE_NODE', payload: { id, updates } }),

    addManualTag: (nodeId: string, tag: string) =>
      dispatch({ type: 'ADD_MANUAL_TAG', payload: { nodeId, tag } }),

    removeManualTag: (nodeId: string, tag: string) =>
      dispatch({ type: 'REMOVE_MANUAL_TAG', payload: { nodeId, tag } }),

    setGBPLocations: (locations: GBPLocation[]) =>
      dispatch({ type: 'SET_GBP_LOCATIONS', payload: locations }),

    updateGBPLocation: (id: string, updates: Partial<GBPLocation>) =>
      dispatch({ type: 'UPDATE_GBP_LOCATION', payload: { id, updates } }),

    generateChecklist: (items: ChecklistItem[]) =>
      dispatch({ type: 'GENERATE_CHECKLIST', payload: items }),

    updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) =>
      dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: { id, updates } }),

    updatePracticeAreaPage: (checklistItemId: string, practiceArea: string, pageId?: string, manualUrl?: string, comment?: string, optimized?: boolean) =>
      dispatch({ type: 'UPDATE_PRACTICE_AREA', payload: { checklistItemId, practiceArea, pageId, manualUrl, comment, optimized } }),

    toggleOptimized: (checklistItemId: string, practiceArea: string) =>
      dispatch({ type: 'TOGGLE_OPTIMIZED', payload: { checklistItemId, practiceArea } }),

    addChecklistItem: (item: ChecklistItem) =>
      dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: item }),

    importProject: (projectState: ProjectState) =>
      dispatch({ type: 'IMPORT_PROJECT', payload: projectState }),

    resetProject: () =>
      dispatch({ type: 'RESET_PROJECT' }),

    setTreeExpanded: (ids: string[]) =>
      dispatch({ type: 'SET_TREE_EXPANDED', payload: ids }),

    setSelectedNode: (id: string | null) =>
      dispatch({ type: 'SET_SELECTED_NODE', payload: id }),

    updateLocationStructure: (structure: LocationStructure) =>
      dispatch({ type: 'UPDATE_LOCATION_STRUCTURE', payload: structure })
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook to use context
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
