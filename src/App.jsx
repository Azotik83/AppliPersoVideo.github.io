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

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

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
          <Route path="/statistics" element={<Statistics projects={projects} />} />
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
