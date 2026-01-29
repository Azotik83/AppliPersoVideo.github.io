import { useState } from 'react';
import { Search, Plus, Video } from 'lucide-react';
import ProjectCard from '../components/ProjectCard/ProjectCard';
import Modal from '../components/common/Modal';

function Dashboard({ projects, loading, onAddProject, onDeleteProject }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showNewProject, setShowNewProject] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateProject = async () => {
        if (newProjectTitle.trim()) {
            await onAddProject({ title: newProjectTitle.trim() });
            setNewProjectTitle('');
            setShowNewProject(false);
        }
    };

    const statusCounts = {
        all: projects.length,
        draft: projects.filter(p => p.status === 'draft').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        published: projects.filter(p => p.status === 'published').length,
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <header className="header" style={{ marginBottom: 'var(--space-lg)', border: 'none', padding: 0, height: 'auto' }}>
                <h1 className="header-title">My Projects</h1>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                    <div className="search-box">
                        <Search />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
                        <Plus />
                        <span>New Project</span>
                    </button>
                </div>
            </header>

            {/* Status Filter */}
            <div className="status-filter">
                <button
                    className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                >
                    All ({statusCounts.all})
                </button>
                <button
                    className={`status-filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('draft')}
                >
                    Draft ({statusCounts.draft})
                </button>
                <button
                    className={`status-filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('in_progress')}
                >
                    In Progress ({statusCounts.in_progress})
                </button>
                <button
                    className={`status-filter-btn ${statusFilter === 'published' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('published')}
                >
                    Published ({statusCounts.published})
                </button>
            </div>

            {/* Project Grid */}
            {filteredProjects.length > 0 ? (
                <div className="project-grid">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onDelete={onDeleteProject}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Video />
                    <h2 className="empty-state-title">No projects yet</h2>
                    <p className="empty-state-text">Create your first video project to get started</p>
                    <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
                        <Plus />
                        <span>Create Project</span>
                    </button>
                </div>
            )}

            {/* Mobile FAB */}
            <button className="fab" onClick={() => setShowNewProject(true)}>
                <Plus />
            </button>

            {/* New Project Modal */}
            {showNewProject && (
                <Modal
                    title="New Project"
                    onClose={() => setShowNewProject(false)}
                    onConfirm={handleCreateProject}
                    confirmText="Create"
                >
                    <div className="form-group">
                        <label className="form-label">Project Title</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter project title..."
                            value={newProjectTitle}
                            onChange={(e) => setNewProjectTitle(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Dashboard;
