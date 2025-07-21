import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  useEffect(() => {
    loadActivityData();
  }, []);
  
  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, filterCategory, filterAction]);
  
  const loadActivityData = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockActivities = generateMockActivities(100);
        setActivities(mockActivities);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading activity data:', error);
      setLoading(false);
    }
  };
  
  const generateMockActivities = (count) => {
    const sites = ['example.com', 'social-media.com', 'news-site.com', 'forum.com', 'video-site.com'];
    const categories = ['Inappropriate Content', 'Violence', 'Hate Speech', 'Harassment', 'Drugs', 'Weapons'];
    const actions = ['Blocked', 'Allowed', 'Flagged'];
    const contentTypes = ['Text', 'Image', 'Video', 'Link'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      site: sites[Math.floor(Math.random() * sites.length)],
      contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      confidence: (Math.random() * 0.4 + 0.6).toFixed(2),
      content: `Sample ${contentTypes[Math.floor(Math.random() * contentTypes.length)].toLowerCase()} content that was ${actions[Math.floor(Math.random() * actions.length)].toLowerCase()}`,
      url: `https://${sites[Math.floor(Math.random() * sites.length)]}/page${i}`
    }));
  };
  
  const filterActivities = () => {
    let filtered = activities;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === filterCategory);
    }
    
    // Action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(activity => activity.action === filterAction);
    }
    
    setFilteredActivities(filtered);
    setCurrentPage(1);
  };
  
  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Site', 'Content Type', 'Category', 'Action', 'Confidence', 'URL'],
      ...filteredActivities.map(activity => [
        activity.timestamp.toISOString(),
        activity.site,
        activity.contentType,
        activity.category,
        activity.action,
        activity.confidence,
        activity.url
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-firewall-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'Blocked':
        return 'badge blocked';
      case 'Allowed':
        return 'badge allowed';
      case 'Flagged':
        return 'badge warning';
      default:
        return 'badge';
    }
  };
  
  const getActionIcon = (action) => {
    switch (action) {
      case 'Blocked':
        return <EyeOff size={14} />;
      case 'Allowed':
        return <Eye size={14} />;
      case 'Flagged':
        return <AlertTriangle size={14} />;
      default:
        return null;
    }
  };
  
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading activity log...
      </div>
    );
  }
  
  return (
    <div>
      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
              <input
                type="text"
                placeholder="Search activities..."
                className="form-input"
                style={{ paddingLeft: '44px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="form-select"
            style={{ minWidth: '150px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Inappropriate Content">Inappropriate Content</option>
            <option value="Violence">Violence</option>
            <option value="Hate Speech">Hate Speech</option>
            <option value="Harassment">Harassment</option>
            <option value="Drugs">Drugs</option>
            <option value="Weapons">Weapons</option>
          </select>
          
          <select
            className="form-select"
            style={{ minWidth: '120px' }}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="Blocked">Blocked</option>
            <option value="Allowed">Allowed</option>
            <option value="Flagged">Flagged</option>
          </select>
          
          <button className="btn btn-secondary" onClick={exportData}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="card">
        <p>
          Showing {currentActivities.length} of {filteredActivities.length} activities
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>
      
      {/* Activity Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Website</th>
              <th>Content</th>
              <th>Category</th>
              <th>Action</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {currentActivities.map(activity => (
              <tr key={activity.id}>
                <td>{formatTimestamp(activity.timestamp)}</td>
                <td>
                  <div>
                    <div style={{ fontWeight: '600' }}>{activity.site}</div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>{activity.contentType}</div>
                  </div>
                </td>
                <td>
                  <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activity.content}
                  </div>
                </td>
                <td>
                  <span className="badge blocked">{activity.category}</span>
                </td>
                <td>
                  <span className={getActionBadgeClass(activity.action)}>
                    {getActionIcon(activity.action)}
                    {activity.action}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '4px', 
                      background: '#e2e8f0', 
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${activity.confidence * 100}%`,
                        height: '100%',
                        background: activity.confidence > 0.8 ? '#e53e3e' : activity.confidence > 0.6 ? '#ed8936' : '#38a169'
                      }}></div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#718096' }}>
                      {(activity.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            
            <span style={{ padding: '0 16px', color: '#718096' }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              className="btn btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
