import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Globe, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBlocked: 0,
    totalScanned: 0,
    sitesVisited: 0,
    activeTime: 0,
    weeklyBlocked: [],
    categoryBreakdown: {},
    recentActivity: []
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      // Simulate API call - in real implementation, this would fetch from backend
      setTimeout(() => {
        setStats({
          totalBlocked: 47,
          totalScanned: 1234,
          sitesVisited: 23,
          activeTime: 145, // minutes
          weeklyBlocked: [5, 8, 12, 6, 9, 15, 7],
          categoryBreakdown: {
            'Inappropriate Content': 18,
            'Violence': 12,
            'Hate Speech': 8,
            'Harassment': 6,
            'Other': 3
          },
          recentActivity: [
            {
              id: 1,
              site: 'example.com',
              content: 'Inappropriate text content',
              category: 'Inappropriate Content',
              time: '2 minutes ago',
              action: 'Blocked'
            },
            {
              id: 2,
              site: 'social-media.com',
              content: 'Violent image',
              category: 'Violence',
              time: '15 minutes ago',
              action: 'Blocked'
            },
            {
              id: 3,
              site: 'news-site.com',
              content: 'Hate speech in comments',
              category: 'Hate Speech',
              time: '1 hour ago',
              action: 'Blocked'
            }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };
  
  const weeklyChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Blocked Content',
        data: stats.weeklyBlocked,
        borderColor: '#e53e3e',
        backgroundColor: 'rgba(229, 62, 62, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  const categoryChartData = {
    labels: Object.keys(stats.categoryBreakdown),
    datasets: [
      {
        data: Object.values(stats.categoryBreakdown),
        backgroundColor: [
          '#e53e3e',
          '#ed8936',
          '#d69e2e',
          '#38a169',
          '#3182ce'
        ],
        borderWidth: 0
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };
  
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard...
      </div>
    );
  }
  
  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blocked">
            <Shield />
          </div>
          <div className="stat-number">{stats.totalBlocked}</div>
          <div className="stat-label">Content Blocked Today</div>
          <div className="stat-change positive">
            <TrendingUp size={12} /> +12% from yesterday
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon scanned">
            <Eye />
          </div>
          <div className="stat-number">{stats.totalScanned.toLocaleString()}</div>
          <div className="stat-label">Items Scanned</div>
          <div className="stat-change positive">
            <TrendingUp size={12} /> +8% from yesterday
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon sites">
            <Globe />
          </div>
          <div className="stat-number">{stats.sitesVisited}</div>
          <div className="stat-label">Sites Visited</div>
          <div className="stat-change negative">
            <TrendingDown size={12} /> -3% from yesterday
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon time">
            <Clock />
          </div>
          <div className="stat-number">{Math.floor(stats.activeTime / 60)}h {stats.activeTime % 60}m</div>
          <div className="stat-label">Active Browsing Time</div>
          <div className="stat-change positive">
            <TrendingUp size={12} /> +15% from yesterday
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Weekly Blocked Content</h3>
              <p className="card-subtitle">Content blocked over the past 7 days</p>
            </div>
          </div>
          <Line data={weeklyChartData} options={chartOptions} />
        </div>
        
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Content Categories</h3>
              <p className="card-subtitle">Breakdown by type</p>
            </div>
          </div>
          <Doughnut data={categoryChartData} options={doughnutOptions} />
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Activity</h3>
            <p className="card-subtitle">Latest blocked content</p>
          </div>
          <a href="/activity" className="btn btn-secondary">View All</a>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th>Website</th>
              <th>Content Type</th>
              <th>Category</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentActivity.map(activity => (
              <tr key={activity.id}>
                <td>{activity.site}</td>
                <td>{activity.content}</td>
                <td>
                  <span className="badge blocked">{activity.category}</span>
                </td>
                <td>{activity.time}</td>
                <td>
                  <span className="badge blocked">{activity.action}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Quick Actions</h3>
            <p className="card-subtitle">Common tasks</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">
            <Shield size={16} />
            Adjust Protection Level
          </button>
          <button className="btn btn-secondary">
            <Globe size={16} />
            Manage Allowlist
          </button>
          <button className="btn btn-secondary">
            <AlertTriangle size={16} />
            Review Flagged Content
          </button>
          <button className="btn btn-secondary">
            <Clock size={16} />
            Set Time Limits
          </button>
        </div>
      </div>
    </div>
  );
};
