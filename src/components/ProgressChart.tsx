'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartPoint } from '@/types';

interface ProgressChartProps {
  data: ChartPoint[];
  label: string;
  unit: string;
  color?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#888] mb-1">{formatDate(label)}</p>
      <p className="text-white font-semibold">
        {payload[0].value} <span className="text-[#FF5722]">{unit}</span>
      </p>
    </div>
  );
}

export default function ProgressChart({
  data,
  label,
  unit,
  color = '#FF5722',
}: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-[#444] text-sm">
        —
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-[#888] font-medium mb-3 uppercase tracking-wider">{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.slice(1)})`}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
