import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings as SettingsIcon, 
  BarChart, 
  Shield, 
  LogOut 
} from 'lucide-react';

export const Layout = ({ children }) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Dashboard',
          subtitle: 'Overview of your child\'s browsing protection'
        };
      case '/activity':
        return {
          title: 'Activity Log',
          subtitle: 'Detailed history of blocked content'
        };
      case '/settings':
        return {
          title: 'Settings',
          subtitle: 'Configure AI-Firewall protection'
        };
      case '/reports':
        return {
          title: 'Reports',
          subtitle: 'Detailed analytics and insights'
        };
      default:
        return {
          title: 'AI-Firewall',
          subtitle: 'Parental Dashboard'
        };
    }
  };
  
  const pageInfo = getPageTitle();
  
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🛡️</span>
            <span className="logo-text">AI-Firewall</span>
          </div>
          <div className="logo-subtitle">Parental Dashboard</div>
        </div>
        
        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard className="nav-icon" />
            Dashboard
          </NavLink>
          
          <NavLink to="/activity" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <ClipboardList className="nav-icon" />
            Activity Log
          </NavLink>
          
          <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <BarChart className="nav-icon" />
            Reports
          </NavLink>
          
          <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <SettingsIcon className="nav-icon" />
            Settings
          </NavLink>
        </nav>
        
        <div style={{ marginTop: 'auto', padding: '20px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="nav-item">
            <Shield className="nav-icon" />
            AI-Firewall v1.0.0
          </div>
          <a href="#" className="nav-item" onClick={() => alert('Logout functionality would go here')}>
            <LogOut className="nav-icon" />
            Logout
          </a>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="content-header">
          <h1 className="page-title">{pageInfo.title}</h1>
          <p className="page-subtitle">{pageInfo.subtitle}</p>
        </header>
        
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};
