import { ProjectState } from '../types';

const DB_NAME = 'MapMyFirmDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('lastModified', 'lastModified', { unique: false });
        objectStore.createIndex('projectName', 'projectName', { unique: false });
      }
    };
  });
}

export interface SavedProject {
  id: string;
  projectName: string;
  lastModified: string;
  state: ProjectState;
}

/**
 * Save project to IndexedDB
 */
export async function saveProject(id: string, state: ProjectState): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const savedProject: SavedProject = {
      id,
      projectName: state.config.project_name || 'Untitled Project',
      lastModified: new Date().toISOString(),
      state
    };

    const request = store.put(savedProject);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load project from IndexedDB
 */
export async function loadProject(id: string): Promise<ProjectState | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const savedProject = request.result as SavedProject | undefined;
      resolve(savedProject ? savedProject.state : null);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all saved projects
 */
export async function getAllProjects(): Promise<SavedProject[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const projects = request.result as SavedProject[];
      // Sort by last modified (newest first)
      projects.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      resolve(projects);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete project from IndexedDB
 */
export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Check if a project exists
 */
export async function projectExists(id: string): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
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
