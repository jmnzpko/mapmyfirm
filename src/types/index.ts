// Core data types for MapMyFirm

export interface SiteNode {
  id: string;
  title: string;
  slug: string;
  url: string;
  parent_id: string | null;
  type: string; // 'page', 'post', or CPT name
  status: 'publish' | 'draft' | 'private';
  manual_tags: string[]; // User-applied tags: 'Location Hub', 'Practice Page', 'Ignore'
  date_modified?: string;
  content_excerpt?: string;
  children?: SiteNode[]; // For tree structure
}

export interface GBPLocation {
  id: string;
  location_string: string; // e.g., "San Francisco, CA"
  matched_hub_id: string | null;
  confidence_score?: number; // 0-100
  manual_override?: boolean; // True if user manually set the match
}

export interface PracticeAreaPage {
  exists: boolean;
  page_id?: string;
  manual_url?: string; // Manually entered URL if no page found
  manual_override?: boolean; // True if user manually set this
  comment?: string; // User comment/note for this specific cell
  optimized?: boolean; // True if content has been updated/optimized
}

export interface PracticeAreaPages {
  personal_injury: PracticeAreaPage;
  car_accident: PracticeAreaPage;
  motorcycle_accident: PracticeAreaPage;
  pedestrian_accident: PracticeAreaPage;
  slip_and_fall: PracticeAreaPage;
  truck_accident: PracticeAreaPage;
  rideshare_accident: PracticeAreaPage;
  wrongful_death: PracticeAreaPage;
}

export interface ChecklistItem {
  id: string;
  location: string; // Location name
  hub_id: string | null;
  hub_exists: boolean;
  practice_areas: PracticeAreaPages;
  notes: string;
  completed: boolean;
  last_updated: string;
}

export interface LocationStructure {
  hub_type: 'page' | 'cpt'; // What represents a location hub
  hub_cpt_name?: string; // If hub_type is 'cpt', the CPT name
  parent_page_id?: string; // Optional parent container page
}

export interface ProjectConfig {
  project_name: string;
  wordpress_site_url: string;
  selected_content_types: string[]; // e.g., ['page', 'location', 'practice-area']
  location_structure: LocationStructure | null;
  scan_date: string;
  version: string; // For export/import versioning
}

export interface ProjectState {
  config: ProjectConfig;
  nodes: SiteNode[];
  gbp_locations: GBPLocation[];
  checklist_items: ChecklistItem[];
  tree_expanded_ids: string[]; // For preserving tree state
  selected_node_id: string | null; // Currently selected node in tree
}

// WordPress REST API response types
export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: { rendered: string };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: 'publish' | 'draft' | 'private' | 'future' | 'pending';
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  parent: number;
  [key: string]: unknown;
}

export interface WordPressType {
  description: string;
  hierarchical: boolean;
  name: string;
  slug: string;
  rest_base: string;
  [key: string]: unknown;
}

// Action types for ProjectContext reducer
export type ProjectAction =
  | { type: 'INIT_PROJECT'; payload: ProjectConfig }
  | { type: 'ADD_NODES'; payload: SiteNode[] }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<SiteNode> } }
  | { type: 'ADD_MANUAL_TAG'; payload: { nodeId: string; tag: string } }
  | { type: 'REMOVE_MANUAL_TAG'; payload: { nodeId: string; tag: string } }
  | { type: 'SET_GBP_LOCATIONS'; payload: GBPLocation[] }
  | { type: 'UPDATE_GBP_LOCATION'; payload: { id: string; updates: Partial<GBPLocation> } }
  | { type: 'GENERATE_CHECKLIST'; payload: ChecklistItem[] }
  | { type: 'UPDATE_CHECKLIST_ITEM'; payload: { id: string; updates: Partial<ChecklistItem> } }
  | { type: 'UPDATE_PRACTICE_AREA'; payload: { checklistItemId: string; practiceArea: string; pageId?: string; manualUrl?: string; comment?: string; optimized?: boolean } }
  | { type: 'TOGGLE_OPTIMIZED'; payload: { checklistItemId: string; practiceArea: string } }
  | { type: 'ADD_CHECKLIST_ITEM'; payload: ChecklistItem }
  | { type: 'IMPORT_PROJECT'; payload: ProjectState }
  | { type: 'RESET_PROJECT' }
  | { type: 'SET_TREE_EXPANDED'; payload: string[] }
  | { type: 'SET_SELECTED_NODE'; payload: string | null }
  | { type: 'UPDATE_LOCATION_STRUCTURE'; payload: LocationStructure };

// Export format for JSON persistence
export interface ProjectExport {
  version: string;
  exported_at: string;
  project: ProjectState;
}
