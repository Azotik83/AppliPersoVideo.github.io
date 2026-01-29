import { NavLink } from 'react-router-dom';
import { Home, Calendar, Settings, Plus } from 'lucide-react';

function MobileNav() {
    return (
        <nav className="mobile-nav">
            <NavLink
                to="/"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                end
            >
                <Home />
                <span>Home</span>
            </NavLink>
            <NavLink
                to="/calendar"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
                <Calendar />
                <span>Calendar</span>
            </NavLink>
            <NavLink
                to="/settings"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
                <Settings />
                <span>Settings</span>
            </NavLink>
        </nav>
    );
}

export default MobileNav;
