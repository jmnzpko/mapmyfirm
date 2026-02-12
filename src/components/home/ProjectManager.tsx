import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { getAllProjects, deleteProject, loadProject, SavedProject, clearCurrentProjectId } from '../../services/supabaseStorage';
import { useAuth } from '../../context/AuthContext';

export default function ProjectManager() {
  const navigate = useNavigate();
  const { importProject, resetProject, setProjectId } = useProject();
  const { signOut } = useAuth();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load all projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = async (project: SavedProject) => {
    try {
      const state = await loadProject(project.id);
      if (state) {
        importProject(state);
        setProjectId(project.id);

        // Navigate to the most relevant screen based on saved data
        if (state.checklist_items.length > 0) {
          navigate('/checklist');
        } else if (state.gbp_locations.length > 0) {
          navigate('/gbp-matching');
        } else if (state.nodes.length > 0) {
          navigate('/sitemap');
        } else {
          navigate('/scanner');
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project. Please try again.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleNewProject = () => {
    resetProject();
    clearCurrentProjectId();
    navigate('/scanner');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
          <p className="text-sm text-gray-600 mt-1">
            {projects.length === 0 ? 'No saved projects yet' : `${projects.length} saved project${projects.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleNewProject} className="btn-primary">
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
          <button
            onClick={() => signOut()}
            className="btn-secondary text-sm"
            title="Sign out"
          >
            <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Create your first project to get started</p>
          <button onClick={handleNewProject} className="btn-primary">
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="card hover:shadow-lg transition-shadow cursor-pointer group">
              <div onClick={() => handleLoadProject(project)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {project.projectName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(project.lastModified)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(deleteConfirm === project.id ? null : project.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete project"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {project.state.nodes.length} pages
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {project.state.checklist_items.length} locations
                  </div>
                </div>

                {/* WordPress URL */}
                {project.state.config.wordpress_site_url && (
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    {project.state.config.wordpress_site_url}
                  </div>
                )}
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === project.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-700 mb-2">Delete this project?</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="btn-secondary text-xs py-1 px-2 flex-1 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(null);
                      }}
                      className="btn-secondary text-xs py-1 px-2 flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
