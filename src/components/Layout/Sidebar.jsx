import { NavLink } from 'react-router-dom';
import { Home, Calendar, Settings, Play } from 'lucide-react';

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Play />
                    <span>Video Manager</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    end
                >
                    <Home />
                    <span>Home</span>
                </NavLink>
                <NavLink
                    to="/calendar"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Calendar />
                    <span>Calendar</span>
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Settings />
                    <span>Settings</span>
                </NavLink>
            </nav>
        </aside>
    );
}

export default Sidebar;
