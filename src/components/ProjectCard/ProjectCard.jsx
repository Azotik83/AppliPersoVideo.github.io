import { useNavigate } from 'react-router-dom';
import { Play, MoreVertical } from 'lucide-react';

function ProjectCard({ project, onDelete }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/project/${project.id}`);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            onDelete(project.id);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'badge-draft',
            in_progress: 'badge-in-progress',
            published: 'badge-published'
        };
        const labels = {
            draft: 'Draft',
            in_progress: 'In Progress',
            published: 'Published'
        };
        return (
            <span className={`badge ${badges[status] || 'badge-draft'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="card project-card" onClick={handleClick}>
            <div className="project-card-thumbnail">
                {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.title} />
                ) : (
                    <Play />
                )}
            </div>
            <div className="project-card-content">
                <h3 className="project-card-title">{project.title}</h3>
                <p className="project-card-date">{formatDate(project.createdAt)}</p>
                <div className="project-card-tags">
                    {getStatusBadge(project.status)}
                    {project.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="badge badge-draft">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProjectCard;
