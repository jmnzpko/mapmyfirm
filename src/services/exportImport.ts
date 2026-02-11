import { ProjectState, ProjectExport } from '../types';

const CURRENT_VERSION = '1.0.0';

/**
 * Export project state to JSON string
 */
export function exportProject(state: ProjectState): string {
  const exportData: ProjectExport = {
    version: CURRENT_VERSION,
    exported_at: new Date().toISOString(),
    project: state
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download project as JSON file
 */
export function downloadProject(state: ProjectState, filename?: string): void {
  const jsonString = exportProject(state);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create readable filename with project name and date/time
  let defaultFilename = 'mapmyfirm';

  // Add project name or site URL if available
  if (state.config.project_name) {
    const sanitizedName = state.config.project_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    defaultFilename = sanitizedName || defaultFilename;
  } else if (state.config.wordpress_site_url) {
    const sanitizedUrl = state.config.wordpress_site_url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    defaultFilename = sanitizedUrl || defaultFilename;
  }

  // Add readable date/time (YYYY-MM-DD_HH-MM-SS)
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${defaultFilename}_${dateStr}_${timeStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy project JSON to clipboard
 */
export async function copyProjectToClipboard(state: ProjectState): Promise<void> {
  const jsonString = exportProject(state);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(jsonString);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = jsonString;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Validate project structure
 */
export function validateProject(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Data is empty or null');
    return { valid: false, errors };
  }

  if (!data.version) {
    errors.push('Missing version field');
  }

  if (!data.project) {
    errors.push('Missing project field');
    return { valid: false, errors };
  }

  const project = data.project;

  // Validate required fields
  if (!project.config) {
    errors.push('Missing project.config');
  }

  if (!Array.isArray(project.nodes)) {
    errors.push('project.nodes must be an array');
  }

  if (!Array.isArray(project.gbp_locations)) {
    errors.push('project.gbp_locations must be an array');
  }

  if (!Array.isArray(project.checklist_items)) {
    errors.push('project.checklist_items must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Import project from JSON string
 */
export function importProject(jsonString: string): ProjectState {
  let data: any;

  try {
    data = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  // Validate structure
  const validation = validateProject(data);
  if (!validation.valid) {
    throw new Error(`Invalid project file:\n${validation.errors.join('\n')}`);
  }

  // Check version compatibility
  if (data.version !== CURRENT_VERSION) {
    console.warn(
      `Version mismatch: Expected ${CURRENT_VERSION}, got ${data.version}. Attempting to import anyway.`
    );
    // Future: Add migration logic here if needed
  }

  return data.project as ProjectState;
}

/**
 * Read project from uploaded file
 */
export function readProjectFile(file: File): Promise<ProjectState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const projectState = importProject(jsonString);
        resolve(projectState);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Get project summary from export data
 */
export function getProjectSummary(jsonString: string): {
  projectName: string;
  siteUrl: string;
  scanDate: string;
  exportDate: string;
  nodeCount: number;
  locationCount: number;
} | null {
  try {
    const data = JSON.parse(jsonString);

    if (!data.project) {
      return null;
    }

    return {
      projectName: data.project.config.project_name || 'Untitled Project',
      siteUrl: data.project.config.wordpress_site_url || 'Unknown',
      scanDate: data.project.config.scan_date || 'Unknown',
      exportDate: data.exported_at || 'Unknown',
      nodeCount: data.project.nodes?.length || 0,
      locationCount: data.project.gbp_locations?.length || 0
    };
  } catch (error) {
    return null;
  }
}

/**
 * Export checklist to CSV
 */
export function exportChecklistToCSV(checklist: any[]): void {
  const headers = [
    'Location',
    'Hub Exists',
    'Personal Injury',
    'Car Accident',
    'Motorcycle Accident',
    'Pedestrian Accident',
    'Slip and Fall',
    'Truck Accident',
    'Rideshare Accident',
    'Wrongful Death',
    'Completed',
    'Notes'
  ];

  const rows = checklist.map(item => [
    item.location,
    item.hub_exists ? 'Yes' : 'No',
    item.practice_areas?.personal_injury?.exists ? 'Yes' : 'No',
    item.practice_areas?.car_accident?.exists ? 'Yes' : 'No',
    item.practice_areas?.motorcycle_accident?.exists ? 'Yes' : 'No',
    item.practice_areas?.pedestrian_accident?.exists ? 'Yes' : 'No',
    item.practice_areas?.slip_and_fall?.exists ? 'Yes' : 'No',
    item.practice_areas?.truck_accident?.exists ? 'Yes' : 'No',
    item.practice_areas?.rideshare_accident?.exists ? 'Yes' : 'No',
    item.practice_areas?.wrongful_death?.exists ? 'Yes' : 'No',
    item.completed ? 'Yes' : 'No',
    item.notes || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `practice-area-checklist-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
