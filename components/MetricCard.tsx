import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: "default" | "red" | "green" | "blue" | "yellow";
  icon?: React.ReactNode;
}

const colorMap = {
  default: "bg-white border-gray-200 text-gray-900",
  red: "bg-red-50 border-red-200 text-red-900",
  green: "bg-green-50 border-green-200 text-green-900",
  blue: "bg-blue-50 border-blue-200 text-blue-900",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, color = "default", icon }) => {
  return (
    <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${colorMap[color]}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium opacity-70 uppercase tracking-wider">{label}</h3>
        {icon && <div className="text-xl opacity-80">{icon}</div>}
      </div>
      <div>
        <div className="text-3xl font-bold">{value}</div>
        {subtext && <p className="text-xs mt-1 opacity-70">{subtext}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
