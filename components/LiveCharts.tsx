import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { HealthMetrics } from '../types';

interface LiveChartsProps {
  data: HealthMetrics[];
}

const LiveCharts: React.FC<LiveChartsProps> = ({ data }) => {
  // Format timestamp for X-Axis
  const formattedData = data.map(d => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
      {/* Heart Rate Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">Heart Rate (BPM)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="time" hide />
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stress Score Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">Stress Index</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <ReferenceLine y={75} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'top', value: 'High', fill: '#d97706', fontSize: 10 }} />
            <Line
              type="stepAfter"
              dataKey="stressScore"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 2 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LiveCharts;
