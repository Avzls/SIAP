'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataItem {
  month: string;
  count: number;
}

interface MonthlyTrendChartProps {
  data: DataItem[];
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        Belum ada data trend
      </div>
    );
  }

  // Format month to be more readable (e.g., "2024-12" -> "Des 2024")
  const formattedData = data.map(item => ({
    ...item,
    monthLabel: new Date(item.month + '-01').toLocaleDateString('id-ID', { 
      month: 'short', 
      year: 'numeric' 
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="monthLabel" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#3B82F6" 
          strokeWidth={2}
          name="Jumlah Aset"
          dot={{ fill: '#3B82F6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
