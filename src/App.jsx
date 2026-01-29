import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import MobileNav from './components/Layout/MobileNav';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Calendar from './pages/Calendar';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import { getAllProjects, addProject, updateProject, deleteProject } from './utils/db';
import { shouldFetchStats, autoFetchStats, getTimeSinceLastFetch, setLastFetchTime } from './utils/autoUpdate';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoUpdateStatus, setAutoUpdateStatus] = useState(null); // null | 'checking' | 'updating' | 'done' | 'error'
  const [autoUpdateProgress, setAutoUpdateProgress] = useState({ current: 0, total: 0 });
  const [autoUpdateMessage, setAutoUpdateMessage] = useState('');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-fetch stats once projects are loaded
  useEffect(() => {
    if (!loading && projects.length > 0) {
      checkAutoUpdate();
    }
  }, [loading, projects.length]);

  const checkAutoUpdate = async () => {
    if (!shouldFetchStats()) {
      return; // Not time yet
    }

    setAutoUpdateStatus('checking');
    setAutoUpdateMessage('Checking for stats update...');

    const result = await autoFetchStats(
      projects,
      handleUpdateProject,
      (current, total) => {
        setAutoUpdateStatus('updating');
        setAutoUpdateProgress({ current, total });
        setAutoUpdateMessage(`Updating stats... (${current}/${total})`);
      }
    );

    if (result.success) {
      if (result.updated > 0) {
        setAutoUpdateStatus('done');
        setAutoUpdateMessage(`✓ Updated stats for ${result.updated} video${result.updated > 1 ? 's' : ''}`);
        // Refresh projects to show new stats
        loadProjects();
      } else {
        setAutoUpdateStatus('done');
        setAutoUpdateMessage('✓ Stats up to date');
      }
    } else {
      setAutoUpdateStatus('error');
      setAutoUpdateMessage(result.error || 'Failed to update stats');
    }

    // Hide message after 5 seconds
    setTimeout(() => {
      setAutoUpdateStatus(null);
      setAutoUpdateMessage('');
    }, 5000);
  };

  const loadProjects = async () => {
    try {
      const data = await getAllProjects();
      setProjects(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (projectData) => {
    try {
      const newProject = await addProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  };

  const handleUpdateProject = async (id, updates) => {
    try {
      // If status is being changed to 'published', set publishedAt
      if (updates.status === 'published') {
        const project = projects.find(p => p.id === id);
        if (project && project.status !== 'published') {
          updates.publishedAt = new Date().toISOString();
        }
      }

      const updated = await updateProject(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  };

  const refreshProjects = () => {
    loadProjects();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <MobileNav />

      {/* Auto-update notification */}
      {autoUpdateStatus && (
        <div style={{
          position: 'fixed',
          top: 'var(--space-md)',
          right: 'var(--space-md)',
          zIndex: 9999,
          padding: 'var(--space-md) var(--space-lg)',
          background: autoUpdateStatus === 'error'
            ? 'rgba(239, 68, 68, 0.95)'
            : autoUpdateStatus === 'done'
              ? 'rgba(34, 197, 94, 0.95)'
              : 'rgba(249, 115, 22, 0.95)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {autoUpdateStatus === 'updating' && (
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid white',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          )}
          {autoUpdateMessage}
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                projects={projects}
                loading={loading}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
              />
            }
          />
          <Route
            path="/project/:id"
            element={
              <ProjectDetail
                onUpdate={handleUpdateProject}
                onDelete={handleDeleteProject}
              />
            }
          />
          <Route path="/calendar" element={<Calendar projects={projects} />} />
          <Route path="/statistics" element={<Statistics projects={projects} onUpdateProject={handleUpdateProject} />} />
          <Route
            path="/settings"
            element={<Settings onRefresh={refreshProjects} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
