import { useEffect, useState } from 'react';
import { getMoodTrends } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MoodChart({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await getMoodTrends(userId);
        const sessions = res.data?.sessions || [];
        const combined = [];
        let counter = 1;
        for (const session of sessions) {
          for (const point of (session.data || [])) {
            combined.push({ index: counter++, score: Number(point.score) });
          }
        }
        setData(combined);
      } catch (err) {
        console.error('Error fetching mood trends:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm font-medium">{`Day: ${label}`}</p>
          <p className="text-sm">{`Score: ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Mood Trend</h3>
        <p className="text-sm text-gray-600">
          Track your mood progression before and during therapy sessions
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-500">Loading mood data...</p>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <h3 className="mt-4 text-lg font-medium text-gray-900">No mood data</h3>
            <p className="mt-2 text-sm text-gray-500">
              Complete some therapy sessions to see your mood trends.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Simple legend */}
          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Mood over messages</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <XAxis
                  dataKey="index"
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Message #', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#6b7280' } }}
                />
                <YAxis
                  domain={[-1, 1]}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Mood Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Mood Scale Reference */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Mood Scale Reference</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-600">-1.0 to -0.3: Low mood</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600">-0.3 to 0.3: Neutral</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">0.3 to 1.0: Positive mood</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
