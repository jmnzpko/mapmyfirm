import { ProjectState } from '../types';
import { supabase } from './supabase';

export interface SavedProject {
  id: string;
  projectName: string;
  lastModified: string;
  state: ProjectState;
}

/**
 * Save project to Supabase
 */
export async function saveProject(id: string, state: ProjectState): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('projects')
    .upsert({
      id,
      user_id: user.id,
      project_name: state.config.project_name || 'Untitled Project',
      last_modified: new Date().toISOString(),
      project_state: state
    });

  if (error) throw error;
}

/**
 * Load project from Supabase
 */
export async function loadProject(id: string): Promise<ProjectState | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('project_state')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data?.project_state as ProjectState ?? null;
}

/**
 * Get all saved projects
 */
export async function getAllProjects(): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_name, last_modified, project_state')
    .order('last_modified', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(row => ({
    id: row.id,
    projectName: row.project_name,
    lastModified: row.last_modified,
    state: row.project_state as ProjectState
  }));
}

/**
 * Delete project from Supabase
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Check if a project exists
 */
export async function projectExists(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false; // Not found
    throw error;
  }

  return !!data;
}

/**
 * Get current project ID from localStorage
 */
export function getCurrentProjectId(): string | null {
  return localStorage.getItem('currentProjectId');
}

/**
 * Set current project ID in localStorage
 */
export function setCurrentProjectId(id: string): void {
  localStorage.setItem('currentProjectId', id);
}

/**
 * Clear current project ID from localStorage
 */
export function clearCurrentProjectId(): void {
  localStorage.removeItem('currentProjectId');
}
