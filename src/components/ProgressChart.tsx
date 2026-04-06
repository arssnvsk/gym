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
import { useTheme } from '@/components/ThemeProvider';

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
function CustomTooltip({ active, payload, label, unit, tooltipBg, tooltipBorder, tooltipDate, tooltipText }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl border"
      style={{ background: tooltipBg, borderColor: tooltipBorder }}
    >
      <p className="mb-1" style={{ color: tooltipDate }}>{formatDate(label)}</p>
      <p className="font-semibold" style={{ color: tooltipText }}>
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
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  const gridColor    = isDark ? '#1F1F1F' : '#E0E0E0';
  const tickColor    = isDark ? '#555555' : '#888888';
  const tooltipBg    = isDark ? '#1A1A1A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#2A2A2A' : '#E0E0E0';
  const tooltipDate  = isDark ? '#888888' : '#616161';
  const tooltipText  = isDark ? '#ffffff' : '#111111';
  const labelColor   = isDark ? '#888888' : '#424242';

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-[var(--t-icon)] text-sm">
        —
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: labelColor }}>{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={
              <CustomTooltip
                unit={unit}
                tooltipBg={tooltipBg}
                tooltipBorder={tooltipBorder}
                tooltipDate={tooltipDate}
                tooltipText={tooltipText}
              />
            }
          />
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
