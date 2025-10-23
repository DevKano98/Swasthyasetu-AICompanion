import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken, getStats, resetSessions } from '../services/api';
import MoodChart from '../components/MoodChart';
import ChatInterface from '../components/ChatInterface';

export default function Dashboard() {
  const [user, setUser] = useState(null); // store full user object
  const [stats, setStats] = useState({ sessionsCompleted: 0, totalHours: 0, moodImprovementPercent: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) setUser(storedUser);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getStats();
        setStats(res.data);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  // Handle reset sessions
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all session data? This action cannot be undone.')) {
      try {
        await resetSessions(user.id);
        // Update local state to reflect reset
        setStats({ sessionsCompleted: 0, totalHours: 0, moodImprovementPercent: 0 });
        alert('Session data has been reset successfully.');
      } catch (error) {
        console.error('Error resetting sessions:', error);
        alert('Failed to reset session data. Please try again.');
      }
    }
  };

  if (!user) return <div className="p-4">Please log in</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-sm text-gray-600 mt-1">Good to see you, {user.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {(user.username && user.username.charAt(0)) || 'U'}
                </span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setAuthToken(null);
                  navigate('/login');
                }}
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm border border-blue-600"
              >
                Logout
              </button>
              <button
                onClick={handleReset}
                className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm border border-red-600"
              >
                Reset Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ChatInterface userId={user.id} />
          </div>
          <div>
            <MoodChart userId={user.id} />
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Sessions Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.sessionsCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Mood Improvement</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.moodImprovementPercent > 0 ? `+${stats.moodImprovementPercent}%` : `${stats.moodImprovementPercent}%`}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalHours}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}